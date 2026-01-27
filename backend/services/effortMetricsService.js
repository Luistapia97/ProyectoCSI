import Task from '../models/Task.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

/**
 * Servicio para cálculo de métricas de esfuerzo y productividad
 */
class EffortMetricsService {
  
  /**
   * Calcular Índice de Eficiencia de Ejecución (IEE) de una tarea
   * @param {Object} task - Tarea con effortMetrics
   * @returns {Number|null} - Eficiencia (>1 = más rápido, <1 = más lento)
   */
  calculateTaskEfficiency(task) {
    if (!task.effortMetrics) return null;
    
    const { estimatedHours, effectiveHours } = task.effortMetrics;
    
    if (!effectiveHours || effectiveHours === 0) return null;
    
    return Number((estimatedHours / effectiveHours).toFixed(2));
  }
  
  /**
   * Calcular throughput de usuario en un período (horas de valor entregadas)
   * @param {String} userId - ID del usuario
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @returns {Object} - Métricas de throughput
   */
  async calculateUserThroughput(userId, startDate, endDate) {
    const tasks = await Task.find({
      assignedTo: userId,
      completed: true,
      completedAt: { $gte: startDate, $lte: endDate }
    }).populate('project', 'name');
    
    const totalEstimatedHours = tasks.reduce((sum, task) => {
      return sum + (task.effortMetrics?.estimatedHours || 0);
    }, 0);
    
    const totalActualHours = tasks.reduce((sum, task) => {
      return sum + (task.effortMetrics?.actualHours || 0);
    }, 0);
    
    const totalBlockedHours = tasks.reduce((sum, task) => {
      return sum + (task.effortMetrics?.blockedHours || 0);
    }, 0);
    
    const totalEffectiveHours = tasks.reduce((sum, task) => {
      return sum + (task.effortMetrics?.effectiveHours || 0);
    }, 0);
    
    // Calcular eficiencia global
    const avgEfficiency = totalEffectiveHours > 0 
      ? Number((totalEstimatedHours / totalEffectiveHours).toFixed(2))
      : null;
    
    return {
      tasksCompleted: tasks.length,
      totalEstimatedHours: Number(totalEstimatedHours.toFixed(2)),
      totalActualHours: Number(totalActualHours.toFixed(2)),
      totalBlockedHours: Number(totalBlockedHours.toFixed(2)),
      totalEffectiveHours: Number(totalEffectiveHours.toFixed(2)),
      avgEfficiency,
      throughput: Number(totalEstimatedHours.toFixed(2)), // Horas de valor entregadas
      tasks: tasks.map(t => ({
        id: t._id,
        title: t.title,
        project: t.project?.name,
        estimated: t.effortMetrics?.estimatedHours || 0,
        actual: t.effortMetrics?.actualHours || 0,
        efficiency: this.calculateTaskEfficiency(t)
      }))
    };
  }
  
  /**
   * Calcular eficiencia ajustada por contexto del usuario
   * @param {String} userId - ID del usuario
   * @param {Object} metrics - Métricas base
   * @returns {Number} - Eficiencia ajustada
   */
  async calculateAdjustedEfficiency(userId, rawEfficiency) {
    const user = await User.findById(userId);
    if (!user || !rawEfficiency) return rawEfficiency;
    
    const profile = user.effortProfile || {};
    
    // Factor de disponibilidad (menos horas = ajuste)
    const availabilityFactor = (profile.weeklyHours || 40) / 40;
    
    // Multiplicador por experiencia
    const experienceMultipliers = {
      'junior': 0.8,   // Se espera 80% de la velocidad estándar
      'mid': 1.0,      // Velocidad estándar
      'senior': 1.2,   // 20% más rápido
      'lead': 1.3      // 30% más rápido
    };
    const experienceMultiplier = experienceMultipliers[profile.experienceLevel] || 1.0;
    
    const adjusted = rawEfficiency * availabilityFactor * experienceMultiplier;
    return Number(adjusted.toFixed(2));
  }
  
