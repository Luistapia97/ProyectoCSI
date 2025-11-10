import cron from 'nodecron';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

/**
 * Servicio de recordatorios automáticos para tareas
 * Envía notificaciones antes de la fecha de vencimiento
 */
class ReminderService {
  constructor(io) {
    this.io = io;
    this.jobs = [];
  }

  /**
   * Iniciar todos los trabajos cron
   */
  start() {
    console.log('⏰ Iniciando servicio de recordatorios...');

    // Recordatorio cada 2 horas  Tareas que vencen en 24 horas
    // Se ejecuta: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
    const dailyReminder = cron.schedule('0 */2 * * *', async () => {
      console.log('\n⏰ Ejecutando verificación programada de 24h...');
      await this.checkTasksDueSoon(24);
    });

    // Recordatorio cada 30 minutos  Tareas que vencen en 1 hora
    const hourlyReminder = cron.schedule('*/30 * * * *', async () => {
      console.log('\n⏰ Ejecutando verificación programada de 1h...');
      await this.checkTasksDueSoon(1);
    });

    // Verificar tareas vencidas cada 4 horas
    // Se ejecuta: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
    const overdueCheck = cron.schedule('0 */4 * * *', async () => {
      console.log('\n⏰ Ejecutando verificación programada de tareas vencidas...');
      await this.checkOverdueTasks();
    });

    this.jobs.push(dailyReminder, hourlyReminder, overdueCheck);

    console.log('✅ Recordatorios programados:');
    console.log('   📅 Cada 2 horas  Tareas que vencen en 24h');
    console.log('   ⏰ Cada 30 minutos  Tareas que vencen en 1h');
    console.log('   ⚠️ Cada 4 horas  Verificación de tareas vencidas');
    console.log('\n💡 Ejecutar manualmente desde rutas:');
    console.log('    Probar inmediatamente con recordatorio manual en cualquier tarea');
  }

