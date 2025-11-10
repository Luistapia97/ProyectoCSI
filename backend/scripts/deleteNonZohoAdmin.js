import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const deleteNonZohoAdmin = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar el administrador sin Zoho
    const admin = await User.findOne({ 
      email: 'luison558@gmail.com',
      role: 'administrador'
    });

    if (!admin) {
      console.log('⚠️  No se encontró el administrador con email luison558@gmail.com');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('📋 Administrador encontrado:');
    console.log('─'.repeat(60));
    console.log(`   Nombre:       ${admin.name}`);
    console.log(`   Email:        ${admin.email}`);
    console.log(`   Rol:          ${admin.role}`);
    console.log(`   Auth:         ${admin.authProvider || 'local'}`);
    console.log(`   Zoho Token:   ${admin.zohoAccessToken ? 'Sí' : 'No'}`);
    console.log('─'.repeat(60));
    console.log('');

    // Eliminar el administrador
    await User.deleteOne({ _id: admin._id });
    
    console.log('🗑️  Administrador eliminado exitosamente');
    console.log('');

    // Mostrar conteo actualizado
    const adminCount = await User.countDocuments({ role: 'administrador' });
    console.log(`📊 Administradores restantes: ${adminCount}/3`);
    console.log('');

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

deleteNonZohoAdmin();
