import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const changeUserRole = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado a MongoDB');

    // Buscar usuario Brandon
    const username = process.argv[2] || 'brandon';
    const newRole = process.argv[3] || 'usuario';

    const user = await User.findOne({ 
      $or: [
        { name: { $regex: new RegExp(username, 'i') } },
        { email: { $regex: new RegExp(username, 'i') } }
      ]
    });

    if (!user) {
      console.log(`✗ Usuario "${username}" no encontrado`);
      process.exit(1);
    }

    console.log(`\nUsuario encontrado:`);
    console.log(`  Nombre: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Rol actual: ${user.role}`);

    // Cambiar rol
    user.role = newRole;
    await user.save();

    console.log(`\n✓ Rol actualizado a: ${newRole}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

changeUserRole();
