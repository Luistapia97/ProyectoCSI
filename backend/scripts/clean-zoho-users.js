// Script para limpiar usuarios duplicados de Zoho
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Buscar usuarios con email info@proyectoscsi.mx
    const users = await usersCollection.find({ 
      email: 'info@proyectoscsi.mx' 
    }).toArray();
    
    console.log('\n📋 Usuarios encontrados con email info@proyectoscsi.mx:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Usuario:`);
      console.log('   ID:', user._id);
      console.log('   Email:', user.email);
      console.log('   Nombre:', user.name);
      console.log('   Auth Provider:', user.authProvider);
      console.log('   Zoho ID:', user.zohoId || 'No tiene');
      console.log('   Creado:', user.createdAt);
    });
    
    // También buscar usuarios temporales de Zoho
    const tempUsers = await usersCollection.find({ 
      email: { $regex: '@temp.nexus.local$' }
    }).toArray();
    
    console.log('\n📧 Usuarios temporales de Zoho encontrados:', tempUsers.length);
    tempUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Usuario temporal:`);
      console.log('   ID:', user._id);
      console.log('   Email:', user.email);
      console.log('   Zoho ID:', user.zohoId);
    });
    
    // Si hay múltiples usuarios con el mismo email, mantener solo uno
    if (users.length > 1) {
      console.log('\n⚠️ Se encontraron múltiples usuarios con el mismo email');
      console.log('💡 Manteniendo el más reciente y eliminando duplicados...');
      
      // Ordenar por fecha de creación (más reciente primero)
      users.sort((a, b) => new Date(b.createdAt)  new Date(a.createdAt));
      
      const keepUser = users[0];
      const deleteUsers = users.slice(1);
      
      console.log('\n✅ Usuario a mantener:', keepUser._id);
      console.log('🗑️ Usuarios a eliminar:', deleteUsers.length);
      
      for (const user of deleteUsers) {
        await usersCollection.deleteOne({ _id: user._id });
        console.log('   ✓ Eliminado:', user._id);
      }
      
      console.log('\n✅ Limpieza completada');
    } else if (users.length === 1) {
      console.log('\n✅ Solo hay un usuario con ese email, todo está bien');
    }
    
    // Eliminar usuarios temporales antiguos (más de 1 día)
    const oneDayAgo = new Date(Date.now()  24 * 60 * 60 * 1000);
    const oldTempUsers = await usersCollection.find({
      email: { $regex: '@temp.nexus.local$' },
      createdAt: { $lt: oneDayAgo }
    }).toArray();
    
    if (oldTempUsers.length > 0) {
      console.log('\n🧹 Eliminando', oldTempUsers.length, 'usuarios temporales antiguos...');
      for (const user of oldTempUsers) {
        await usersCollection.deleteOne({ _id: user._id });
        console.log('   ✓ Eliminado:', user.email);
      }
    }
    
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

