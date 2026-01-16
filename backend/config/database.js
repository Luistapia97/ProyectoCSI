import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout después de 5s
    });

    console.log(`✓ MongoDB Conectado: ${conn.connection.host}`);
    
    // Monitorear cambios en la colección projects con Change Streams
    try {
      const projectsCollection = conn.connection.collection('projects');
      const changeStream = projectsCollection.watch([], { fullDocument: 'updateLookup' });
      
      changeStream.on('change', (change) => {
        if (change.documentKey) {
          console.log('\n🚨 ================================');
          console.log('🚨 CAMBIO DETECTADO EN PROJECTS');
          console.log('🚨 ================================');
          console.log('Tipo:', change.operationType);
          console.log('Document ID:', change.documentKey._id);
          console.log('Timestamp:', new Date().toISOString());
          
          if (change.operationType === 'update' && change.updateDescription) {
            console.log('Campos modificados:', JSON.stringify(change.updateDescription.updatedFields, null, 2));
            console.log('Campos removidos:', JSON.stringify(change.updateDescription.removedFields, null, 2));
          }
          
          if (change.fullDocument && change.fullDocument.name === 'Plan Marketing') {
            console.log('🚨 Plan Marketing - Members count:', change.fullDocument.members?.length);
            console.log('🚨 Members:', JSON.stringify(change.fullDocument.members, null, 2));
          }
          console.log('🚨 ================================\n');
        }
      });
      
      console.log('✅ Change Stream activado - monitoreando cambios en projects');
    } catch (streamError) {
      console.log('⚠️ Change Stream no disponible:', streamError.message);
    }
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
      console.error('6. Espera 1-2 minutos y reinicia el servidor\n');
    }
    
    console.error('========================================\n');
    process.exit(1);
  }
};

export default connectDB;
