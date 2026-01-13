import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

console.log('\n🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO\n');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✓ Configurada (oculta)' : '❌ NO CONFIGURADA');
console.log('REPORT_RECIPIENTS:', process.env.REPORT_RECIPIENTS);
console.log('\n');

if (!process.env.SMTP_PASS) {
  console.error('❌ ERROR: SMTP_PASS no está configurada en el archivo .env');
  console.log('\n💡 Verifica que en tu archivo backend/.env tengas:');
  console.log('   SMTP_PASS=tu_contraseña_aqui\n');
} else {
  console.log('✅ Todas las variables SMTP están configuradas');
}
