import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

async function testResend() {
  console.log('🧪 Probando configuración de Resend...\n');

  // Verificar que la API key existe
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY no está configurada en .env');
    process.exit(1);
  }

  console.log('✅ RESEND_API_KEY encontrada');
  console.log('🔑 Key empieza con:', process.env.RESEND_API_KEY.substring(0, 10) + '...');

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log('\n📧 Enviando email de prueba...');
    
    const result = await resend.emails.send({
      from: 'Sistema Nexus CSI <noreply@proyectoscsi.mx>',
      to: 'samuel@proyectoscsi.mx',
      subject: '🧪 Test desde script - Sistema Nexus',
      html: `
        <h1>✅ Prueba de Resend API</h1>
        <p>Este es un email de prueba desde el script testResend.js</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
        <p><strong>Estado:</strong> Si recibes este email, Resend está configurado correctamente!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Para enviar a otros destinatarios, verifica el dominio proyectoscsi.mx en Resend.
        </p>
      `
    });

    console.log('\n📬 Respuesta completa de Resend:');
    console.log(JSON.stringify(result, null, 2));

    if (result.data?.id || result.id) {
      console.log('\n✅ Email enviado exitosamente!');
      console.log('📨 ID:', result.data?.id || result.id);
    } else if (result.error) {
      console.log('\n❌ Error en el envío:');
      console.log(JSON.stringify(result.error, null, 2));
    } else {
      console.log('\n⚠️ Respuesta inesperada (sin ID ni error)');
    }

  } catch (error) {
    console.error('\n❌ Error capturado:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testResend();
