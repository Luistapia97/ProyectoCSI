import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado a MongoDB\n');

    const email = process.argv[2] || 'info@proyectoscsi.mx';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ Usuario con email ${email} no encontrado`);
      process.exit(1);
    }

    console.log('=== INFORMACIÓN DEL USUARIO ===');
    console.log(`Nombre: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Rol: ${user.role}`);
    console.log(`Estado: ${user.status}`);
    console.log(`Creado: ${user.createdAt}`);
    console.log(`\n¿Es administrador?: ${user.role === 'administrador' ? '✓ SÍ' : '✗ NO'}`);
    console.log(`¿Estado aprobado?: ${user.status === 'approved' ? '✓ SÍ' : '✗ NO'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUser();
