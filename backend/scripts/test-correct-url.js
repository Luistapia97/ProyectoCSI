import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB\n');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

async function testCorrectURL() {
  try {
    const user = await User.findOne({ 
      zohoAccessToken: { $exists: true, $ne: null }
    }).sort({ updatedAt: -1 });

    if (!user) {
      console.error('❌ No se encontró usuario con token');
      process.exit(1);
    }

    console.log('👤 Usuario:', user.email);
    const token = user.zohoAccessToken;

    // PASO 1: Primero necesitamos el calendar UID
    console.log('\n📅 PASO 1: Obteniendo calendar UID...');
    console.log('URL: https://calendar.zoho.com/api/v1/calendars');
    
    let calendarUid;
    try {
      const calendarsResp = await axios.get(
        'https://calendar.zoho.com/api/v1/calendars',
        { headers: { 'Authorization': `Zoho-oauthtoken ${token}` } }
      );
      calendarUid = calendarsResp.data.calendars[0].uid;
      console.log('✅ Calendar UID:', calendarUid);
    } catch (error) {
      console.error('❌ Error obteniendo calendarios:', error.response?.data || error.message);
      console.log('\n⚠️  El token NO tiene scope para calendarios.');
      console.log('   Esto confirma que necesitas re-autenticarte con:');
      console.log('   - ZohoCalendar.event.ALL (para eventos)');
      console.log('   O mejor aún:');
      console.log('   - ZohoCalendar.calendar.ALL (para calendarios Y eventos)');
      process.exit(1);
    }

    // PASO 2: Intentar crear evento en ese calendario
    console.log('\n📝 PASO 2: Creando evento en calendario específico...');
    const url = `https://calendar.zoho.com/api/v1/calendars/${calendarUid}/events`;
    console.log('URL:', url);

    const now = new Date();
    const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const eventdataObject = {
      title: '🎯 Test Final - Nexus (Query Param)',
      description: 'Prueba enviando eventdata como query parameter según documentación oficial',
      dateandtime: {
        start: formatDate(start),
        end: formatDate(end),
        timezone: 'America/Mexico_City'
      },
      isallday: false
    };

    console.log('eventdata (como query param):', JSON.stringify(eventdataObject, null, 2));

    try {
      // Según documentación: eventdata va como QUERY PARAMETER
      const response = await axios.post(
        url,
        null, // Body vacío
        {
          params: {
            eventdata: JSON.stringify(eventdataObject) // Como query parameter
          },
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('\n✅✅✅ ¡ÉXITO! Evento creado correctamente');
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
      console.log('\n🎉 Estructura correcta confirmada:');
      console.log(`   POST /api/v1/calendars/{calendar_uid}/events`);
      console.log(`   eventdata como query parameter (JSON stringified)`);
    } catch (error) {
      console.error('\n❌ Error creando evento:');
      console.error('Status:', error.response?.status);
      console.error('URL completa intentada:', error.config?.url);
      
      if (typeof error.response?.data === 'string' && error.response?.data.includes('<html')) {
        console.error('❌ Error HTML 404: Page not found');
        console.log('\n🤔 Posibles causas:');
        console.log('   1. El calendar_uid es inválido');
        console.log('   2. El token no tiene scope correcto');
        console.log('   3. El formato del query parameter es incorrecto');
        console.log('   4. Necesitas re-autenticarte con ZohoCalendar.calendar.ALL');
      } else {
        console.error('Data:', error.response?.data);
      }
    }

    console.log('\n📋 CONCLUSIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Para que funcione necesitas AMBOS scopes:');
    console.log('  ✓ ZohoCalendar.calendar.READ (para obtener calendar_uid)');
    console.log('  ✓ ZohoCalendar.event.CREATE (para crear eventos)');
    console.log('\nO simplemente usar:');
    console.log('  ✓ ZohoCalendar.calendar.ALL (incluye todo)');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

await testCorrectURL();
