// Script para limpiar todos los usuarios de la base de datos
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Conectado');
  } catch (error) {
    console.error('✗ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Modelo User simplificado (solo para borrar)
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

const clearAllUsers = async () => {
  try {
    await connectDB();
    
    console.log('\n⚠️  ADVERTENCIA: Esto eliminará TODOS los usuarios');
    console.log('Esperando 3 segundos...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await User.deleteMany({});
    
    console.log(`✓ ${result.deletedCount} usuarios eliminados`);
    console.log('✓ Base de datos limpia\n');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

clearAllUsers();
