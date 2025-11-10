import nodemailer from 'nodemailer';

/**
 * Servicio para enviar correos usando Zoho Mail con SMTP
 * 
 * NOTA IMPORTANTE:
 *  Zoho Mail API REST tiene limitaciones y requiere configuración adicional
 *  SMTP con OAuth2 también tiene restricciones
 *  La mejor opción es usar SMTP con contraseña de aplicación de Zoho
 * 
 * Configuración requerida:
 * 1. Crear una "App Password" en Zoho Mail
 * 2. Ir a: Zoho Mail > Settings > Security > App Passwords
 * 3. Generar una contraseña para "Mail"
 * 4. Usar esa contraseña en lugar del token OAuth
 */
class ZohoMailService {
  constructor(accessToken, userEmail) {
    this.accessToken = accessToken;
    this.userEmail = userEmail;
  }

  /**
   * Enviar un correo electrónico usando SMTP de Zoho
   * 
   * MÉTODOS SOPORTADOS:
   * 1. OAuth2 (si el token tiene los scopes correctos)
   * 2. Contraseña de aplicación (más confiable)
   * 
   * @param {Object} emailData  Datos del correo
   * @param {string} emailData.to  Email del destinatario
   * @param {string} emailData.subject  Asunto del correo
   * @param {string} emailData.htmlContent  Contenido HTML del correo
   * @param {string} emailData.textContent  Contenido en texto plano (opcional)
   * @returns {Object}  Resultado de la operación
   */
  async sendEmail({ to, subject, htmlContent, textContent }) {
    try {
      console.log('📧 Enviando email desde Zoho Mail (SMTP)...');
      console.log(`   De: ${this.userEmail}`);
      console.log(`   Para: ${to}`);
      console.log(`   Asunto: ${subject}`);

      // OPCIÓN 1: Intentar con OAuth2 primero
      let transporter;
      let authMethod = 'OAuth2';
      
      try {
        transporter = nodemailer.createTransport({
          host: 'smtp.zoho.com',
          port: 465,
          secure: true,
          auth: {
            type: 'OAuth2',
            user: this.userEmail,
            accessToken: this.accessToken,
          },
          logger: false, // Desactivar logs verbosos
          debug: false,
        });

        // Verificar la conexión
        await transporter.verify();
        console.log('✅ Conexión SMTP verificada con OAuth2');
      } catch (oauthError) {
        console.log('⚠️ OAuth2 falló, Zoho requiere contraseña de aplicación');
        console.log('   Error:', oauthError.message);
        
        // OPCIÓN 2: Fallback  informar que se necesita contraseña de aplicación
        return {
          success: false,
          error: 'Zoho Mail requiere una contraseña de aplicación. Ve a Zoho Mail > Configuración > Seguridad > Contraseñas de Aplicación',
          needsAppPassword: true,
          details: 'OAuth2 no está soportado para SMTP de Zoho. Necesitas generar una contraseña de aplicación.',
        };
      }

      // Preparar el contenido del email
      const mailOptions = {
        from: `"${this.userEmail}" <${this.userEmail}>`,
        to: to,
        subject: subject,
        text: textContent || 'Por favor habilita HTML para ver este mensaje',
        html: htmlContent,
      };

      // Enviar el email
      const info = await transporter.sendMail(mailOptions);

      console.log('✅ Email enviado exitosamente desde Zoho Mail');
      console.log(`   Método: ${authMethod}`);
      console.log(`   Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        authMethod: authMethod,
        data: info,
      };
    } catch (error) {
      console.error('❌ Error enviando email desde Zoho Mail (SMTP)');
      console.error('   Mensaje:', error.message);
      console.error('   Código:', error.code);
      console.error('   Response:', error.response);
      
      // Analizar el tipo de error
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        return {
          success: false,
          error: 'Autenticación fallida con Zoho Mail. Necesitas configurar una contraseña de aplicación.',
          needsAppPassword: true,
          details: error.message,
        };
      }

      if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'No se pudo conectar al servidor SMTP de Zoho Mail (smtp.zoho.com:465)',
          details: error.message,
        };
      }

      if (error.code === 'EENVELOPE') {
        return {
          success: false,
          error: 'Email del destinatario inválido',
          details: error.message,
        };
      }

      return {
        success: false,
        error: error.message || 'Error desconocido al enviar email',
        code: error.code,
      };
    }
  }

  /**
   * Obtener el accountId desde el email del usuario
   * Por defecto, usa el dominio del email
   */
  getAccountId() {
    // Zoho Mail API requiere el accountId
    // Para cuentas personales de Zoho, típicamente es el email completo
    return this.userEmail;
  }

  /**
   * Verificar si el token de Zoho es válido
   * @returns {boolean}
   */
  async verifyToken() {
    try {
      const response = await axios.get(
        'https://accounts.zoho.com/oauth/user/info',
        {
          headers: {
            'Authorization': `Zohooauthtoken ${this.accessToken}`,
          },
        }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error('❌ Token de Zoho inválido o expirado');
      return false;
    }
  }
}

export default ZohoMailService;

