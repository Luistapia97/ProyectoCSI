import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/Task.js';

dotenv.config();

const migrateEffortMetrics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar tareas sin effortMetrics
    const tasksWithoutMetrics = await Task.find({
      $or: [
        { effortMetrics: { $exists: false } },
        { effortMetrics: null }
      ]
    });

    console.log(`📊 Encontradas ${tasksWithoutMetrics.length} tareas sin effortMetrics`);

    let updated = 0;
    for (const task of tasksWithoutMetrics) {
      task.effortMetrics = {
        estimatedSize: 'M',
        estimatedHours: 6,
        timeTracking: [],
        blockedBy: 'none',
        actualHours: 0,
        effectiveHours: 0
      };
      
      await task.save();
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`⏳ Actualizadas ${updated}/${tasksWithoutMetrics.length} tareas...`);
      }
    }

    console.log(`✅ Migración completada: ${updated} tareas actualizadas`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
};

migrateEffortMetrics();
