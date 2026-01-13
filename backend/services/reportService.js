import PDFDocument from 'pdfkit';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

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

    // Obtener todas las tareas
    const allTasks = await Task.find({ archived: false })
      .select('title completed assignedTo project dueDate completedAt archived')
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
          completionRate
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
      userMetrics,
      projectMetrics
    };
  }

  /**
   * Genera el contenido del PDF
   */
  generatePDFContent(doc, data) {
    const { generatedAt, period, globalMetrics, userMetrics, projectMetrics } = data;

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

    doc.moveDown(1);

    // DESEMPEÑO POR PROYECTO
    if (projectMetrics.length > 0) {
      this.addNewPageIfNeeded(doc, 200);
      this.addSectionTitle(doc, 'DESEMPEÑO POR PROYECTO');
      doc.moveDown(0.5);

      projectMetrics.forEach((project, index) => {
        this.addNewPageIfNeeded(doc, 120);
        
        // Caja del proyecto con borde
        const projectBoxY = doc.y;
        doc.roundedRect(60, projectBoxY, 480, 90, 5)
          .fillAndStroke('#f8fafc', '#cbd5e1');
        
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e293b')
          .text(`${index + 1}. ${project.name}`, 75, projectBoxY + 15);
        doc.fontSize(9).font('Helvetica').fillColor('#64748b')
          .text(`Miembros del equipo: ${project.members}`, 75, projectBoxY + 35);
        
        doc.y = projectBoxY + 55;

        this.addMetricRow(doc, [
          { label: 'Total', value: project.metrics.totalTasks, color: '#3b82f6' },
          { label: 'Completadas', value: project.metrics.completedTasks, color: '#10b981' },
          { label: 'Pendientes', value: project.metrics.pendingTasks, color: '#f59e0b' },
          { label: 'Atrasadas', value: project.metrics.overdueTasks, color: '#ef4444' }
        ]);

        doc.moveDown(0.3);
        const progressBarY = doc.y;
        this.drawProgressBar(doc, 95, progressBarY, 280, project.metrics.progress);
        
        doc.y = projectBoxY + 100;
        doc.moveDown(0.5);
      });
    }

    // DESEMPEÑO POR USUARIO
    if (userMetrics.length > 0) {
      doc.addPage();
      this.addSectionTitle(doc, 'DESEMPEÑO POR USUARIO');
      doc.moveDown(0.5);

      userMetrics.forEach((userData, index) => {
        this.addNewPageIfNeeded(doc, 200);

        // Caja del usuario con fondo
        const userBoxY = doc.y;
        doc.roundedRect(60, userBoxY, 480, 40, 5)
          .fill('#f1f5f9');
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b')
          .text(`${index + 1}. ${userData.user.name}`, 75, userBoxY + 10);
        doc.fontSize(9).font('Helvetica').fillColor('#64748b')
          .text(`${userData.user.email} | ${userData.user.role === 'administrador' ? 'Administrador' : 'Usuario'}`, 75, userBoxY + 25);
        
        doc.y = userBoxY + 50;
        doc.moveDown(0.3);

        // Métricas principales
        this.addMetricRow(doc, [
          { label: 'Total', value: userData.metrics.totalTasks },
          { label: 'Completadas', value: userData.metrics.completedTasks, color: '#10b981' },
          { label: 'Pendientes', value: userData.metrics.pendingTasks, color: '#f59e0b' },
          { label: 'Atrasadas', value: userData.metrics.overdueTasks, color: '#ef4444' }
        ]);

        doc.moveDown(0.2);
        this.addMetricRow(doc, [
          { label: 'Por Vencer (7 días)', value: userData.metrics.dueSoonTasks, color: '#f59e0b' },
          { label: 'Por Validar', value: userData.metrics.pendingValidation, color: '#6366f1' },
          { label: 'Completadas (Semana)', value: userData.metrics.completedThisWeek, color: '#10b981' },
          { label: 'Tasa Cumplimiento', value: `${userData.metrics.completionRate}%`, color: '#667eea' }
        ]);

        // Tareas por proyecto
        if (Object.keys(userData.tasksByProject).length > 0) {
          doc.moveDown(0.3);
          doc.fontSize(10).font('Helvetica-Bold').text('Tareas por Proyecto:');
          doc.fontSize(8).font('Helvetica');
          
          Object.entries(userData.tasksByProject).forEach(([projectName, stats]) => {
            doc.text(
              `  • ${projectName}: ${stats.completed}/${stats.total} completadas` +
              (stats.overdue > 0 ? ` (${stats.overdue} atrasadas)` : ''),
              { indent: 10 }
            );
          });
        }

        doc.moveDown(0.8);
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
      
      // Valor con círculo de color
      doc.circle(x, y + 18, 3).fill(metric.color || '#1e293b');
      doc.fontSize(12).font('Helvetica-Bold')
        .fillColor(metric.color || '#1e293b')
        .text(metric.value.toString(), x + 8, y + 14);
    });

    doc.y = y + 32;
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