  /**
   * Verificar tareas que vencen pronto
   * @param {number} hours  Horas antes del vencimiento
   */
  async checkTasksDueSoon(hours) {
    try {
      console.log(`\n🔔 Verificando tareas que vencen en ${hours}h...`);

      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      // Para el recordatorio de 24h, buscar entre 23 y 25 horas
      // Para el recordatorio de 1h, buscar entre 0.5 y 1.5 horas
      const minTime = hours === 24 
        ? new Date(now.getTime() + 23 * 60 * 60 * 1000)
        : new Date(now.getTime() + 0.5 * 60 * 60 * 1000);
      
      const maxTime = hours === 24
        ? new Date(now.getTime() + 25 * 60 * 60 * 1000)
        : new Date(now.getTime() + 1.5 * 60 * 60 * 1000);

      console.log(`   🕐 Rango: ${minTime.toLocaleString('esMX')} → ${maxTime.toLocaleString('esMX')}`);

      // Buscar tareas que:
      // 1. No estén completadas
      // 2. No estén archivadas
      // 3. Tengan fecha de vencimiento
      // 4. Vencen en el rango de tiempo especificado
      const tasks = await Task.find({
        completed: false,
        archived: false,
        dueDate: {
          $gte: minTime,
          $lte: maxTime
        }
      })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name');

      console.log(`   📋 Encontradas ${tasks.length} tareas`);

      let remindersSent = 0;
      const notificationType = hours === 24 ? 'task_reminder_24h' : 'task_reminder_1h';

      for (const task of tasks) {
        if (task.assignedTo && task.assignedTo.length > 0) {
          // Verificar si ya se envió este tipo de recordatorio para esta tarea
          const existingNotification = await Notification.findOne({
            relatedTask: task._id,
            type: notificationType,
            createdAt: {
              $gte: new Date(now.getTime()  24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          });

          if (!existingNotification) {
            // Crear notificación para cada usuario asignado
            const notifications = task.assignedTo.map(user => ({
              user: user._id,
              type: notificationType,
              title: `⏰ Recordatorio: Tarea vence en ${hours}h`,
              message: `La tarea "${task.title}" vence ${this.formatDueDate(task.dueDate)}`,
              relatedTask: task._id,
              relatedProject: task.project?._id,
            }));

            const createdNotifications = await Notification.insertMany(notifications);

            // Emitir notificaciones por Socket.IO
            createdNotifications.forEach(notification => {
              this.io.to(`user${notification.user}`).emit('notification', notification);
            });
            
            remindersSent += createdNotifications.length;
            console.log(`   ✅ "${task.title}"  Enviado a ${createdNotifications.length} usuario(s)`);
          } else {
            console.log(`   ⏭️ "${task.title}"  Ya se envió recordatorio recientemente`);
          }
        }
      }

      if (tasks.length > 0) {
        console.log(`   ✅ Total recordatorios enviados: ${remindersSent}`);
      } else {
        console.log(`   ℹ️ No hay tareas que vencen en este período`);
      }
    } catch (error) {
      console.error(`   ❌ Error verificando tareas que vencen en ${hours}h:`, error);
    }
  }

  /**
   * Verificar tareas vencidas
   */
  async checkOverdueTasks() {
    try {
      console.log('\n⚠️ Verificando tareas vencidas...');

      const now = new Date();

      // Buscar tareas que:
      // 1. No estén completadas
      // 2. No estén archivadas
      // 3. Tengan fecha de vencimiento pasada
      const tasks = await Task.find({
        completed: false,
        archived: false,
        dueDate: { $lt: now }
      })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name');

      console.log(`   📋 Encontradas ${tasks.length} tareas vencidas`);

      let remindersSent = 0;

      for (const task of tasks) {
        if (task.assignedTo && task.assignedTo.length > 0) {
          // Verificar si ya se envió notificación de vencimiento en las últimas 24h
          const recentNotification = await Notification.findOne({
            relatedTask: task._id,
            type: 'task_overdue',
            createdAt: {
              $gte: new Date(now.getTime()  24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          });

          if (!recentNotification) {
            // Crear notificación para cada usuario asignado
            const notifications = task.assignedTo.map(user => ({
              user: user._id,
              type: 'task_overdue',
              title: '⚠️ Tarea Vencida',
              message: `La tarea "${task.title}" venció ${this.formatOverdue(task.dueDate)}`,
              relatedTask: task._id,
              relatedProject: task.project?._id,
            }));

            const createdNotifications = await Notification.insertMany(notifications);

            // Emitir notificaciones por Socket.IO
            createdNotifications.forEach(notification => {
              this.io.to(`user${notification.user}`).emit('notification', notification);
            });
            
            remindersSent += createdNotifications.length;
            console.log(`   ⚠️ "${task.title}"  Enviado a ${createdNotifications.length} usuario(s)`);
          } else {
            console.log(`   ⏭️ "${task.title}"  Ya se envió alerta recientemente`);
          }
        }
      }

      if (tasks.length > 0) {
        console.log(`   ✅ Total alertas enviadas: ${remindersSent}`);
      } else {
        console.log(`   ℹ️ No hay tareas vencidas`);
      }
    } catch (error) {
      console.error('   ❌ Error verificando tareas vencidas:', error);
    }
  }

  /**
   * Formatear fecha de vencimiento de forma legible
   */
  formatDueDate(date) {
    const now = new Date();
    const dueDate = new Date(date);
    const diff = dueDate  now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) {
      return `en ${minutes} minutos`;
    } else if (hours < 24) {
      return `en ${hours} horas`;
    } else {
      return dueDate.toLocaleDateString('esMX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2digit',
        minute: '2digit'
      });
    }
  }

  /**
   * Formatear tiempo vencido
   */
  formatOverdue(date) {
    const now = new Date();
    const dueDate = new Date(date);
    const diff = now  dueDate;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else {
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    }
  }

  /**
   * Detener todos los trabajos cron
   */
  stop() {
    console.log('⏹️ Deteniendo servicio de recordatorios...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('✅ Recordatorios detenidos');
  }

  /**
   * Enviar recordatorio manual para una tarea específica
   * Útil para testing o recordatorios inmediatos
   */
  async sendManualReminder(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('project', 'name');

      if (!task) {
        throw new Error('Tarea no encontrada');
      }

      if (!task.assignedTo || task.assignedTo.length === 0) {
        throw new Error('No hay usuarios asignados');
      }

      const notifications = task.assignedTo.map(user => ({
        user: user._id,
        type: 'task_reminder_manual',
        title: '🔔 Recordatorio Manual',
        message: `Recordatorio sobre la tarea: "${task.title}"`,
        relatedTask: task._id,
        relatedProject: task.project?._id,
      }));

      const createdNotifications = await Notification.insertMany(notifications);

      // Emitir notificaciones por Socket.IO
      createdNotifications.forEach(notification => {
        this.io.to(`user${notification.user}`).emit('notification', notification);
      });

      console.log(`✅ Recordatorio manual enviado para tarea: ${task.title}`);
      return { success: true, notifications: createdNotifications };
    } catch (error) {
      console.error('❌ Error enviando recordatorio manual:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Método de prueba  Ejecutar verificación de 24h inmediatamente
   */
  async testCheck24h() {
    console.log('\n🧪 PRUEBA MANUAL: Verificación de tareas que vencen en 24h');
    await this.checkTasksDueSoon(24);
  }

  /**
   * Método de prueba  Ejecutar verificación de 1h inmediatamente
   */
  async testCheck1h() {
    console.log('\n🧪 PRUEBA MANUAL: Verificación de tareas que vencen en 1h');
    await this.checkTasksDueSoon(1);
  }

  /**
   * Método de prueba  Ejecutar verificación de tareas vencidas inmediatamente
   */
  async testCheckOverdue() {
    console.log('\n🧪 PRUEBA MANUAL: Verificación de tareas vencidas');
    await this.checkOverdueTasks();
  }
}

export default ReminderService;

