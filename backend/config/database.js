import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout después de 5s
    });

    console.log(`✓ MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('\n========================================');
    console.error('ERROR: No se pudo conectar a MongoDB Atlas');
    console.error('========================================');
    console.error(`Motivo: ${error.message}\n`);
    
    if (error.message.includes('IP')) {
      console.error('SOLUCION:');
      console.error('1. Ve a: https://cloud.mongodb.com/');
      console.error('2. Click en "Network Access" (menu izquierdo)');
      console.error('3. Click en "ADD IP ADDRESS"');
      console.error('4. Click en "ALLOW ACCESS FROM ANYWHERE"');
      console.error('5. Click en "Confirm"');
      console.error('6. Espera 12 minutos y reinicia el servidor\n');
    }
    
    console.error('========================================\n');
    process.exit(1);
  }
};

export default connectDB;

