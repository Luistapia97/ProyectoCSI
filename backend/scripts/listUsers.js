import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const listAllUsers = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener todos los usuarios
    const users = await User.find({}).select('name email role authProvider zohoAccessToken googleAccessToken createdAt');

    console.log('👥 USUARIOS REGISTRADOS EN EL SISTEMA\n');
    console.log('═'.repeat(80));

    if (users.length === 0) {
      console.log('\n⚠️  No hay usuarios registrados en el sistema\n');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name}`);
        console.log('─'.repeat(60));
        console.log(`   📧 Email:         ${user.email}`);
        console.log(`   👤 Rol:           ${user.role === 'administrador' ? '🔴 Administrador' : '🔵 Usuario'}`);
        console.log(`   🔐 Auth Provider: ${user.authProvider || 'local'}`);
        console.log(`   📅 Creado:        ${new Date(user.createdAt).toLocaleDateString('es-MX')}`);
        
        // Estado de conexión con servicios
        const hasZoho = user.zohoAccessToken ? '✅ Conectado' : '❌ No conectado';
        const hasGoogle = user.googleAccessToken ? '✅ Conectado' : '❌ No conectado';
        
        console.log(`   🔵 Zoho Mail:     ${hasZoho}`);
        console.log(`   🔴 Google:        ${hasGoogle}`);
      });

      console.log('\n' + '═'.repeat(80));
      console.log(`\nTotal de usuarios: ${users.length}`);
      
      const admins = users.filter(u => u.role === 'administrador').length;
      const regularUsers = users.filter(u => u.role === 'usuario').length;
      const withZoho = users.filter(u => u.zohoAccessToken).length;
      
      console.log(`   🔴 Administradores: ${admins}`);
      console.log(`   🔵 Usuarios:        ${regularUsers}`);
      console.log(`   📧 Con Zoho Mail:   ${withZoho}`);
      console.log('');
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

listAllUsers();
