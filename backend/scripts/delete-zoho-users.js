// Script para eliminar TODOS los usuarios de Zoho
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Eliminar TODOS los usuarios con authProvider zoho o email temporal
    const result = await usersCollection.deleteMany({
      $or: [
        { authProvider: 'zoho' },
        { email: { $regex: '@temp.nexus.local$' } },
        { zohoId: { $exists: true } }
      ]
    });
    
    console.log('🗑️ Usuarios de Zoho eliminados:', result.deletedCount);
    
    // Mostrar usuarios restantes
    const remaining = await usersCollection.find({}).toArray();
    console.log('\n📋 Usuarios restantes:', remaining.length);
    remaining.forEach(user => {
      console.log(`   ${user.email} (${user.authProvider || 'local'})`);
    });
    
    console.log('\n✅ Base de datos limpiada');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

