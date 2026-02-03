import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function deleteCorruptTask() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const corruptTaskId = '696a798938bba99d34628a14';
    
    // Eliminar usando el driver nativo de MongoDB
    const result = await mongoose.connection.db.collection('tasks').deleteOne({
      _id: new mongoose.Types.ObjectId(corruptTaskId)
    });

    if (result.deletedCount > 0) {
      console.log(`✅ Tarea corrupta ${corruptTaskId} eliminada exitosamente`);
    } else {
      console.log(`⚠️ No se encontró la tarea ${corruptTaskId}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error eliminando tarea:', error);
    process.exit(1);
  }
}

deleteCorruptTask();