  /**
   * Calcular métricas de calidad del usuario
   * @param {String} userId - ID del usuario
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @returns {Object} - Métricas de calidad
   */
  async calculateQualityMetrics(userId, startDate, endDate) {
    const completedTasks = await Task.find({
      assignedTo: userId,
      completed: true,
      completedAt: { $gte: startDate, $lte: endDate }
    });
    
    // Tareas que necesitaron revalidación (proxy de calidad)
    const tasksWithValidation = completedTasks.filter(t => t.pendingValidation);
    const validatedTasks = completedTasks.filter(t => t.validatedBy);
    
    // Tareas bloqueadas (fuera de control del usuario)
    const blockedTasks = completedTasks.filter(t => 
      t.effortMetrics?.blockedBy && t.effortMetrics.blockedBy !== 'none'
    );
    
    const qualityScore = completedTasks.length > 0
      ? Number((validatedTasks.length / completedTasks.length).toFixed(2))
      : null;
    
    const blockedPercentage = completedTasks.length > 0
      ? Number((blockedTasks.length / completedTasks.length * 100).toFixed(1))
      : 0;
    
    return {
      qualityScore,
      tasksValidated: validatedTasks.length,
      tasksWithValidation: tasksWithValidation.length,
      blockedTasks: blockedTasks.length,
      blockedPercentage
    };
  }
  
  /**
   * Calcular métricas por complejidad
   * @param {Array} tasks - Tareas completadas
   * @returns {Object} - Desglose por talla
   */
  calculateComplexityBreakdown(tasks) {
    const breakdown = {
      XS: { count: 0, estimatedTotal: 0, actualTotal: 0 },
      S: { count: 0, estimatedTotal: 0, actualTotal: 0 },
      M: { count: 0, estimatedTotal: 0, actualTotal: 0 },
      L: { count: 0, estimatedTotal: 0, actualTotal: 0 },
      XL: { count: 0, estimatedTotal: 0, actualTotal: 0 }
    };
    
    tasks.forEach(task => {
      const size = task.effortMetrics?.estimatedSize || 'M';
      breakdown[size].count++;
      breakdown[size].estimatedTotal += task.effortMetrics?.estimatedHours || 0;
      breakdown[size].actualTotal += task.effortMetrics?.actualHours || 0;
    });
    
    return breakdown;
  }
  
