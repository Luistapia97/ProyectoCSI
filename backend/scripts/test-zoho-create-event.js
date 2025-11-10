import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Conectar a MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

function formatDateForZoho(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

async function testCreateEvent() {
  try {
    // Buscar usuario con token de Zoho más reciente (ordenar por updatedAt)
    const user = await User.findOne({ 
      zohoAccessToken: { $exists: true, $ne: null }
    }).sort({ updatedAt: -1 }); // Obtener el más reciente

    if (!user) {
      console.error('❌ No se encontró ningún usuario con token de Zoho');
      process.exit(1);
    }

    console.log('📧 Usuario:', user.email);
    console.log('🔑 Token disponible:', !!user.zohoAccessToken);

    const accessToken = user.zohoAccessToken;
    const apiBase = 'https://calendar.zoho.com/api/v1';

    console.log('\n🔍 Verificando URL base de la API...');
    console.log('   API Base:', apiBase);

    // Paso 1: Verificar token con GET /calendars
    console.log('\n📅 Paso 1: Verificando token con GET /calendars...');
    
    let calendarUid = null;
    try {
      const calendarsResponse = await axios.get(
        `${apiBase}/calendars`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      console.log('✅ Token válido - Calendarios obtenidos:', calendarsResponse.data.calendars.length);
      calendarUid = calendarsResponse.data.calendars[0].uid;
      console.log('📆 Calendar UID:', calendarUid);
    } catch (error) {
      console.error('❌ Error verificando token:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.error || error.message);
      
      if (error.response?.status === 401) {
        console.error('\n⚠️  TOKEN EXPIRADO - Debes re-autenticarte con Zoho');
        console.error('   1. Abre http://localhost:5173');
        console.error('   2. Ejecuta: localStorage.clear()');
        console.error('   3. Haz clic en "Continuar con Zoho"');
        process.exit(1);
      }
    }

    // Paso 2: Crear evento
    console.log('\n📅 Paso 2: Creando evento de prueba...');

    const now = new Date();
    const startDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // En 2 horas
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora después

    const startFormatted = formatDateForZoho(startDate);
    const endFormatted = formatDateForZoho(endDate);

    console.log('   Start:', startFormatted);
    console.log('   End:', endFormatted);

    // MÉTODO 1: POST /api/v1/events (calendario predeterminado - MÁS SIMPLE)
    const url1 = `${apiBase}/events`;
    const payload1 = {
      eventdata: {
        title: '🧪 Test Nexus - Método 1 (Default Calendar)',
        description: 'Prueba usando endpoint /events (calendario predeterminado)',
        dateandtime: {
          start: startFormatted,
          end: endFormatted,
          timezone: 'America/Mexico_City'
        },
        location: 'Oficina Virtual',
        isallday: false
      }
    };

    console.log('\n🧪 MÉTODO 1: POST /events (calendario predeterminado)');
    console.log('   URL:', url1);
    console.log('   Payload:', JSON.stringify(payload1, null, 2));

    try {
      const response1 = await axios.post(url1, payload1, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('✅ MÉTODO 1 EXITOSO ✅');
      console.log('   Respuesta:', JSON.stringify(response1.data, null, 2));
      console.log('\n🎉 ¡ESTE ES EL MÉTODO CORRECTO! Usar: POST /api/v1/events');
    } catch (error1) {
      console.error('❌ MÉTODO 1 FALLÓ');
      console.error('   Status:', error1.response?.status);
      console.error('   URL intentada:', error1.config?.url);
      if (typeof error1.response?.data === 'string' && error1.response?.data.includes('<html')) {
        console.error('   Error: 404 Page not found (URL incorrecta)');
      } else {
        console.error('   Data:', error1.response?.data);
      }
    }

    // MÉTODO 2: POST /api/v1/calendars/{uid}/events (calendario específico)
    if (calendarUid) {
      const url2 = `${apiBase}/calendars/${calendarUid}/events`;
      const payload2 = {
        eventdata: {
          title: '🧪 Test Nexus - Método 2 (Specific Calendar)',
          description: 'Prueba usando endpoint /calendars/{uid}/events',
          dateandtime: {
            start: startFormatted,
            end: endFormatted,
            timezone: 'America/Mexico_City'
          },
          location: 'Oficina Virtual',
          isallday: false
        }
      };

      console.log('\n🧪 MÉTODO 2: POST /calendars/{uid}/events (calendario específico)');
      console.log('   URL:', url2);
      console.log('   Calendar UID usado:', calendarUid);
      console.log('   Payload:', JSON.stringify(payload2, null, 2));

      try {
        const response2 = await axios.post(url2, payload2, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('✅ MÉTODO 2 EXITOSO ✅');
        console.log('   Respuesta:', JSON.stringify(response2.data, null, 2));
        console.log('\n🎉 ¡ESTE TAMBIÉN FUNCIONA! Usar: POST /api/v1/calendars/{uid}/events');
      } catch (error2) {
        console.error('❌ MÉTODO 2 FALLÓ');
        console.error('   Status:', error2.response?.status);
        console.error('   URL intentada:', error2.config?.url);
        if (typeof error2.response?.data === 'string' && error2.response?.data.includes('<html')) {
          console.error('   Error: 404 Page not found (URL incorrecta)');
          console.error('   Posible causa: calendar_uid inválido o endpoint incorrecto');
        } else {
          console.error('   Data:', error2.response?.data);
        }
      }
    }

    // MÉTODO 3: Sin wrapper "eventdata" (intentar formato alternativo)
    const url3 = `${apiBase}/events`;
    const payload3 = {
      title: '🧪 Test Nexus - Método 3 (Sin wrapper)',
      description: 'Prueba sin wrapper eventdata',
      dateandtime: {
        start: startFormatted,
        end: endFormatted,
        timezone: 'America/Mexico_City'
      },
      location: 'Oficina Virtual',
      isallday: false
    };

    console.log('\n🧪 MÉTODO 3: POST /events (sin wrapper eventdata)');
    console.log('   URL:', url3);
    console.log('   Payload:', JSON.stringify(payload3, null, 2));

    console.log('   Payload:', JSON.stringify(payload3, null, 2));

    try {
      const response3 = await axios.post(url3, payload3, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('✅ MÉTODO 3 EXITOSO ✅');
      console.log('   Respuesta:', JSON.stringify(response3.data, null, 2));
      console.log('\n🎉 ¡SIN WRAPPER FUNCIONA! No usar eventdata wrapper');
    } catch (error3) {
      console.error('❌ MÉTODO 3 FALLÓ');
      console.error('   Status:', error3.response?.status);
      if (typeof error3.response?.data === 'string' && error3.response?.data.includes('<html')) {
        console.error('   Error: 404 Page not found');
      } else {
        console.error('   Data:', error3.response?.data);
      }
    }

    console.log('\n✅ Prueba completada');
    console.log('📊 Revisa cuál método funcionó y ese será el que implementemos');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  }
}

await testCreateEvent();
