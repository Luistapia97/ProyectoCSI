import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { syncTaskToZohoCalendar } from '../middleware/zohoCalendarSync.js';

const MONGO_URI = 'mongodb+srv://Admin:Sanandres14@cluster0.v2fu9dg.mongodb.net/proyecto_nexus?retryWrites=true&w=majority';

async function testCalendarSync() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // 1. Buscar usuario con Zoho conectado
    const userWithZoho = await User.findOne({ zohoAccessToken: { $exists: true, $ne: null } });
    
    if (!userWithZoho) {
      console.log('❌ No hay usuarios con Zoho conectado');
      await mongoose.disconnect();
      return;
    }

    console.log('👤 Usuario encontrado con Zoho:');
    console.log(`   Nombre: ${userWithZoho.name}`);
    console.log(`   Email: ${userWithZoho.email}`);
    console.log(`   Auth Provider: ${userWithZoho.authProvider}`);
    console.log('');

    // 2. Buscar o crear un proyecto
    let project = await Project.findOne();
    
    if (!project) {
      console.log('📁 Creando proyecto de prueba...');
      project = await Project.create({
        name: 'Proyecto de Prueba Calendar',
        description: 'Proyecto para probar sincronización con Zoho Calendar',
        owner: userWithZoho._id,
        members: [{ user: userWithZoho._id, role: 'admin' }]
      });
      console.log('✅ Proyecto creado\n');
    } else {
      console.log('📁 Proyecto existente encontrado:', project.name);
      console.log('');
    }

    // 3. Crear una tarea de prueba
    console.log('📝 Creando tarea de prueba...');
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 días en el futuro
    
    const task = await Task.create({
      title: 'Tarea de Prueba - Sincronización Zoho Calendar',
      description: 'Esta es una tarea de prueba para verificar la sincronización automática con Zoho Calendar',
      project: project._id,
      column: 'Pendiente',
      position: 0,
      assignedTo: [userWithZoho._id],
      createdBy: userWithZoho._id,
      priority: 'alta',
      dueDate: dueDate,
      tags: ['test', 'calendar', 'zoho']
    });

    console.log('✅ Tarea creada:');
    console.log(`   ID: ${task._id}`);
    console.log(`   Título: ${task.title}`);
    console.log(`   Fecha: ${task.dueDate}`);
    console.log(`   Asignado a: ${userWithZoho.name}`);
    console.log('');

    // 4. Sincronizar con Zoho Calendar
    console.log('📅 Sincronizando con Zoho Calendar...');
    console.log('');
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email zohoAccessToken')
      .populate('project', 'name');
    
    const syncResult = await syncTaskToZohoCalendar(populatedTask, [userWithZoho._id]);
    
    console.log('');
    console.log('📊 Resultado de sincronización:');
    console.log(JSON.stringify(syncResult, null, 2));
    console.log('');

    // 5. Verificar la tarea actualizada
    const updatedTask = await Task.findById(task._id);
    
    if (updatedTask.zohoCalendarEventIds && updatedTask.zohoCalendarEventIds.length > 0) {
      console.log('✅ ¡Evento creado exitosamente en Zoho Calendar!');
      console.log('');
      console.log('📋 Detalles del evento:');
      updatedTask.zohoCalendarEventIds.forEach((event, index) => {
        console.log(`   Evento ${index + 1}:`);
        console.log(`   - Usuario ID: ${event.userId}`);
        console.log(`   - Event ID: ${event.eventId}`);
        console.log(`   - Link: ${event.eventLink || 'N/A'}`);
      });
      console.log('');
      console.log('🎉 Revisa tu calendario de Zoho para ver el evento!');
      console.log(`   Busca: "${task.title}"`);
    } else {
      console.log('⚠️  La tarea se creó pero no se sincronizó con el calendario');
      console.log('   Revisa los logs anteriores para ver el error');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

console.log('🧪 Test de Sincronización con Zoho Calendar\n');
console.log('='.repeat(50));
console.log('');

testCalendarSync();
