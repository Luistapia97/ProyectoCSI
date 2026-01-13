import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import emailService from '../services/emailService.js';
import reportService from '../services/reportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function testReportEmail() {
  console.log('\n📧 TEST DE ENVÍO DE REPORTE POR EMAIL\n');
  
  try {
    // 0. Conectar a MongoDB
    console.log('0️⃣ Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // 1. Verificar configuración
    console.log('1️⃣ Verificando configuración SMTP...');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   Puerto: ${process.env.SMTP_PORT}`);
    console.log(`   Usuario: ${process.env.SMTP_USER}`);
    console.log(`   Destinatarios: ${process.env.REPORT_RECIPIENTS}\n`);
    
    const isValid = await emailService.verifyConnection();
    if (!isValid) {
      console.error('❌ Error: No se pudo conectar al servidor SMTP');
      process.exit(1);
    }
    console.log('✅ Conexión SMTP válida\n');
    
    // 2. Generar reporte
    console.log('2️⃣ Generando reporte PDF...');
    const { filepath, reportData } = await reportService.generateWeeklyReport();
    console.log(`✅ Reporte generado: ${filepath}\n`);
    
    // 3. Enviar a destinatarios
    const recipients = process.env.REPORT_RECIPIENTS?.split(',').map(e => e.trim()) || [];
    
    if (recipients.length === 0) {
      console.error('❌ No hay destinatarios configurados');
      console.log('💡 Configura REPORT_RECIPIENTS en el archivo .env\n');
      process.exit(1);
    }
    
    console.log(`3️⃣ Enviando reporte a ${recipients.length} destinatario(s)...`);
    
    for (const recipient of recipients) {
      try {
        console.log(`   📤 Enviando a: ${recipient}...`);
        await emailService.sendWeeklyReport(filepath, reportData, recipient);
        console.log(`   ✅ Enviado exitosamente a: ${recipient}`);
      } catch (error) {
        console.error(`   ❌ Error enviando a ${recipient}:`, error.message);
      }
    }
    
    console.log('\n✅ Proceso completado\n');
    console.log('📨 Revisa tu bandeja de entrada (y SPAM) en:');
    recipients.forEach(r => console.log(`   - ${r}`));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error.message);
    console.error('\nDetalles del error:', error);
  } finally {
    // Desconectar de MongoDB
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
  
  process.exit(0);
}

testReportEmail();
