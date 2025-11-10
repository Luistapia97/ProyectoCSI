import ZohoMailService from '../services/zohoMail.js';

/**
 * Enviar email de asignación de tarea
 * @param {Object} taskData  Datos de la tarea
 * @param {Object} assignedUser  Usuario al que se asigna
 * @param {Object} assignedBy  Usuario que asigna la tarea (con email y token de Zoho)
 */
export async function sendTaskAssignmentEmail(taskData, assignedUser, assignedBy) {
  try {
    if (!assignedUser.email) {
      console.log('⚠️ Usuario sin email, no se puede enviar notificación:', assignedUser.name);
      return { success: false, reason: 'no_email' };
    }

    const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${taskData._id}`;
    
    const dueDateFormatted = taskData.dueDate 
      ? new Date(taskData.dueDate).toLocaleDateString('esMX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2digit',
          minute: '2digit'
        })
      : 'Sin fecha límite';

    const priorityLabels = {
      low: '🟢 Baja',
      medium: '🟡 Media',
      high: '🔴 Alta',
      urgent: '🔴🔴 Urgente'
    };

    const mailOptions = {
      from: `"Nexus  Sistema de Gestión" <${process.env.EMAIL_USER}>`,
      to: assignedUser.email,
      subject: `📋 Nueva tarea asignada: ${taskData.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              fontfamily: applesystem, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sansserif;
              lineheight: 1.6;
              color: #333;
              maxwidth: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: lineargradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              borderradius: 10px 10px 0 0;
              textalign: center;
            }
            .header h1 {
              margin: 0;
              fontsize: 24px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border: 1px solid #e0e0e0;
              bordertop: none;
            }
            .taskcard {
              background: white;
              padding: 20px;
              borderradius: 8px;
              margin: 20px 0;
              boxshadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .tasktitle {
              fontsize: 20px;
              fontweight: bold;
              color: #667eea;
              marginbottom: 15px;
            }
            .taskdetail {
              margin: 10px 0;
              padding: 8px 0;
              borderbottom: 1px solid #f0f0f0;
            }
            .taskdetail:lastchild {
              borderbottom: none;
            }
            .label {
              fontweight: bold;
              color: #666;
              display: inlineblock;
              width: 140px;
            }
            .value {
              color: #333;
            }
            .description {
              background: #f5f5f5;
              padding: 15px;
              borderradius: 5px;
              margin: 15px 0;
              whitespace: prewrap;
            }
            .button {
              display: inlineblock;
              background: lineargradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              textdecoration: none;
              borderradius: 5px;
              margin: 20px 0;
              fontweight: bold;
            }
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              background: #f0f0f0;
              padding: 20px;
              borderradius: 0 0 10px 10px;
              textalign: center;
              fontsize: 12px;
              color: #666;
            }
            .prioritybadge {
              display: inlineblock;
              padding: 4px 12px;
              borderradius: 12px;
              fontsize: 12px;
              fontweight: bold;
            }
            .priorityhigh, .priorityurgent {
              background: #fee;
              color: #c00;
            }
            .prioritymedium {
              background: #ffc;
              color: #c90;
            }
            .prioritylow {
              background: #efe;
              color: #090;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Nueva Tarea Asignada</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${assignedUser.name}</strong>,</p>
            <p><strong>${assignedBy.name}</strong> te ha asignado una nueva tarea en el sistema Nexus.</p>
            
            <div class="taskcard">
              <div class="tasktitle">${taskData.title}</div>
              
              <div class="taskdetail">
                <span class="label">📅 Fecha límite:</span>
                <span class="value">${dueDateFormatted}</span>
              </div>
              
              <div class="taskdetail">
                <span class="label">⚡ Prioridad:</span>
                <span class="value">${priorityLabels[taskData.priority] || taskData.priority}</span>
              </div>
              
              <div class="taskdetail">
                <span class="label">👤 Asignado por:</span>
                <span class="value">${assignedBy.name} (${assignedBy.email})</span>
              </div>
              
              ${taskData.project ? `
                <div class="taskdetail">
                  <span class="label">📁 Proyecto:</span>
                  <span class="value">${taskData.project.name || 'Sin proyecto'}</span>
                </div>
              ` : ''}
              
              ${taskData.description ? `
                <div style="margintop: 20px;">
                  <strong>📝 Descripción:</strong>
                  <div class="description">${taskData.description}</div>
                </div>
              ` : ''}
            </div>
            
            <center>
              <a href="${taskUrl}" class="button">Ver Tarea en Nexus</a>
            </center>
            
            <p style="margintop: 30px; color: #666; fontsize: 14px;">
              💡 <strong>Tip:</strong> Haz clic en el botón de arriba para acceder directamente a la tarea y comenzar a trabajar en ella.
            </p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del sistema Nexus.</p>
            <p>Si tienes alguna duda, contacta a tu administrador.</p>
            <p style="margintop: 10px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #667eea;">Ir a Nexus</a>
            </p>
          </div>
        </body>
        </html>
      `,
      // Versión de texto plano como fallback
      text: `
        Nueva Tarea Asignada
        
        Hola ${assignedUser.name},
        
        ${assignedBy.name} te ha asignado una nueva tarea en el sistema Nexus.
        
        Título: ${taskData.title}
        Fecha límite: ${dueDateFormatted}
        Prioridad: ${priorityLabels[taskData.priority] || taskData.priority}
        Asignado por: ${assignedBy.name} (${assignedBy.email})
        ${taskData.project ? `Proyecto: ${taskData.project.name}` : ''}
        
        ${taskData.description ? `\nDescripción:\n${taskData.description}` : ''}
        
        Ver tarea: ${taskUrl}
        
        
        Este es un mensaje automático del sistema Nexus.
      `
    };

    // Verificar que el usuario que asigna tenga cuenta de Zoho conectada
    if (!assignedBy.zohoAccessToken || !assignedBy.email) {
      console.log('⚠️ Usuario que asigna no tiene cuenta de Zoho conectada');
      console.log('   Usuario:', assignedBy.name);
      console.log('   Email:', assignedBy.email || 'No disponible');
      console.log('   Token Zoho:', assignedBy.zohoAccessToken ? 'Presente' : 'No disponible');
      console.log('� El usuario debe iniciar sesión con Zoho para enviar notificaciones');
      
      return {
        success: false,
        reason: 'no_zoho_token',
        message: 'El usuario no tiene cuenta de Zoho conectada. Debe iniciar sesión con Zoho para enviar notificaciones por email.',
      };
    }

    // Enviar email usando Zoho Mail API
    console.log('🔵 Enviando email desde Zoho Mail...');
    console.log('   De:', assignedBy.email);
    console.log('   Para:', assignedUser.email);
    
    const zohoMailService = new ZohoMailService(assignedBy.zohoAccessToken, assignedBy.email);
    
    const zohoResult = await zohoMailService.sendEmail({
      to: assignedUser.email,
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
      textContent: mailOptions.text,
    });

    if (zohoResult.success) {
      console.log('✅ Email enviado desde Zoho Mail:', zohoResult.messageId);
      console.log('   Tarea:', taskData.title);
      
      return {
        success: true,
        messageId: zohoResult.messageId,
        recipient: assignedUser.email,
        method: 'zoho',
      };
    } else {
      console.log('❌ Error al enviar email desde Zoho Mail');
      console.log('   Error:', zohoResult.error);
      
      if (zohoResult.needsReauth) {
        console.log('🔄 El token de Zoho ha expirado. El usuario debe volver a iniciar sesión.');
        return {
          success: false,
          error: zohoResult.error,
          needsReauth: true,
          message: 'El token de Zoho ha expirado. Inicia sesión nuevamente con Zoho.',
        };
      }
      
      if (zohoResult.needsAppPassword) {
        console.log('🔐 Zoho requiere contraseña de aplicación');
        return {
          success: false,
          error: zohoResult.error,
          needsAppPassword: true,
          message: 'Zoho Mail requiere configurar una contraseña de aplicación. Contacta al administrador.',
          details: zohoResult.details,
        };
      }
      
      return {
        success: false,
        error: zohoResult.error,
        message: 'No se pudo enviar el email desde Zoho Mail: ' + zohoResult.error,
      };
    }

  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Enviar email de actualización de tarea
 * @param {Object} taskData  Datos de la tarea
 * @param {Object} assignedUser  Usuario asignado
 * @param {Object} updatedBy  Usuario que actualiza
 * @param {Object} changes  Cambios realizados
 */
export async function sendTaskUpdateEmail(taskData, assignedUser, updatedBy, changes) {
  try {
    if (!assignedUser.email) {
      return { success: false, reason: 'no_email' };
    }

    const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${taskData._id}`;
    
    const changesList = Object.entries(changes)
      .map(([key, value]) => {
        const labels = {
          title: 'Título',
          description: 'Descripción',
          status: 'Estado',
          priority: 'Prioridad',
          dueDate: 'Fecha límite'
        };
        return `<li><strong>${labels[key] || key}:</strong> ${value.old} → ${value.new}</li>`;
      })
      .join('');

    const mailOptions = {
      from: `"Nexus  Sistema de Gestión" <${process.env.EMAIL_USER}>`,
      to: assignedUser.email,
      subject: `🔄 Tarea actualizada: ${taskData.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { fontfamily: Arial, sansserif; lineheight: 1.6; color: #333; }
            .container { maxwidth: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; borderradius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .button { display: inlineblock; background: #667eea; color: white; padding: 10px 20px; textdecoration: none; borderradius: 5px; margin: 15px 0; }
            ul { background: white; padding: 20px; borderradius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔄 Tarea Actualizada</h2>
            </div>
            <div class="content">
              <p>Hola <strong>${assignedUser.name}</strong>,</p>
              <p><strong>${updatedBy.name}</strong> ha actualizado la tarea: <strong>${taskData.title}</strong></p>
              
              <h3>Cambios realizados:</h3>
              <ul>${changesList}</ul>
              
              <center>
                <a href="${taskUrl}" class="button">Ver Tarea</a>
              </center>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de actualización enviado:', info.messageId);
    
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error enviando email de actualización:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar configuración de email
 */
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en la configuración de email:', error.message);
    return false;
  }
}

