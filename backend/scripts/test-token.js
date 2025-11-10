import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URI = 'mongodb+srv://Admin:Sanandres14@cluster0.v2fu9dg.mongodb.net/proyecto_nexus?retryWrites=true&w=majority';

async function testToken() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const user = await User.findOne({ email: 'info@proyectoscsi.mx' });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      await mongoose.disconnect();
      return;
    }

    console.log('👤 Usuario:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔐 Auth Provider:', user.authProvider);
    console.log('🎫 Zoho Access Token:', user.zohoAccessToken ? `${user.zohoAccessToken.substring(0, 50)}...` : 'No tiene');
    console.log('🔄 Zoho Refresh Token:', user.zohoRefreshToken ? 'Sí tiene' : 'No tiene');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testToken();
