import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEmailConfig() {
  console.log('\n📧 CONFIGURACIÓN DE CORREO ELECTRÓNICO PARA REPORTES\n');
  console.log('Este asistente te ayudará a configurar el envío automático de reportes.\n');

  try {
    // Leer el archivo .env actual
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✓ Archivo .env encontrado. Se actualizará con la nueva configuración.\n');
    } else {
      console.log('⚠️  No se encontró archivo .env. Se creará uno nuevo.\n');
      // Copiar desde .env.example
      const examplePath = path.join(__dirname, '../.env.example');
      if (fs.existsSync(examplePath)) {
        envContent = fs.readFileSync(examplePath, 'utf8');
      }
    }

    // Preguntar por el proveedor
    console.log('Selecciona tu proveedor de correo:');
    console.log('1) Gmail');
    console.log('2) Outlook/Hotmail');
    console.log('3) Yahoo');
    console.log('4) Zoho Mail');
    console.log('5) Otro (personalizado)\n');
    
    const provider = await question('Opción (1-5): ');
    
    let smtpHost, smtpPort;
    switch(provider.trim()) {
      case '1':
        smtpHost = 'smtp.gmail.com';
        smtpPort = '587';
        console.log('\n📝 Para Gmail necesitas una "Contraseña de aplicación":');
        console.log('   1. Ve a: https://myaccount.google.com/apppasswords');
        console.log('   2. Selecciona "Correo" y "Otro dispositivo"');
        console.log('   3. Copia la contraseña generada (16 caracteres)\n');
        break;
      case '2':
        smtpHost = 'smtp-mail.outlook.com';
        smtpPort = '587';
        break;
      case '3':
        smtpHost = 'smtp.mail.yahoo.com';
        smtpPort = '587';
        break;
      case '4':
        smtpHost = 'smtp.zoho.com';
        smtpPort = '587';
        console.log('\n📝 Para Zoho Mail:');
        console.log('   - Usa tu dirección de correo completa como usuario');
        console.log('   - Usa tu contraseña normal de Zoho\n');
        break;
      case '5':
        smtpHost = await question('Host SMTP: ');
        smtpPort = await question('Puerto SMTP (normalmente 587): ');
        break;
      default:
        console.log('❌ Opción inválida');
        process.exit(1);
    }

    const smtpUser = await question('\nCorreo electrónico (SMTP_USER): ');
    const smtpPass = await question('Contraseña o contraseña de aplicación (SMTP_PASS): ');
    
    console.log('\n📬 Destinatarios de reportes:');
    const recipients = await question('Ingresa los correos separados por comas: ');

    console.log('\n⏰ Programación del reporte:');
    console.log('Ejemplos:');
    console.log('  0 9 * * 1  - Lunes a las 9:00 AM');
    console.log('  0 17 * * 5 - Viernes a las 5:00 PM');
    console.log('  0 8 * * *  - Todos los días a las 8:00 AM\n');
    
    const cronSchedule = await question('Programación cron (Enter para usar 0 9 * * 1): ') || '0 9 * * 1';
    
    const timezone = await question('\nZona horaria (Enter para America/Mexico_City): ') || 'America/Mexico_City';

    // Actualizar o agregar las variables en el archivo .env
    const updates = {
      SMTP_HOST: smtpHost,
      SMTP_PORT: smtpPort,
      SMTP_USER: smtpUser,
      SMTP_PASS: smtpPass,
      REPORT_RECIPIENTS: recipients,
      CRON_WEEKLY_REPORT: cronSchedule,
      TIMEZONE: timezone
    };

    // Procesar el contenido del .env
    let lines = envContent.split('\n');
    let updatedContent = [];
    let addedKeys = new Set();

    // Actualizar variables existentes
    for (let line of lines) {
      let updated = false;
      for (let [key, value] of Object.entries(updates)) {
        if (line.startsWith(`${key}=`)) {
          updatedContent.push(`${key}=${value}`);
          addedKeys.add(key);
          updated = true;
          break;
        }
      }
      if (!updated && line.trim() !== '') {
        updatedContent.push(line);
      }
    }

    // Agregar nuevas variables al final
    updatedContent.push('\n# Configuración de Reportes por Email');
    for (let [key, value] of Object.entries(updates)) {
      if (!addedKeys.has(key)) {
        updatedContent.push(`${key}=${value}`);
      }
    }

    // Guardar el archivo
    fs.writeFileSync(envPath, updatedContent.join('\n') + '\n');

    console.log('\n✅ Configuración guardada exitosamente en .env\n');
    console.log('📋 Resumen de la configuración:');
    console.log(`   Host SMTP: ${smtpHost}`);
    console.log(`   Puerto: ${smtpPort}`);
    console.log(`   Usuario: ${smtpUser}`);
    console.log(`   Destinatarios: ${recipients}`);
    console.log(`   Programación: ${cronSchedule}`);
    console.log(`   Zona horaria: ${timezone}`);
    console.log('\n🔄 Reinicia el servidor backend para aplicar los cambios.\n');
    console.log('📝 Puedes probar el envío desde el panel de administración usando "Verificar Email".\n');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  } finally {
    rl.close();
  }
}

setupEmailConfig();
