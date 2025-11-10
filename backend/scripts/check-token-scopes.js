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
console.log('✅ Conectado a MongoDB\n');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function checkTokenScopes() {
  try {
    // Buscar usuario más reciente con token de Zoho
    const user = await User.findOne({ 
      zohoAccessToken: { $exists: true, $ne: null }
    }).sort({ updatedAt: -1 });

    if (!user) {
      console.error('❌ No se encontró usuario con token de Zoho');
      process.exit(1);
    }

    console.log('👤 Usuario:', user.email);
    console.log('📅 Última actualización:', user.updatedAt);
    console.log('🔑 Access Token (primeros 20 chars):', user.zohoAccessToken?.substring(0, 20) + '...');
    console.log('🔄 Refresh Token:', user.zohoRefreshToken ? 'Sí ✅' : 'No ❌');

    // Intentar llamar a diferentes endpoints para ver qué scopes tiene
    const token = user.zohoAccessToken;

    console.log('\n🧪 Probando diferentes endpoints de Zoho...\n');

    // Test 1: GET /calendars (requiere ZohoCalendar.calendar.READ o ZohoCalendar.calendar.ALL)
    console.log('1️⃣ Test: GET /api/v1/calendars');
    try {
      const response1 = await axios.get('https://calendar.zoho.com/api/v1/calendars', {
        headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
      });
      console.log('   ✅ FUNCIONA - Tiene scope para leer calendarios');
      console.log('   Calendarios encontrados:', response1.data.calendars?.length || 0);
    } catch (error1) {
      console.error('   ❌ FALLÓ:', error1.response?.data?.[0]?.message || error1.message);
    }

    // Test 2: POST /events (requiere ZohoCalendar.event.CREATE o ZohoCalendar.event.ALL)
    console.log('\n2️⃣ Test: POST /api/v1/events (crear evento)');
    
    const now = new Date();
    const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };

    const testPayload = {
      eventdata: {
        title: '🧪 Test de Scope - Nexus',
        description: 'Verificando scopes del token',
        dateandtime: {
          start: formatDate(start),
          end: formatDate(end),
          timezone: 'America/Mexico_City'
        },
        isallday: false
      }
    };

    console.log('   Payload:', JSON.stringify(testPayload, null, 2));

    try {
      const response2 = await axios.post(
        'https://calendar.zoho.com/api/v1/events',
        testPayload,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('   ✅ FUNCIONA - Tiene scope para crear eventos');
      console.log('   Evento creado:', response2.data);
    } catch (error2) {
      console.error('   ❌ FALLÓ:', error2.response?.status, error2.response?.statusText);
      if (typeof error2.response?.data === 'string' && error2.response?.data.includes('<html')) {
        console.error('   Error HTML 404: Page not found (URL incorrecta)');
      } else {
        console.error('   Error:', error2.response?.data?.[0]?.message || error2.message);
      }
    }

    // Test 3: GET /events (requiere ZohoCalendar.event.READ o ZohoCalendar.event.ALL)
    console.log('\n3️⃣ Test: GET /api/v1/events (leer eventos)');
    try {
      const response3 = await axios.get('https://calendar.zoho.com/api/v1/events', {
        headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
      });
      console.log('   ✅ FUNCIONA - Tiene scope para leer eventos');
      console.log('   Eventos encontrados:', response3.data.events?.length || 0);
    } catch (error3) {
      console.error('   ❌ FALLÓ:', error3.response?.data?.[0]?.message || error3.message);
    }

    console.log('\n📊 Resumen:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Si todos los tests fallaron con "INVALID_OAUTHSCOPE",');
    console.log('significa que necesitas volver a autenticarte con');
    console.log('los scopes correctos.');
    console.log('\n💡 Asegúrate de que el servidor backend esté corriendo');
    console.log('   y muestre: "Scopes: openid, email, profile, ZohoCalendar.event.ALL"');
    console.log('\nLuego:');
    console.log('   1. localStorage.clear() en el navegador');
    console.log('   2. Refresh (F5)');
    console.log('   3. Click en "Continuar con Zoho"');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

await checkTokenScopes();
