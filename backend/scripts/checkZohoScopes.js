import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const checkZohoScopes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener usuarios con zoho token
    const users = await User.find({ zohoAccessToken: { $exists: true, $ne: null } });

    if (users.length === 0) {
      console.log('⚠️ No hay usuarios con tokens de Zoho');
      process.exit(0);
    }

    console.log(`🔍 Verificando ${users.length} usuario(s) con tokens de Zoho:\n`);

    for (const user of users) {
      console.log(`👤 Usuario: ${user.name} (${user.email})`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Token: ${user.zohoAccessToken ? '✅ Sí' : '❌ No'}`);

      if (user.zohoAccessToken) {
        try {
          // Intentar obtener información del token
          console.log(`   🔑 Verificando validez del token...`);
          
          // Intentar acceder a Zoho Tasks API
          const tasksResponse = await axios.get(
            'https://tasks.zoho.com/api/v1/tasks',
            {
              headers: {
                'Authorization': `Zoho-oauthtoken ${user.zohoAccessToken}`
              }
            }
          );
          
          console.log(`   ✅ Token válido - Acceso a Zoho Tasks: OK`);
          console.log(`   📋 Tareas en Zoho: ${tasksResponse.data?.tasks?.length || 0}`);
          
        } catch (error) {
          if (error.response?.status === 401) {
            console.log(`   ❌ Token expirado o inválido`);
          } else if (error.response?.status === 404) {
            console.log(`   ❌ Zoho Tasks API no habilitada`);
            console.log(`   📝 Error: ${error.response?.data?.errorCode || 'URL_RULE_NOT_CONFIGURED'}`);
            console.log(`   💡 Solución: Habilitar scope ZohoTasks.tasks.ALL en Zoho API Console`);
          } else if (error.response?.status === 403) {
            console.log(`   ❌ Sin permisos para Zoho Tasks`);
            console.log(`   💡 Solución: Re-autenticar con el scope ZohoTasks.tasks.ALL`);
          } else {
            console.log(`   ⚠️ Error: ${error.response?.status} - ${error.message}`);
          }
        }

        // Intentar con Zoho Mail Tasks API
        try {
          console.log(`   🔑 Verificando acceso a Zoho Mail Tasks...`);
          
          const mailTasksResponse = await axios.get(
            `https://mail.zoho.com/api/accounts/${user.email}/tasks`,
            {
              headers: {
                'Authorization': `Zoho-oauthtoken ${user.zohoAccessToken}`
              }
            }
          );
          
          console.log(`   ✅ Token válido - Acceso a Zoho Mail Tasks: OK`);
          console.log(`   📧 Tareas en Zoho Mail: ${mailTasksResponse.data?.data?.length || 0}`);
          
        } catch (error) {
          if (error.response?.status === 401) {
            console.log(`   ❌ Token expirado o inválido para Mail Tasks`);
          } else if (error.response?.status === 404) {
            console.log(`   ❌ Zoho Mail Tasks API no habilitada`);
            console.log(`   📝 Error: ${error.response?.data?.errorCode || 'URL_RULE_NOT_CONFIGURED'}`);
            console.log(`   💡 Solución: Habilitar scope ZohoMail.tasks.ALL en Zoho API Console`);
          } else if (error.response?.status === 403) {
            console.log(`   ❌ Sin permisos para Zoho Mail Tasks`);
            console.log(`   💡 Solución: Re-autenticar con el scope ZohoMail.tasks.ALL`);
          } else {
            console.log(`   ⚠️ Error Mail Tasks: ${error.response?.status} - ${error.message}`);
          }
        }
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('\n✅ Verificación completada');
    console.log('\n📚 Documentación:');
    console.log('   - Zoho Tasks: https://www.zoho.com/tasks/help/api/');
    console.log('   - Zoho Mail Tasks: https://www.zoho.com/mail/help/api/');
    console.log('   - OAuth Scopes: https://www.zoho.com/accounts/protocol/oauth/scopes.html');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkZohoScopes();
