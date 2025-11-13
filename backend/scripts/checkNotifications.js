import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener todas las notificaciones
    const notifications = await Notification.find({})
      .populate('user', 'name email')
      .populate('relatedUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`📋 Total de notificaciones: ${notifications.length}\n`);

    if (notifications.length === 0) {
      console.log('⚠️ No hay notificaciones en la base de datos');
      console.log('\n💡 Para crear notificaciones:');
      console.log('   1. Ve a http://localhost:5173');
      console.log('   2. Crea una nueva tarea');
      console.log('   3. Asígnala a un usuario');
      console.log('   4. La notificación se creará automáticamente\n');
    } else {
      notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title}`);
        console.log(`   Para: ${notif.user?.name || 'Usuario eliminado'} (${notif.user?.email || 'N/A'})`);
        console.log(`   Mensaje: ${notif.message}`);
        console.log(`   Tipo: ${notif.type}`);
        console.log(`   Leída: ${notif.read ? '✅ Sí' : '❌ No'}`);
        console.log(`   Creada: ${notif.createdAt.toLocaleString('es-MX')}`);
        console.log('');
      });
    }

    // Contar notificaciones por usuario
    console.log('📊 Notificaciones por usuario:\n');
    const users = await User.find({});
    
    for (const user of users) {
      const count = await Notification.countDocuments({ user: user._id });
      const unread = await Notification.countDocuments({ user: user._id, read: false });
      
      if (count > 0) {
        console.log(`👤 ${user.name} (${user.email})`);
        console.log(`   Total: ${count} | No leídas: ${unread}`);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkNotifications();
