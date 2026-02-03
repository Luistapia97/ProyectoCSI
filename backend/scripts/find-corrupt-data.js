import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

dotenv.config();

async function findCorruptData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar proyectos corruptos
    console.log('\n🔍 Buscando proyectos corruptos...');
    const allProjectIds = await Project.find({}, { _id: 1 }).lean();
    console.log(`Total de proyectos: ${allProjectIds.length}`);

    for (const projId of allProjectIds) {
      try {
        const project = await Project.findById(projId._id).lean();
        
        // Intentar convertir a JSON para verificar
        JSON.stringify(project);
        console.log(`✅ Proyecto OK: ${project._id} - ${project.name}`);
      } catch (error) {
        console.log(`❌ PROYECTO CORRUPTO: ${projId._id}`);
        console.log(`   Error: ${error.message}`);
        
        // Intentar leer sin lean() para obtener más info
        try {
          const rawProject = await mongoose.connection.db.collection('projects').findOne({ _id: projId._id });
          console.log(`   Nombre (si disponible): ${rawProject?.name || 'N/A'}`);
        } catch (e) {
          console.log(`   No se puede leer ni siquiera con driver nativo`);
        }
      }
    }

    // Buscar tareas corruptas
    console.log('\n🔍 Buscando tareas corruptas...');
    const allTaskIds = await Task.find({}, { _id: 1 }).lean();
    console.log(`Total de tareas: ${allTaskIds.length}`);

    for (const taskId of allTaskIds) {
      try {
        const task = await Task.findById(taskId._id).lean();
        JSON.stringify(task);
        // console.log(`✅ Tarea OK: ${task._id} - ${task.title}`);
      } catch (error) {
        console.log(`❌ TAREA CORRUPTA: ${taskId._id}`);
        console.log(`   Error: ${error.message}`);
        
        try {
          const rawTask = await mongoose.connection.db.collection('tasks').findOne({ _id: taskId._id });
          console.log(`   Título (si disponible): ${rawTask?.title || 'N/A'}`);
          console.log(`   Proyecto: ${rawTask?.project || 'N/A'}`);
          
          // Verificar específicamente el campo problemático
          if (rawTask.effortMetrics?.timeTracking) {
            for (let i = 0; i < rawTask.effortMetrics.timeTracking.length; i++) {
              const session = rawTask.effortMetrics.timeTracking[i];
              try {
                if (session.note) {
                  JSON.stringify(session.note);
                }
              } catch (noteError) {
                console.log(`   ⚠️ Nota corrupta en sesión ${i}: ${session._id}`);
                console.log(`   Buffer length: ${session.note?.length || 'N/A'}`);
              }
            }
          }
        } catch (e) {
          console.log(`   No se puede leer ni siquiera con driver nativo: ${e.message}`);
        }
      }
    }

    // Buscar usuarios corruptos
    console.log('\n🔍 Buscando usuarios corruptos...');
    const allUserIds = await User.find({}, { _id: 1 }).lean();
    console.log(`Total de usuarios: ${allUserIds.length}`);

    for (const userId of allUserIds) {
      try {
        const user = await User.findById(userId._id).lean();
        JSON.stringify(user);
        console.log(`✅ Usuario OK: ${user._id} - ${user.email}`);
      } catch (error) {
        console.log(`❌ USUARIO CORRUPTO: ${userId._id}`);
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log('\n✅ Búsqueda completa');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    process.exit(1);
  }
}

findCorruptData();