  /**
   * Analizar historial de bloqueos de un conjunto de tareas
   * @param {Array} tasks - Array de tareas
   * @returns {Object} - Análisis detallado de bloqueos
   */
  analyzeBlockHistory(tasks) {
    let totalBlockIncidents = 0;
    let totalBlockedHours = 0;
    const blocksByType = {
      external: { count: 0, totalHours: 0, reasons: [] },
      dependency: { count: 0, totalHours: 0, reasons: [] },
      approval: { count: 0, totalHours: 0, reasons: [] },
      information: { count: 0, totalHours: 0, reasons: [] }
    };
    
    const allBlockReasons = [];
    let longestBlock = { duration: 0, taskTitle: '', reason: '' };
    
    tasks.forEach(task => {
      if (task.effortMetrics?.blockHistory && task.effortMetrics.blockHistory.length > 0) {
        task.effortMetrics.blockHistory.forEach(block => {
          totalBlockIncidents++;
          totalBlockedHours += block.duration || 0;
          
          const type = block.blockedBy;
          if (blocksByType[type]) {
            blocksByType[type].count++;
            blocksByType[type].totalHours += block.duration || 0;
            if (block.reason) {
              blocksByType[type].reasons.push(block.reason);
              allBlockReasons.push({ reason: block.reason, type });
            }
          }
          
          // Encontrar el bloqueo más largo
          if (block.duration > longestBlock.duration) {
            longestBlock = {
              duration: block.duration,
              taskTitle: task.title,
              reason: block.reason || 'Sin especificar',
              type: block.blockedBy,
              blockedSince: block.blockedSince,
              blockedUntil: block.blockedUntil
            };
          }
        });
      }
    });
    
    // Calcular promedios por tipo
    Object.keys(blocksByType).forEach(type => {
      const data = blocksByType[type];
      data.avgDuration = data.count > 0 
        ? Number((data.totalHours / data.count).toFixed(2))
        : 0;
      data.totalHours = Number(data.totalHours.toFixed(2));
      delete data.reasons; // Eliminar array de razones para no saturar respuesta
    });
    
    // Encontrar razón más común
    const reasonCounts = {};
    allBlockReasons.forEach(({ reason }) => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    const mostCommonReason = Object.keys(reasonCounts).length > 0
      ? Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';
    
    const avgBlockDuration = totalBlockIncidents > 0
      ? Number((totalBlockedHours / totalBlockIncidents).toFixed(2))
      : 0;
    
    return {
      totalBlockedTasks: tasks.filter(t => 
        t.effortMetrics?.blockHistory && t.effortMetrics.blockHistory.length > 0
      ).length,
      totalBlockIncidents,
      totalBlockedHours: Number(totalBlockedHours.toFixed(2)),
      avgBlockDuration,
      blocksByType,
      mostCommonBlockReason: mostCommonReason,
      longestBlock: longestBlock.duration > 0 ? {
        taskTitle: longestBlock.taskTitle,
        duration: Number(longestBlock.duration.toFixed(2)),
        reason: longestBlock.reason,
        type: longestBlock.type
      } : null
    };
  }
  
  /**
   * Generar reporte completo de usuario para período
   * @param {String} userId - ID del usuario
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @returns {Object} - Reporte completo
   */
  async generateUserReport(userId, startDate, endDate) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    
    const throughput = await this.calculateUserThroughput(userId, startDate, endDate);
    const quality = await this.calculateQualityMetrics(userId, startDate, endDate);
    
    const tasks = await Task.find({
      assignedTo: userId,
      completed: true,
      completedAt: { $gte: startDate, $lte: endDate }
    });
    
    const complexityBreakdown = this.calculateComplexityBreakdown(tasks);
    const adjustedEfficiency = await this.calculateAdjustedEfficiency(
      userId, 
      throughput.avgEfficiency
    );
    
    // Analizar bloqueos
    const blockAnalysis = this.analyzeBlockHistory(tasks);
    
    // Calcular impacto de bloqueos
    const totalTime = throughput.totalActualHours;
    const blockImpact = totalTime > 0 
      ? Number((blockAnalysis.totalBlockedHours / totalTime * 100).toFixed(1))
      : 0;
    
    // Calcular tendencia (comparar con período anterior)
    const periodLength = endDate - startDate;
    const prevStartDate = new Date(startDate - periodLength);
    const prevThroughput = await this.calculateUserThroughput(
      userId, 
      prevStartDate, 
      startDate
    );
    
    const trend = prevThroughput.avgEfficiency
      ? throughput.avgEfficiency / prevThroughput.avgEfficiency
      : 1;
    
    const trendLabel = trend > 1.05 ? 'increasing' 
                     : trend < 0.95 ? 'decreasing' 
                     : 'stable';
    
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        effortProfile: user.effortProfile
      },
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalTasks: tasks.length,
        totalEstimated: throughput.totalEstimatedHours,
        totalActual: throughput.totalActualHours,
        totalBlocked: blockAnalysis.totalBlockedHours,
        totalEffective: throughput.totalEffectiveHours,
        avgEfficiency: throughput.avgEfficiency,
        adjustedEfficiency,
        throughput: throughput.throughput,
        blockImpact
      },
      metrics: {
        ...throughput,
        adjustedEfficiency,
        ...quality,
        complexityBreakdown,
        trend: {
          value: Number(trend.toFixed(2)),
          label: trendLabel,
          percentageChange: Number(((trend - 1) * 100).toFixed(1))
        }
      },
      blockAnalysis: {
        ...blockAnalysis,
        impactPercentage: blockImpact
      }
    };
  }
  
  /**
   * Generar reporte de proyecto
   * @param {String} projectId - ID del proyecto
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @returns {Object} - Reporte del proyecto
   */
  async generateProjectReport(projectId, startDate, endDate) {
    const project = await Project.findById(projectId).populate('members', 'name email');
    if (!project) throw new Error('Proyecto no encontrado');
    
    const tasks = await Task.find({
      project: projectId,
      completedAt: { $gte: startDate, $lte: endDate }
    });
    
    const allTasks = await Task.find({ project: projectId });
    
    const totalEstimated = allTasks.reduce((sum, t) => 
      sum + (t.effortMetrics?.estimatedHours || 0), 0
    );
    
    const completedEstimated = tasks.reduce((sum, t) => 
      sum + (t.effortMetrics?.estimatedHours || 0), 0
    );
    
    const actualHours = tasks.reduce((sum, t) => 
      sum + (t.effortMetrics?.actualHours || 0), 0
    );
    
    const totalEffectiveHours = tasks.reduce((sum, t) => 
      sum + (t.effortMetrics?.effectiveHours || 0), 0
    );
    
    const totalBlockedHours = tasks.reduce((sum, t) => 
      sum + (t.effortMetrics?.blockedHours || 0), 0
    );
    
    // Analizar bloqueos del proyecto
    const blockAnalysis = this.analyzeBlockHistory(tasks);
    
    // Calcular rendimiento del equipo
    const teamMembers = project.members || [];
    const teamPerformance = await Promise.all(teamMembers.map(async (member) => {
      const memberTasks = tasks.filter(t => 
        t.assignedTo.some(assigned => assigned.toString() === member._id.toString())
      );
      
      const memberBlockAnalysis = this.analyzeBlockHistory(memberTasks);
      const memberActualHours = memberTasks.reduce((sum, t) => 
        sum + (t.effortMetrics?.actualHours || 0), 0
      );
      const memberEffectiveHours = memberTasks.reduce((sum, t) => 
        sum + (t.effortMetrics?.effectiveHours || 0), 0
      );
      const memberEstimated = memberTasks.reduce((sum, t) => 
        sum + (t.effortMetrics?.estimatedHours || 0), 0
      );
      
      const memberEfficiency = memberEffectiveHours > 0
        ? Number((memberEstimated / memberEffectiveHours).toFixed(2))
        : null;
      
      const blockImpact = memberActualHours > 0
        ? Number((memberBlockAnalysis.totalBlockedHours / memberActualHours * 100).toFixed(1))
        : 0;
      
      return {
        userId: member._id,
        userName: member.name,
        email: member.email,
        tasksCompleted: memberTasks.length,
        estimatedHours: Number(memberEstimated.toFixed(2)),
        actualHours: Number(memberActualHours.toFixed(2)),
        effectiveHours: Number(memberEffectiveHours.toFixed(2)),
        blockedHours: Number(memberBlockAnalysis.totalBlockedHours.toFixed(2)),
        efficiency: memberEfficiency,
        blockImpact,
        mostBlockedBy: Object.entries(memberBlockAnalysis.blocksByType)
          .sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'none'
      };
    }));
    
    // Calcular eficiencia promedio del proyecto
    const avgEfficiency = totalEffectiveHours > 0
      ? Number((completedEstimated / totalEffectiveHours).toFixed(2))
      : null;
    
    // Calcular ETA ajustado
    const blockImpactPercentage = totalBlockedHours / (totalBlockedHours + totalEffectiveHours);
    const remaining = totalEstimated - completedEstimated;
    const predictedBlockedHours = remaining * blockImpactPercentage;
    const predictedEffectiveHours = avgEfficiency 
      ? remaining / avgEfficiency
      : remaining;
    
    const totalPredictedHours = predictedEffectiveHours + predictedBlockedHours;
    const avgWeeklyRate = completedEstimated / (Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000)));
    const estimatedWeeksRemaining = remaining / avgWeeklyRate;
    
    const deviation = completedEstimated > 0
      ? Number(((actualHours - completedEstimated) / completedEstimated * 100).toFixed(1))
      : 0;
    
    // Generar recomendaciones
    const recommendations = [];
    
    // Detectar miembros con alto impacto de bloqueos
    const highBlockMembers = teamPerformance.filter(m => m.blockImpact > 20);
    if (highBlockMembers.length > 0) {
      recommendations.push({
        type: 'bottleneck',
        priority: 'high',
        message: `${highBlockMembers[0].userName} tiene ${highBlockMembers[0].blockImpact}% de tiempo bloqueado por ${highBlockMembers[0].mostBlockedBy}. Considerar reasignación o resolución de dependencias.`,
        actionable: `Revisar proceso de ${highBlockMembers[0].mostBlockedBy}`
      });
    }
    
    // Detectar problemas de dependencias externas
    if (blockAnalysis.blocksByType.external.count > 10) {
      recommendations.push({
        type: 'dependency',
        priority: 'medium',
        message: `${blockAnalysis.blocksByType.external.count} bloqueos por dependencias externas. Tiempo promedio: ${blockAnalysis.blocksByType.external.avgDuration}h/bloqueo.`,
        actionable: 'Establecer SLAs con proveedores externos'
      });
    }
    
    // Felicitar si la eficiencia es buena
    if (avgEfficiency && avgEfficiency > 1.0) {
      recommendations.push({
        type: 'efficiency',
        priority: 'low',
        message: `Eficiencia del equipo es ${avgEfficiency} (${((avgEfficiency - 1) * 100).toFixed(0)}% mejor que estimación). ¡Buen trabajo!`,
        actionable: 'Mantener prácticas actuales'
      });
    }
    
    return {
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        members: teamMembers.map(m => ({ id: m._id, name: m.name, email: m.email }))
      },
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalTasks: allTasks.length,
        completedTasks: tasks.length,
        inProgress: allTasks.filter(t => !t.completed).length,
        blocked: allTasks.filter(t => t.effortMetrics?.blockedBy !== 'none').length,
        totalEstimated: Number(totalEstimated.toFixed(2)),
        totalActual: Number(actualHours.toFixed(2)),
        totalBlocked: Number(totalBlockedHours.toFixed(2)),
        totalEffective: Number(totalEffectiveHours.toFixed(2)),
        deviation,
        avgEfficiency
      },
      metrics: {
        totalEstimatedHours: Number(totalEstimated.toFixed(2)),
        completedHours: Number(completedEstimated.toFixed(2)),
        actualHours: Number(actualHours.toFixed(2)),
        effectiveHours: Number(totalEffectiveHours.toFixed(2)),
        blockedHours: Number(totalBlockedHours.toFixed(2)),
        remainingHours: Number((totalEstimated - completedEstimated).toFixed(2)),
        progressPercentage: Number((completedEstimated / totalEstimated * 100).toFixed(1)),
        deviation,
        avgWeeklyRate: Number(avgWeeklyRate.toFixed(2)),
        estimatedWeeksRemaining: Number(estimatedWeeksRemaining.toFixed(1))
      },
      blockAnalysis: {
        ...blockAnalysis,
        impactPercentage: Number((blockImpactPercentage * 100).toFixed(1))
      },
      eta: {
        remainingTasks: allTasks.length - tasks.length,
        estimatedHours: Number((totalEstimated - completedEstimated).toFixed(2)),
        predictedEffective: Number(predictedEffectiveHours.toFixed(2)),
        predictedBlocked: Number(predictedBlockedHours.toFixed(2)),
        totalPredicted: Number(totalPredictedHours.toFixed(2)),
        velocity: Number(avgWeeklyRate.toFixed(2)),
        confidence: avgEfficiency && avgEfficiency > 0.8 ? '85%' : '65%'
      },
      teamPerformance,
      recommendations
    };
  }
}

export default new EffortMetricsService();
