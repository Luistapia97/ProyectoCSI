import mongoose from 'mongoose';
import Task from '../models/Task.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanNullAssignedTo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar todas las tareas
    const allTasks = await Task.find({});
    console.log(`📊 Revisando ${allTasks.length} tareas en total`);

    let fixedCount = 0;
    let tasksWithNulls = 0;
    
    for (const task of allTasks) {
      if (!task.assignedTo || task.assignedTo.length === 0) continue;
      
      // Verificar si tiene elementos null
      const hasNulls = task.assignedTo.some(id => id == null);
      
      if (hasNulls) {
        tasksWithNulls++;
        // Filtrar los elementos null
        const cleanAssignedTo = task.assignedTo.filter(id => id != null);
        
        console.log(`🔧 Limpiando tarea ${task._id}:`);
        console.log(`   Título: ${task.title}`);
        console.log(`   Antes: ${task.assignedTo.length} asignados`);
        console.log(`   Después: ${cleanAssignedTo.length} asignados`);
        
        // Actualizar la tarea
        await Task.findByIdAndUpdate(task._id, {
          $set: { assignedTo: cleanAssignedTo }
        });
        
        fixedCount++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   Tareas revisadas: ${allTasks.length}`);
    console.log(`   Tareas con nulls: ${tasksWithNulls}`);
    console.log(`   Tareas limpiadas: ${fixedCount}`);

    if (fixedCount > 0) {
      console.log(`✅ Se limpiaron ${fixedCount} tareas exitosamente`);
    } else {
      console.log('✅ No se encontraron tareas con nulls');
    }
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanNullAssignedTo();
