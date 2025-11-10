import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkZohoSync = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener todas las tareas
    const tasks = await Task.find({ archived: false })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: 1 })
      .limit(10);

    console.log(`📋 Últimas ${tasks.length} tareas:\n`);

    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title}`);
      console.log(`   ID: ${task._id}`);
      console.log(`   Creada: ${task.createdAt.toLocaleString('esMX')}`);
      console.log(`   Asignada a: ${task.assignedTo.map(u => u.name).join(', ') || 'Nadie'}`);
      
      if (task.zohoTaskIds && task.zohoTaskIds.length > 0) {
        console.log(`   ✅ SINCRONIZADA CON ZOHO:`);
        task.zohoTaskIds.forEach(sync => {
          const user = task.assignedTo.find(u => u._id.toString() === sync.userId.toString());
          console.log(`       Usuario: ${user?.email || 'Desconocido'}`);
          console.log(`       Zoho Task ID: ${sync.taskId}`);
          console.log(`       Sincronizada: ${sync.syncedAt.toLocaleString('esMX')}`);
        });
      } else {
        console.log(`   ❌ NO SINCRONIZADA CON ZOHO`);
      }
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkZohoSync();

