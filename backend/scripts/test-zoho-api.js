import axios from 'axios';

const accessToken = '1000.ba8370cd60d2f94bfcaccfd8eb66e7b7.1d85826ceca9b92d1e02f8e8bbbc0c6d';

async function testZohoAPI() {
  try {
    console.log('🧪 Probando API de Zoho Calendar...\n');
    
    // Intentar obtener la lista de calendarios
    const response = await axios.get(
      'https://calendar.zoho.com/api/v1/calendars',
      {
        headers: {
          'Authorization': `Zohooauthtoken ${accessToken}`,
        },
      }
    );
    
    console.log('✅ Token válido!');
    console.log('\n📅 Calendarios encontrados:');
    const calendars = response.data.calendars || [];
    calendars.forEach((cal, index) => {
      console.log(`\n${index + 1}. ${cal.name}`);
      console.log(`   UID: ${cal.uid}`);
      console.log(`   Primary: ${cal.isprimary ? 'Sí' : 'No'}`);
    });
    
  } catch (error) {
    console.error('❌ Token inválido o expirado');
    console.error('Error:', error.response?.data || error.message);
  }
}

testZohoAPI();

