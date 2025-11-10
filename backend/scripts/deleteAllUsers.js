import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const deleteAllUsers = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Contar usuarios antes de eliminar
    const count = await User.countDocuments();
    
    if (count === 0) {
      console.log('⚠️  No hay usuarios en el sistema\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Listar usuarios a eliminar
    const users = await User.find({}).select('name email role authProvider');
    
    console.log('🗑️  USUARIOS A ELIMINAR:\n');
    console.log('═'.repeat(70));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Rol:   ${user.role === 'administrador' ? '🔴 Administrador' : '🔵 Usuario'}`);
      console.log(`   🔐 Auth:  ${user.authProvider || 'local'}`);
    });
    
    console.log('\n' + '═'.repeat(70));
    console.log(`\nTotal: ${count} usuario${count !== 1 ? 's' : ''}\n`);

    // Eliminar todos los usuarios
    const result = await User.deleteMany({});
    
    console.log(`✅ ${result.deletedCount} usuario${result.deletedCount !== 1 ? 's' : ''} eliminado${result.deletedCount !== 1 ? 's' : ''} exitosamente\n`);

    // Verificar que no queden usuarios
    const remainingCount = await User.countDocuments();
    console.log(`📊 Usuarios restantes: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('✅ Base de datos limpia - No hay usuarios\n');
    }

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

deleteAllUsers();
