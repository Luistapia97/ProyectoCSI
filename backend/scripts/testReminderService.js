import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

// Usar la URI de MongoDB Atlas directamente
const MONGO_URI = 'mongodb+srv://luisosmx:Mikami82@cluster0.v2fu9dg.mongodb.net/nexus-tasks?retryWrites=true&w=majority&appName=Cluster0';

async function testReminders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const now = new Date();
    console.log(`📅 Fecha actual: ${now.toLocaleString('es-MX')}\n`);

    // 1. Verificar tareas que vencen en 24 horas
    console.log('═══════════════════════════════════════');
    console.log('🔍 VERIFICANDO TAREAS QUE VENCEN EN 24H');
    console.log('═══════════════════════════════════════\n');

    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    console.log(`   Rango: ${now.toLocaleString('es-MX')} → ${in24Hours.toLocaleString('es-MX')}\n`);

    const tasks24h = await Task.find({
      completed: false,
      archived: false,
      dueDate: {
        $gte: now,
        $lte: in24Hours
      }
    })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    console.log(`   📋 Encontradas: ${tasks24h.length} tareas\n`);

    tasks24h.forEach((task, index) => {
      console.log(`   ${index + 1}. "${task.title}"`);
      console.log(`      Vence: ${new Date(task.dueDate).toLocaleString('es-MX')}`);
      console.log(`      Asignada a: ${task.assignedTo.map(u => u.name).join(', ')}`);
      console.log(`      Proyecto: ${task.project?.name || 'Sin proyecto'}\n`);
    });

    // 2. Verificar tareas que vencen en 1 hora
    console.log('═══════════════════════════════════════');
    console.log('🔍 VERIFICANDO TAREAS QUE VENCEN EN 1H');
    console.log('═══════════════════════════════════════\n');

    const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    console.log(`   Rango: ${now.toLocaleString('es-MX')} → ${in1Hour.toLocaleString('es-MX')}\n`);

    const tasks1h = await Task.find({
      completed: false,
      archived: false,
      dueDate: {
        $gte: now,
        $lte: in1Hour
      }
    })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    console.log(`   📋 Encontradas: ${tasks1h.length} tareas\n`);

    tasks1h.forEach((task, index) => {
      console.log(`   ${index + 1}. "${task.title}"`);
      console.log(`      Vence: ${new Date(task.dueDate).toLocaleString('es-MX')}`);
      console.log(`      Asignada a: ${task.assignedTo.map(u => u.name).join(', ')}`);
      console.log(`      Proyecto: ${task.project?.name || 'Sin proyecto'}\n`);
    });

    // 3. Verificar tareas vencidas
    console.log('═══════════════════════════════════════');
    console.log('🔍 VERIFICANDO TAREAS VENCIDAS');
    console.log('═══════════════════════════════════════\n');

    const overdueTask = await Task.find({
      completed: false,
      archived: false,
      dueDate: { $lt: now }
    })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    console.log(`   📋 Encontradas: ${overdueTask.length} tareas vencidas\n`);

    overdueTask.forEach((task, index) => {
      const overdueDays = Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
      console.log(`   ${index + 1}. "${task.title}"`);
      console.log(`      Vence: ${new Date(task.dueDate).toLocaleString('es-MX')}`);
      console.log(`      ⚠️ Vencida hace: ${overdueDays} días`);
      console.log(`      Asignada a: ${task.assignedTo.map(u => u.name).join(', ')}`);
      console.log(`      Proyecto: ${task.project?.name || 'Sin proyecto'}\n`);
    });

    // 4. Verificar todas las tareas con fecha de vencimiento
    console.log('═══════════════════════════════════════');
    console.log('🔍 TODAS LAS TAREAS CON FECHA DE VENCIMIENTO');
    console.log('═══════════════════════════════════════\n');

    const allTasksWithDueDate = await Task.find({
      dueDate: { $exists: true },
      completed: false,
      archived: false
    })
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ dueDate: 1 });

    console.log(`   📋 Total: ${allTasksWithDueDate.length} tareas\n`);

    allTasksWithDueDate.forEach((task, index) => {
      const dueDate = new Date(task.dueDate);
      const diff = dueDate - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      let status = '';
      
      if (hours < 0) {
        status = `⚠️ VENCIDA hace ${Math.abs(hours)}h`;
      } else if (hours <= 1) {
        status = `🔴 Vence en ${hours}h`;
      } else if (hours <= 24) {
        status = `🟡 Vence en ${hours}h`;
      } else {
        const days = Math.floor(hours / 24);
        status = `🟢 Vence en ${days} días`;
      }

      console.log(`   ${index + 1}. ${status}`);
      console.log(`      Tarea: "${task.title}"`);
      console.log(`      Vence: ${dueDate.toLocaleString('es-MX')}`);
      console.log(`      Asignada a: ${task.assignedTo.map(u => u.name).join(', ')}`);
      console.log(`      Proyecto: ${task.project?.name || 'Sin proyecto'}\n`);
    });

    // 5. Verificar notificaciones de recordatorio existentes
    console.log('═══════════════════════════════════════');
    console.log('🔍 NOTIFICACIONES DE RECORDATORIO EXISTENTES');
    console.log('═══════════════════════════════════════\n');

    const reminderNotifications = await Notification.find({
      type: { $in: ['task_reminder_24h', 'task_reminder_1h', 'task_overdue', 'task_reminder_manual'] }
    })
      .populate('user', 'name email')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`   📋 Últimas 20 notificaciones de recordatorio:\n`);

    if (reminderNotifications.length === 0) {
      console.log('   ❌ No hay notificaciones de recordatorio aún\n');
    } else {
      reminderNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.type}`);
        console.log(`      Usuario: ${notif.user?.name || 'N/A'}`);
        console.log(`      Título: ${notif.title}`);
        console.log(`      Tarea: ${notif.relatedTask?.title || 'N/A'}`);
        console.log(`      Creada: ${notif.createdAt.toLocaleString('es-MX')}`);
        console.log(`      Leída: ${notif.read ? 'Sí' : 'No'}\n`);
      });
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 RESUMEN');
    console.log('═══════════════════════════════════════\n');
    console.log(`   🟢 Tareas que vencen en 24h: ${tasks24h.length}`);
    console.log(`   🟡 Tareas que vencen en 1h: ${tasks1h.length}`);
    console.log(`   🔴 Tareas vencidas: ${overdueTask.length}`);
    console.log(`   📋 Total tareas con vencimiento: ${allTasksWithDueDate.length}`);
    console.log(`   📬 Notificaciones de recordatorio: ${reminderNotifications.length}\n`);

    console.log('💡 DIAGNÓSTICO:');
    if (tasks24h.length === 0 && tasks1h.length === 0 && overdueTask.length === 0) {
      console.log('   ⚠️ No hay tareas que requieran recordatorios en este momento');
      console.log('   💡 Crea tareas con fechas de vencimiento próximas para probar\n');
    } else {
      console.log('   ✅ Hay tareas que deberían generar recordatorios');
      if (reminderNotifications.length === 0) {
        console.log('   ⚠️ Pero no se han creado notificaciones de recordatorio');
        console.log('   🔧 Posible problema: El servicio de cron no está ejecutándose\n');
      } else {
        console.log('   ✅ Y ya se han enviado notificaciones de recordatorio\n');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testReminders();
