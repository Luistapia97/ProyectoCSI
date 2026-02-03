import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function deleteTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuario "prueba"
    const testUsers = await User.find({
      $or: [
        { email: /prueba/i },
        { name: /prueba/i }
      ]
    });

    if (testUsers.length === 0) {
      console.log('⚠️  No se encontró ningún usuario con "prueba" en el nombre o email');
      process.exit(0);
    }

    console.log(`\n📋 Usuarios encontrados con "prueba":`);
    testUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user._id}`);
    });

    // Eliminar usuarios
    const result = await User.deleteMany({
      $or: [
        { email: /prueba/i },
        { name: /prueba/i }
      ]
    });

    console.log(`\n✅ ${result.deletedCount} usuario(s) eliminado(s) exitosamente`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    process.exit(1);
  }
}

deleteTestUser();
