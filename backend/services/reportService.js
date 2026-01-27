import PDFDocument from 'pdfkit';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import effortMetricsService from './effortMetricsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportService {
  /**
   * Genera un reporte completo de seguimiento en PDF
   */
  async generateWeeklyReport() {
    try {
      // Crear directorio de reportes si no existe
      const reportsDir = path.join(__dirname, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `reporte-semanal-${timestamp}.pdf`;
      const filepath = path.join(reportsDir, filename);

      // Obtener datos para el reporte
      console.log('📊 Recopilando datos del reporte...');
      const reportData = await this.collectReportData();
      console.log(`✓ Datos recopilados: ${reportData.userMetrics.length} usuarios, ${reportData.projectMetrics.length} proyectos`);

      // Crear documento PDF
      console.log('📄 Creando documento PDF...');
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filepath);
      
      // Retornar una promesa que se resuelve cuando el stream termina
      return new Promise((resolve, reject) => {
        stream.on('error', (err) => {
          console.error('❌ Error en stream:', err);
          reject(err);
        });

        stream.on('finish', () => {
          console.log(`✓ PDF guardado exitosamente: ${filename}`);
          resolve({ filepath, filename, reportData });
        });

        doc.pipe(stream);

        // Generar contenido del PDF
        try {
          this.generatePDFContent(doc, reportData);
          doc.end();
          console.log('✓ Contenido del PDF generado, cerrando documento...');
        } catch (err) {
          console.error('❌ Error generando contenido:', err);
          doc.end();
          reject(err);
        }
      });
    } catch (error) {
      console.error('❌ Error en generateWeeklyReport:', error);
      throw error;
    }
  }

  /**
   * Recopila todos los datos necesarios para el reporte
   */
  async collectReportData() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Obtener todos los usuarios activos
    const users = await User.find({ status: 'approved' })
      .select('name email role')
      .lean();

    // Obtener todos los proyectos activos
    const projects = await Project.find({ 
      archived: false,
      name: { 
        $nin: ['Rediseño Web', 'Pagina Web', 'Desarrollo App', 'rediseño web', 'pagina web', 'desarrollo app'] 
      }
    })
      .select('name owner members archived')
      .populate('members.user', 'name email')
      .lean();

    // Obtener todas las tareas CON métricas de esfuerzo completas
    const allTasks = await Task.find({ archived: false })
      .select('title completed assignedTo project dueDate completedAt archived effortMetrics')
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .lean();

    // Métricas por usuario
    const userMetrics = await Promise.all(users.map(async (user) => {
      const userTasks = allTasks.filter(task => 
        task.assignedTo.some(assignee => assignee._id.toString() === user._id.toString())
      );

      const completedTasks = userTasks.filter(t => t.completed).length;
      const pendingTasks = userTasks.filter(t => !t.completed).length;
      const overdueTasks = userTasks.filter(t => 
        !t.completed && t.dueDate && new Date(t.dueDate) < now
      ).length;
      const dueSoonTasks = userTasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      }).length;
      const pendingValidation = userTasks.filter(t => t.pendingValidation).length;
      
      // Tareas completadas esta semana
      const completedThisWeek = userTasks.filter(t => 
        t.completed && t.completedAt && new Date(t.completedAt) >= oneWeekAgo
      ).length;

      // Tasa de cumplimiento
      const totalTasks = userTasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

      // 🆕 Métricas de bloqueo del usuario
      const userBlockAnalysis = effortMetricsService.analyzeBlockHistory(userTasks);
      const totalBlockedHours = userTasks.reduce((sum, t) => 
        sum + (t.effortMetrics?.blockedHours || 0), 0
      );
      const activelyBlockedTasks = userTasks.filter(t => 
        t.effortMetrics?.blockedBy && t.effortMetrics.blockedBy !== 'none'
      ).length;

      // 🆕 Métricas de esfuerzo completas
      const totalEstimatedHours = userTasks.reduce((sum, t) => 
        sum + (t.effortMetrics?.estimatedHours || 0), 0
      );
      const totalActualHours = userTasks.reduce((sum, t) => 
        sum + (t.effortMetrics?.actualHours || 0), 0
      );
      const totalEffectiveHours = userTasks.reduce((sum, t) => 
        sum + (t.effortMetrics?.effectiveHours || 0), 0
      );
      const avgEfficiency = userTasks.length > 0 
        ? userTasks.reduce((sum, t) => sum + (t.effortMetrics?.efficiency || 0), 0) / userTasks.length 
        : 0;
      const tasksWithTracking = userTasks.filter(t => 
        t.effortMetrics?.timeTracking && t.effortMetrics.timeTracking.length > 0
      ).length;

      // Tareas por proyecto
      const tasksByProject = {};
      userTasks.forEach(task => {
        const projectName = task.project?.name || 'Sin proyecto';
        if (!tasksByProject[projectName]) {
          tasksByProject[projectName] = {
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0
          };
        }
        tasksByProject[projectName].total++;
        if (task.completed) tasksByProject[projectName].completed++;
        else tasksByProject[projectName].pending++;
        if (!task.completed && task.dueDate && new Date(task.dueDate) < now) {
          tasksByProject[projectName].overdue++;
        }
      });

      return {
        user,
        metrics: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          dueSoonTasks,
          pendingValidation,
          completedThisWeek,
          completionRate,
          // 🆕 Métricas de bloqueo
          totalBlockedHours: totalBlockedHours.toFixed(2),
          activelyBlockedTasks,
          blockIncidents: userBlockAnalysis.totalBlockIncidents,
          mostCommonBlock: userBlockAnalysis.mostCommonBlockReason || 'Ninguno',
          // 🆕 Métricas de esfuerzo completas
          estimatedHours: totalEstimatedHours.toFixed(2),
          actualHours: totalActualHours.toFixed(2),
          effectiveHours: totalEffectiveHours.toFixed(2),
          efficiency: avgEfficiency.toFixed(2),
          tasksWithTracking,
          trackingCoverage: totalTasks > 0 ? ((tasksWithTracking / totalTasks) * 100).toFixed(1) : 0
        },
        tasksByProject
      };
    }));

    // Métricas por proyecto
    const projectMetrics = projects.map(project => {
      const projectTasks = allTasks.filter(t => 
        t.project && t.project._id.toString() === project._id.toString()
      );

      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.completed).length;
      const pendingTasks = projectTasks.filter(t => !t.completed).length;
      const overdueTasks = projectTasks.filter(t => 
        !t.completed && t.dueDate && new Date(t.dueDate) < now
      ).length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

      // Tareas completadas esta semana
      const completedThisWeek = projectTasks.filter(t => 
        t.completed && t.completedAt && new Date(t.completedAt) >= oneWeekAgo
      ).length;

      return {
        name: project.name,
        members: project.members.length,
        metrics: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completedThisWeek,
          progress
        }
      };
    });

    // Métricas generales
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.completed).length;
    const pendingTasks = allTasks.filter(t => !t.completed).length;
    const overdueTasks = allTasks.filter(t => 
      !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length;
    const completedThisWeek = allTasks.filter(t => 
      t.completed && t.completedAt && new Date(t.completedAt) >= oneWeekAgo
    ).length;
    const globalCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

    // 🆕 Análisis de bloqueos global
    const blockAnalysis = effortMetricsService.analyzeBlockHistory(allTasks);

    return {
      generatedAt: now,
      period: { from: oneWeekAgo, to: now },
      globalMetrics: {
        totalProjects: projects.length,
        totalUsers: users.length,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completedThisWeek,
        globalCompletionRate
      },
      // 🆕 Análisis global de bloqueos
      blockAnalysis,
      userMetrics,
      projectMetrics
    };
  }

  /**
   * Genera conclusión personalizada basada en las métricas del usuario
   */
  generateUserConclusion(metrics) {
    const evaluation = [];
    const recommendations = [];

    // Evaluar tasa de cumplimiento
    if (metrics.completionRate >= 80) {
      evaluation.push(`Excelente desempeño con ${metrics.completionRate}% de cumplimiento.`);
    } else if (metrics.completionRate >= 60) {
      evaluation.push(`Desempeño satisfactorio con ${metrics.completionRate}% de cumplimiento.`);
      recommendations.push('Revisar prioridades para mejorar la tasa de finalizacion');
    } else if (metrics.completionRate >= 40) {
      evaluation.push(`Desempeño por debajo del esperado (${metrics.completionRate}%).`);
      recommendations.push('Se requiere seguimiento cercano y redistribucion de carga de trabajo');
    } else {
      evaluation.push(`Desempeño critico con solo ${metrics.completionRate}% de tareas completadas.`);
      recommendations.push('Reunion urgente para identificar obstaculos y replantear estrategia');
    }

    // Evaluar tareas atrasadas
    if (metrics.overdueTasks > 5) {
      evaluation.push(`ALERTA: ${metrics.overdueTasks} tareas atrasadas requieren atencion inmediata.`);
      recommendations.push('Priorizar resolucion de tareas atrasadas antes de nuevas asignaciones');
    } else if (metrics.overdueTasks > 0) {
      evaluation.push(`${metrics.overdueTasks} tarea(s) pendiente(s) de vencimiento.`);
    }

    // Evaluar eficiencia
    if (metrics.efficiency >= 85) {
      evaluation.push(`Alta eficiencia (${metrics.efficiency}%) indica uso optimo del tiempo.`);
    } else if (metrics.efficiency >= 70) {
      evaluation.push(`Eficiencia aceptable (${metrics.efficiency}%).`);
    } else if (metrics.efficiency < 70 && metrics.actualHours > 0) {
      evaluation.push(`Eficiencia baja (${metrics.efficiency}%) sugiere perdidas de tiempo.`);
      recommendations.push('Analizar causas de baja productividad (bloqueos, interrupciones, etc.)');
    }

    // Evaluar bloqueos
    if (metrics.blockIncidents > 3) {
      evaluation.push(`CRITICO: ${metrics.blockIncidents} bloqueos registrados (${metrics.totalBlockedHours}h perdidas).`);
      recommendations.push(`Resolver bloqueos recurrentes: tipo mas comun "${metrics.mostCommonBlock}"`);
    } else if (metrics.blockIncidents > 0) {
      evaluation.push(`${metrics.blockIncidents} bloqueo(s) identificado(s).`);
    }

    // Evaluar tracking
    if (metrics.trackingCoverage < 50 && metrics.totalTasks > 5) {
      recommendations.push('Mejorar registro de horas: solo ' + metrics.trackingCoverage + '% de tareas tienen seguimiento');
    }

    // Conclusión final
    const conclusionText = evaluation.join(' ');
    
    return {
      evaluation: conclusionText,
      recommendations
    };
  }

  /**
   * Genera el contenido del PDF
   */
  generatePDFContent(doc, data) {
    const { generatedAt, period, globalMetrics, blockAnalysis, userMetrics, projectMetrics } = data;

    // Encabezado con diseño profesional
    this.addHeader(doc, generatedAt, period);
    doc.moveDown(1.5);

    // RESUMEN GENERAL
    this.addSectionTitle(doc, 'RESUMEN GENERAL');
    doc.moveDown(0.5);

    this.addMetricBox(doc, [
      { label: 'Proyectos Activos', value: globalMetrics.totalProjects, color: '#3b82f6', bgColor: '#dbeafe' },
      { label: 'Usuarios Activos', value: globalMetrics.totalUsers, color: '#8b5cf6', bgColor: '#ede9fe' },
      { label: 'Tareas Totales', value: globalMetrics.totalTasks, color: '#06b6d4', bgColor: '#cffafe' },
      { label: 'Tasa de Cumplimiento', value: `${globalMetrics.globalCompletionRate}%`, color: '#10b981', bgColor: '#d1fae5' }
    ]);

    doc.moveDown(0.8);
    this.addMetricBox(doc, [
      { label: 'Tareas Completadas', value: globalMetrics.completedTasks, color: '#10b981', bgColor: '#d1fae5' },
      { label: 'Tareas Pendientes', value: globalMetrics.pendingTasks, color: '#f59e0b', bgColor: '#fef3c7' },
      { label: 'Tareas Atrasadas', value: globalMetrics.overdueTasks, color: '#ef4444', bgColor: '#fee2e2' },
      { label: 'Completadas Esta Semana', value: globalMetrics.completedThisWeek, color: '#6366f1', bgColor: '#e0e7ff' }
    ]);

    // ANALISIS DE BLOQUEOS
    if (blockAnalysis && blockAnalysis.totalBlockedTasks > 0) {
      doc.moveDown(1.0);
      this.addSectionTitle(doc, 'ANALISIS DE BLOQUEOS');
      doc.moveDown(0.4);

      this.addMetricBox(doc, [
        { label: 'Tareas con Bloqueos', value: blockAnalysis.totalBlockedTasks, color: '#ef4444', bgColor: '#fee2e2' },
        { label: 'Total Incidentes', value: blockAnalysis.totalBlockIncidents, color: '#f97316', bgColor: '#fed7aa' },
        { label: 'Horas Bloqueadas', value: blockAnalysis.totalBlockedHours.toFixed(1), color: '#f59e0b', bgColor: '#fef3c7' },
        { label: 'Promedio por Bloqueo', value: `${blockAnalysis.avgBlockDuration.toFixed(1)}h`, color: '#84cc16', bgColor: '#ecfccb' }
      ]);

      doc.moveDown(0.6);

      // Bloqueos por tipo
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
        .text('Bloqueos por Tipo:', 70);
      doc.moveDown(0.2);
      doc.fontSize(9).font('Helvetica').fillColor('#64748b');

      const blockTypes = [
        { key: 'external', label: 'Externos' },
        { key: 'dependency', label: 'Dependencias' },
        { key: 'approval', label: 'Aprobaciones' },
        { key: 'information', label: 'Informacion' }
      ];

      blockTypes.forEach(({ key, label }) => {
        const count = blockAnalysis.blocksByType[key] || 0;
        if (count > 0) {
          doc.text(`  - ${label}: ${count} incidentes`, { indent: 10 });
        }
      });

      if (blockAnalysis.mostCommonBlockReason && blockAnalysis.mostCommonBlockReason !== 'Sin especificar') {
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b')
          .text('Razón más común: ', 70, doc.y, { continued: true })
          .font('Helvetica').fillColor('#64748b')
          .text(blockAnalysis.mostCommonBlockReason);
      }

      // Impacto en porcentaje
      if (blockAnalysis.impactPercentage > 0) {
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#ef4444')
          .text(`ALERTA - Impacto: ${blockAnalysis.impactPercentage.toFixed(1)}% del tiempo total en bloqueos`, 70);
      }
    }

    doc.moveDown(1);

    // DESEMPEÑO POR PROYECTO
    if (projectMetrics.length > 0) {
      this.addNewPageIfNeeded(doc, 200);
      this.addSectionTitle(doc, 'DESEMPEÑO POR PROYECTO');
      doc.moveDown(0.5);

      projectMetrics.forEach((project, index) => {
        this.addNewPageIfNeeded(doc, 130);
        
        // Caja del proyecto con borde
        const projectBoxY = doc.y;
        doc.roundedRect(60, projectBoxY, 480, 105, 5)
          .fillAndStroke('#f8fafc', '#cbd5e1');
        
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e293b')
          .text(`${index + 1}. ${project.name}`, 75, projectBoxY + 12);
        doc.fontSize(9).font('Helvetica').fillColor('#64748b')
          .text(`Miembros del equipo: ${project.members}`, 75, projectBoxY + 32);
        
        doc.y = projectBoxY + 52;

        this.addMetricRow(doc, [
          { label: 'Total', value: project.metrics.totalTasks, color: '#3b82f6' },
          { label: 'Completadas', value: project.metrics.completedTasks, color: '#10b981' },
          { label: 'Pendientes', value: project.metrics.pendingTasks, color: '#f59e0b' },
          { label: 'Atrasadas', value: project.metrics.overdueTasks, color: '#ef4444' }
        ]);

        // Barra de progreso dentro de la caja
        const progressBarY = projectBoxY + 90;
        this.drawProgressBar(doc, 75, progressBarY, 420, project.metrics.progress);
        
        doc.y = projectBoxY + 110;
        doc.moveDown(0.4);
      });
    }

    // DESEMPEÑO POR USUARIO
    if (userMetrics.length > 0) {
      doc.addPage();
      this.addSectionTitle(doc, 'DESEMPEÑO POR USUARIO');
      doc.moveDown(0.5);

      userMetrics.forEach((userData, index) => {
        // Verificar si es necesario nueva página (cada usuario necesita mínimo 500px)
        this.addNewPageIfNeeded(doc, 550);

        // === ENCABEZADO DEL USUARIO ===
        const userBoxY = doc.y;
        doc.roundedRect(60, userBoxY, 480, 55, 5)
          .fill('#1e40af');
        
        // Nombre y email
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
          .text(`${index + 1}. ${userData.user.name}`, 75, userBoxY + 12);
        doc.fontSize(9).font('Helvetica').fillColor('#93c5fd')
          .text(userData.user.email, 75, userBoxY + 32);
        
        // Badge de rol
        const badgeX = 430;
        const badgeColor = userData.user.role === 'administrador' ? '#f59e0b' : '#10b981';
        doc.roundedRect(badgeX, userBoxY + 15, 95, 25, 3)
          .fill(badgeColor);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
          .text(userData.user.role === 'administrador' ? 'ADMIN' : 'USUARIO', badgeX + 15, userBoxY + 20);
        
        doc.y = userBoxY + 65;

        // === INDICADORES CLAVE (KPIs) ===
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
          .text('INDICADORES CLAVE', 70);
        doc.moveDown(0.4);
        
        // KPIs principales en cajas destacadas
        this.addMetricBox(doc, [
          { label: 'Tasa Cumplimiento', value: `${userData.metrics.completionRate}%`, color: '#667eea', bgColor: '#e0e7ff' },
          { label: 'Eficiencia', value: `${userData.metrics.efficiency}%`, color: '#06b6d4', bgColor: '#cffafe' },
          { label: 'Estado', value: userData.metrics.overdueTasks === 0 ? 'Al dia' : `${userData.metrics.overdueTasks} atrasadas`, color: userData.metrics.overdueTasks === 0 ? '#10b981' : '#ef4444', bgColor: userData.metrics.overdueTasks === 0 ? '#d1fae5' : '#fee2e2' }
        ]);

        doc.moveDown(0.6);

        // === SECCION: ESTADO DE TAREAS ===
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
          .text('ESTADO DE TAREAS', 70);
        doc.moveDown(0.3);
        
        this.addMetricRow(doc, [
          { label: 'Total', value: userData.metrics.totalTasks, color: '#64748b' },
          { label: 'Completadas', value: userData.metrics.completedTasks, color: '#10b981' },
          { label: 'Pendientes', value: userData.metrics.pendingTasks, color: '#f59e0b' },
          { label: 'Atrasadas', value: userData.metrics.overdueTasks, color: '#ef4444' }
        ]);

        doc.moveDown(0.15);
        this.addMetricRow(doc, [
          { label: 'Por Vencer (7d)', value: userData.metrics.dueSoonTasks, color: '#f59e0b' },
          { label: 'Por Validar', value: userData.metrics.pendingValidation, color: '#6366f1' },
          { label: 'Esta Semana', value: userData.metrics.completedThisWeek, color: '#10b981' },
          { label: 'Cobertura Tracking', value: `${userData.metrics.trackingCoverage}%`, color: '#14b8a6' }
        ]);

        doc.moveDown(0.6);

        // === SECCION: ANALISIS DE BLOQUEOS ===
        if (userData.metrics.blockIncidents > 0 || userData.metrics.totalBlockedHours > 0) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
            .text('ANALISIS DE BLOQUEOS', 70);
          doc.moveDown(0.3);
          
          this.addMetricRow(doc, [
            { label: 'Horas Bloqueadas', value: `${userData.metrics.totalBlockedHours}h`, color: '#f59e0b' },
            { label: 'Tareas Bloqueadas', value: userData.metrics.activelyBlockedTasks, color: '#ef4444' },
            { label: 'Incidentes', value: userData.metrics.blockIncidents, color: '#f97316' },
            { label: 'Tipo Comun', value: userData.metrics.mostCommonBlock, color: '#84cc16' }
          ]);

          doc.moveDown(0.6);
        }

        // === SECCION: METRICAS DE ESFUERZO ===
        this.addNewPageIfNeeded(doc, 100);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
          .text('METRICAS DE ESFUERZO', 70);
        doc.moveDown(0.3);
        
        this.addMetricRow(doc, [
          { label: 'Hrs Estimadas', value: `${userData.metrics.estimatedHours}h`, color: '#3b82f6' },
          { label: 'Hrs Reales', value: `${userData.metrics.actualHours}h`, color: '#10b981' },
          { label: 'Hrs Efectivas', value: `${userData.metrics.effectiveHours}h`, color: '#8b5cf6' },
          { label: 'Con Tracking', value: userData.metrics.tasksWithTracking, color: '#6366f1' }
        ]);

        doc.moveDown(0.6);

        // === SECCION: TAREAS POR PROYECTO ===
        if (Object.keys(userData.tasksByProject).length > 0) {
          const projectCount = Object.keys(userData.tasksByProject).length;
          const projectListHeight = Math.min(projectCount * 15 + 10, 120);
          
          // Verificar espacio antes de la sección
          this.addNewPageIfNeeded(doc, projectListHeight + 80);
          
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
            .text('DISTRIBUCION POR PROYECTO', 70);
          doc.moveDown(0.3);
          
          // Fondo para la lista
          const projectListY = doc.y;
          
          doc.roundedRect(70, projectListY, 460, projectListHeight, 3)
            .fill('#f8fafc');
          
          doc.fontSize(9).font('Helvetica').fillColor('#334155');
          let currentY = projectListY + 8;
          
          Object.entries(userData.tasksByProject).forEach(([projectName, stats]) => {
            const completionPerc = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0;
            const statusIcon = completionPerc >= 80 ? '[OK]' : completionPerc >= 50 ? '[!]' : '[X]';
            
            doc.text(
              `${statusIcon} ${projectName}: ${stats.completed}/${stats.total} (${completionPerc}%)` +
              (stats.overdue > 0 ? ` - ALERTA: ${stats.overdue} atrasadas` : ''),
              80, currentY
            );
            currentY += 15;
          });
          
          doc.y = projectListY + projectListHeight + 5;
        }

        // Generar conclusión basada en las métricas
        const conclusion = this.generateUserConclusion(userData.metrics);
        
        // Calcular altura necesaria para conclusión y recomendaciones
        const estimatedLines = Math.ceil(conclusion.evaluation.length / 70);
        const conclusionHeight = Math.max(100, estimatedLines * 13 + 55);
        const recsHeight = conclusion.recommendations.length * 35 + 40;
        const totalNeededSpace = conclusionHeight + recsHeight + 50;
        
        // Verificar si hay espacio suficiente, si no, nueva página
        this.addNewPageIfNeeded(doc, totalNeededSpace);
        
        doc.moveDown(0.5);
        
        // Fondo para la conclusión (altura dinámica)
        const conclusionY = doc.y;
        doc.roundedRect(70, conclusionY, 460, conclusionHeight, 5)
          .fill('#f0f9ff');
        
        // Título de la conclusión
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af')
          .text('Evaluacion General:', 80, conclusionY + 10);
        
        // Texto de conclusión
        doc.fontSize(9).font('Helvetica').fillColor('#334155')
          .text(conclusion.evaluation, 80, conclusionY + 30, { width: 440, align: 'justify', lineGap: 2 });
        
        // Posicionar después de la caja de conclusión
        doc.y = conclusionY + conclusionHeight + 15;

        // Recomendaciones
        if (conclusion.recommendations.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af')
            .text('Recomendaciones:', 70);
          doc.moveDown(0.4);
          
          doc.fontSize(9).font('Helvetica').fillColor('#334155');
          conclusion.recommendations.forEach((rec, idx) => {
            doc.text(`${idx + 1}. ${rec}`, 80, doc.y, { width: 450, lineGap: 2 });
            doc.moveDown(0.4);
          });
        }

        doc.moveDown(2.5);
      });
    }

    // Pie de página
    this.addFooter(doc);
  }

  /**
   * Métodos auxiliares para el PDF
   */
  addHeader(doc, generatedAt, period) {
    // Fondo del encabezado con gradiente simulado
    doc.rect(0, 0, 595, 140).fill('#1e40af');
    doc.rect(0, 140, 595, 3).fill('#3b82f6');
    
    // Logo CSI
    try {
      const logoPath = path.join(__dirname, '../../frontend/public/csi-logo.png');
      doc.image(logoPath, 50, 30, { width: 80, height: 80 });
    } catch (error) {
      console.log('⚠️ No se pudo cargar el logo CSI');
    }
    
    // Título principal
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#ffffff')
      .text('REPORTE DE SEGUIMIENTO', 150, 45, { align: 'left' });
    doc.fontSize(22).fillColor('#93c5fd')
      .text('SEMANAL', 150, 72, { align: 'left' });
    
    // Información del reporte
    doc.fontSize(10).font('Helvetica').fillColor('#e0e7ff')
      .text(`Generado: ${this.formatDate(generatedAt)}`, 150, 105, { align: 'left' });
    doc.fontSize(10).fillColor('#bfdbfe')
      .text(`Período: ${this.formatDate(period.from)} - ${this.formatDate(period.to)}`, 150, 120, { align: 'left' });
    
    // Texto CSI en la esquina
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff')
      .text('Sistema de Gestion CSI', 400, 110, { width: 145, align: 'right' });
    
    doc.y = 160;
  }

  addSectionTitle(doc, title) {
    const y = doc.y;
    
    // Barra lateral decorativa
    doc.rect(50, y - 5, 5, 30).fill('#3b82f6');
    
    // Título
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
      .text(title, 65, y);
    
    // Línea decorativa
    doc.moveTo(65, y + 22).lineTo(545, y + 22)
      .strokeColor('#cbd5e1').lineWidth(1).stroke();
    
    doc.moveDown(1);
  }

  addMetricBox(doc, metrics) {
    const startX = 70;
    const startY = doc.y;
    const boxWidth = 115;
    const boxHeight = 65;
    const gap = 12;

    metrics.forEach((metric, index) => {
      const x = startX + (index % 4) * (boxWidth + gap);
      const y = startY + Math.floor(index / 4) * (boxHeight + gap);

      // Sombra
      doc.roundedRect(x + 2, y + 2, boxWidth, boxHeight, 8)
        .fill('#e2e8f0');
      
      // Caja principal con borde redondeado
      doc.roundedRect(x, y, boxWidth, boxHeight, 8)
        .fillAndStroke(metric.bgColor || '#ffffff', metric.color || '#cbd5e1');
      
      // Valor grande
      doc.fontSize(22).font('Helvetica-Bold')
        .fillColor(metric.color || '#1e293b')
        .text(metric.value.toString(), x, y + 12, { width: boxWidth, align: 'center' });
      
      // Etiqueta
      doc.fontSize(9).font('Helvetica')
        .fillColor('#64748b')
        .text(metric.label, x, y + 42, { width: boxWidth, align: 'center' });
    });

    const rows = Math.ceil(metrics.length / 4);
    doc.y = startY + rows * (boxHeight + gap) + 10;
  }

  addMetricRow(doc, metrics) {
    const startX = 75;
    const y = doc.y;
    const boxWidth = 105;
    const gap = 8;

    metrics.forEach((metric, index) => {
      const x = startX + index * (boxWidth + gap);
      
      // Etiqueta
      doc.fontSize(8).font('Helvetica').fillColor('#64748b')
        .text(metric.label, x, y);
      
      // Valor con circulo de color
      doc.circle(x, y + 17, 3).fill(metric.color || '#1e293b');
      doc.fontSize(12).font('Helvetica-Bold')
        .fillColor(metric.color || '#1e293b')
        .text(metric.value.toString(), x + 8, y + 13);
    });

    doc.y = y + 34;
  }

  drawProgressBar(doc, x, y, width, percentage) {
    // Etiqueta "Progreso"
    doc.fontSize(8).font('Helvetica').fillColor('#64748b')
      .text('Progreso:', x, y - 15);
    
    // Barra de fondo con bordes redondeados
    doc.roundedRect(x, y, width, 12, 6)
      .fillAndStroke('#e5e7eb', '#cbd5e1');
    
    // Barra de progreso con gradiente simulado
    const progressWidth = (width * parseFloat(percentage)) / 100;
    const color = percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';
    
    if (progressWidth > 0) {
      doc.roundedRect(x, y, progressWidth, 12, 6).fill(color);
    }
    
    // Texto del porcentaje dentro o al lado de la barra
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
      .text(`${percentage}%`, x + width/2 - 15, y + 2);
  }

  addNewPageIfNeeded(doc, requiredSpace) {
    if (doc.y + requiredSpace > 750) {
      doc.addPage();
    }
  }

  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    const totalPages = pages.count;
    
    for (let i = 0; i < totalPages; i++) {
      const pageIndex = pages.start + i;
      doc.switchToPage(pageIndex);
      
      // Línea superior del footer
      doc.moveTo(50, 745).lineTo(545, 745)
        .strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      
      // Texto del footer
      doc.fontSize(8).fillColor('#64748b')
        .text(`Página ${i + 1} de ${totalPages}`, 50, 755, { align: 'left' });
      
      doc.fontSize(8).fillColor('#94a3b8')
        .text('Generado automáticamente por Sistema CSI', 50, 755, { align: 'center' });
      
      doc.fontSize(8).fillColor('#64748b')
        .text(`© ${new Date().getFullYear()} CSI`, 50, 755, { align: 'right' });
    }
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export default new ReportService();
