import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

// Usar la URI de MongoDB Atlas directamente (el servidor ya está corriendo con ella)
const MONGO_URI = 'mongodb+srv://luisosmx:Mikami82@cluster0.v2fu9dg.mongodb.net/nexus-tasks?retryWrites=true&w=majority&appName=Cluster0';

async function testReminders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar un usuario y proyecto
    const user = await User.findOne();
    const project = await Project.findOne();

    if (!user || !project) {
      console.log('❌ No hay usuarios o proyectos en la base de datos');
      process.exit(1);
    }

    console.log(`👤 Usuario: ${user.name} (${user.email})`);
    console.log(`📁 Proyecto: ${project.name}\n`);

    // Crear tarea que vence en 30 minutos (para probar recordatorio de 1h)
    const in30Minutes = new Date(Date.now() + 30 * 60 * 1000);
    
    const task30min = new Task({
      title: '🧪 TEST: Tarea vence en 30 minutos',
      description: 'Esta es una tarea de prueba para el recordatorio de 1h',
      project: project._id,
      assignedTo: [user._id],
      createdBy: user._id,
      dueDate: in30Minutes,
      priority: 'high',
      status: 'in-progress',
      completed: false,
      archived: false
    });

    await task30min.save();
    console.log(`✅ Tarea creada (vence en 30 min):`);
    console.log(`   ID: ${task30min._id}`);
    console.log(`   Fecha: ${in30Minutes.toLocaleString('es-MX')}\n`);

    // Crear tarea que vence en 23 horas (para probar recordatorio de 24h)
    const in23Hours = new Date(Date.now() + 23 * 60 * 60 * 1000);
    
    const task23h = new Task({
      title: '🧪 TEST: Tarea vence en 23 horas',
      description: 'Esta es una tarea de prueba para el recordatorio de 24h',
      project: project._id,
      assignedTo: [user._id],
      createdBy: user._id,
      dueDate: in23Hours,
      priority: 'medium',
      status: 'in-progress',
      completed: false,
      archived: false
    });

    await task23h.save();
    console.log(`✅ Tarea creada (vence en 23h):`);
    console.log(`   ID: ${task23h._id}`);
    console.log(`   Fecha: ${in23Hours.toLocaleString('es-MX')}\n`);

    // Crear tarea vencida (para probar verificación de vencidas)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const taskOverdue = new Task({
      title: '🧪 TEST: Tarea vencida (ayer)',
      description: 'Esta es una tarea de prueba para la verificación de tareas vencidas',
      project: project._id,
      assignedTo: [user._id],
      createdBy: user._id,
      dueDate: yesterday,
      priority: 'high',
      status: 'in-progress',
      completed: false,
      archived: false
    });

    await taskOverdue.save();
    console.log(`✅ Tarea creada (vencida):`);
    console.log(`   ID: ${taskOverdue._id}`);
    console.log(`   Fecha: ${yesterday.toLocaleString('es-MX')}\n`);

    console.log('📋 RESUMEN:');
    console.log('   ⏰ Tarea en 30 min - Debería recibir recordatorio de 1h en la próxima hora');
    console.log('   📅 Tarea en 23h - Debería recibir recordatorio de 24h mañana a las 9:00 AM');
    console.log('   ⚠️ Tarea vencida - Debería recibir alerta en las próximas 6 horas\n');

    console.log('💡 PRUEBA INMEDIATA:');
    console.log('   1. En el modal de una de estas tareas, haz clic en "Enviar Recordatorio"');
    console.log('   2. Deberías recibir una notificación inmediata\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testReminders();
