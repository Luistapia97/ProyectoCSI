import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URI = 'mongodb+srv://Admin:Sanandres14@cluster0.v2fu9dg.mongodb.net/proyecto_nexus?retryWrites=true&w=majority';

async function checkUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const users = await User.find({})
      .select('name email authProvider zohoAccessToken zohoRefreshToken')
      .lean();

    console.log('\n📊 Usuarios en la base de datos:\n');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Auth Provider: ${user.authProvider || 'local'}`);
      console.log(`   Zoho Access Token: ${user.zohoAccessToken ? '✅ Sí' : '❌ No'}`);
      console.log(`   Zoho Refresh Token: ${user.zohoRefreshToken ? '✅ Sí' : '❌ No'}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
