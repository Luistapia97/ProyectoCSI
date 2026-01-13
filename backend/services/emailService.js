import pkg from 'nodemailer';
const { createTransport } = pkg;
import path from 'path';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Obtiene o crea el transportador de correo
   */
  getTransporter() {
    if (!this.transporter) {
      console.log('📧 Inicializando transportador SMTP...');
      console.log(`   Host: ${process.env.SMTP_HOST}`);
      console.log(`   Puerto: ${process.env.SMTP_PORT}`);
      console.log(`   Usuario: ${process.env.SMTP_USER}`);
      
      this.transporter = createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        debug: true,
        logger: true
      });
    }
    return this.transporter;
  }

  /**
   * Envía el reporte semanal por correo
   */
  async sendWeeklyReport(reportPath, reportData, recipientEmail) {
    try {
      const { generatedAt, globalMetrics } = reportData;

      const mailOptions = {
        from: `"Sistema Nexus CSI" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `📊 Reporte Semanal de Seguimiento - ${this.formatDate(generatedAt)}`,
        html: this.generateEmailHTML(reportData),
        attachments: [
          {
            filename: path.basename(reportPath),
            path: reportPath
          }
        ]
      };

      const info = await this.getTransporter().sendMail(mailOptions);
      console.log('✅ Reporte enviado exitosamente:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando reporte:', error);
      throw error;
    }
  }

  /**
   * Genera el HTML del correo electrónico
   */
  generateEmailHTML(reportData) {
    const { generatedAt, period, globalMetrics, userMetrics, projectMetrics } = reportData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #667eea;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #667eea;
          margin: 0;
          font-size: 24px;
        }
        .header p {
          color: #64748b;
          margin: 10px 0 0;
          font-size: 14px;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .metric-card {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .metric-value {
          font-size: 28px;
          font-weight: bold;
          color: #1e293b;
          margin: 0;
        }
        .metric-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 5px;
        }
        .section {
          margin: 25px 0;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .highlight-value {
          font-size: 36px;
          font-weight: bold;
          margin: 0;
        }
        .highlight-label {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 5px;
        }
        .stats-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 10px;
          background: #f8fafc;
          border-radius: 6px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 20px;
          font-weight: bold;
        }
        .stat-label {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
        }
        .success { color: #10b981; }
        .warning { color: #f59e0b; }
        .danger { color: #ef4444; }
        .info { color: #6366f1; }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Reporte Semanal de Seguimiento</h1>
          <p>Proyecto Nexus - Sistema de Gestión CSI</p>
          <p><strong>${this.formatDate(generatedAt)}</strong></p>
          <p>Período: ${this.formatDateShort(period.from)} - ${this.formatDateShort(period.to)}</p>
        </div>

        <div class="highlight">
          <div class="highlight-value">${globalMetrics.globalCompletionRate}%</div>
          <div class="highlight-label">Tasa de Cumplimiento Global</div>
        </div>

        <div class="section">
          <div class="section-title">📈 Resumen General</div>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-value">${globalMetrics.totalProjects}</div>
              <div class="metric-label">Proyectos Activos</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${globalMetrics.totalUsers}</div>
              <div class="metric-label">Usuarios Activos</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${globalMetrics.totalTasks}</div>
              <div class="metric-label">Tareas Totales</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${globalMetrics.completedThisWeek}</div>
              <div class="metric-label">Completadas (Semana)</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📊 Estado de Tareas</div>
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-value success">${globalMetrics.completedTasks}</div>
              <div class="stat-label">Completadas</div>
            </div>
            <div class="stat-item">
              <div class="stat-value warning">${globalMetrics.pendingTasks}</div>
              <div class="stat-label">Pendientes</div>
            </div>
            <div class="stat-item">
              <div class="stat-value danger">${globalMetrics.overdueTasks}</div>
              <div class="stat-label">Atrasadas</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🎯 Top 5 Proyectos</div>
          ${projectMetrics.slice(0, 5).map(project => `
            <div class="stats-row">
              <div style="flex: 1;">
                <strong>${project.name}</strong>
                <div class="stat-label">${project.members} miembros</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${project.metrics.progress}%</div>
                <div class="stat-label">Progreso</div>
              </div>
              <div class="stat-item">
                <div class="stat-value success">${project.metrics.completedTasks}</div>
                <div class="stat-label">Completadas</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">👥 Desempeño del Equipo</div>
          <p style="color: #64748b; font-size: 14px;">
            Este reporte incluye métricas detalladas de ${userMetrics.length} usuarios activos.
            Consulta el archivo PDF adjunto para ver el análisis completo por usuario y proyecto.
          </p>
          ${userMetrics.slice(0, 3).map(userData => `
            <div class="stats-row">
              <div style="flex: 1;">
                <strong>${userData.user.name}</strong>
                <div class="stat-label">${userData.user.email}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${userData.metrics.completionRate}%</div>
                <div class="stat-label">Cumplimiento</div>
              </div>
              <div class="stat-item">
                <div class="stat-value ${userData.metrics.overdueTasks > 0 ? 'danger' : 'success'}">
                  ${userData.metrics.overdueTasks}
                </div>
                <div class="stat-label">Atrasadas</div>
              </div>
            </div>
          `).join('')}
          ${userMetrics.length > 3 ? `<p style="text-align: center; color: #64748b; font-size: 12px;">+ ${userMetrics.length - 3} usuarios más...</p>` : ''}
        </div>

        <div class="footer">
          <p><strong>📎 Reporte Completo Adjunto</strong></p>
          <p>Revisa el archivo PDF adjunto para ver todas las métricas detalladas, análisis por usuario y seguimiento completo de proyectos.</p>
          <p style="margin-top: 20px;">
            Este es un correo automático generado por el sistema Proyecto Nexus.<br>
            © ${new Date().getFullYear()} CSI - Todos los derechos reservados
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Verifica la configuración del correo
   */
  async verifyConnection() {
    try {
      await this.getTransporter().verify();
      console.log('✅ Servidor de correo configurado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de correo:', error);
      return false;
    }
  }

  /**
   * Envía un correo de prueba
   */
  async sendTestEmail() {
    try {
      const mailOptions = {
        from: `"Sistema Nexus CSI" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER,
        subject: '✅ Prueba de Configuración SMTP - Sistema Nexus',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
              }
              .container {
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 3px solid #3b82f6;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #3b82f6;
                margin: 0;
                font-size: 24px;
              }
              .success-icon {
                font-size: 48px;
                text-align: center;
                margin: 20px 0;
              }
              .content {
                padding: 20px 0;
              }
              .info-box {
                background: #f0f9ff;
                border-left: 4px solid #3b82f6;
                padding: 15px;
                margin: 15px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #64748b;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Configuración SMTP Exitosa</h1>
              </div>
              
              <div class="success-icon">
                ✅
              </div>
              
              <div class="content">
                <p><strong>Felicidades!</strong></p>
                <p>Este es un correo de prueba para confirmar que la configuración SMTP del Sistema Nexus CSI está funcionando correctamente.</p>
                
                <div class="info-box">
                  <strong>Configuración actual:</strong><br>
                  <strong>Servidor:</strong> ${process.env.SMTP_HOST}<br>
                  <strong>Puerto:</strong> ${process.env.SMTP_PORT}<br>
                  <strong>Usuario:</strong> ${process.env.SMTP_USER}<br>
                  <strong>Fecha:</strong> ${new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                </div>
                
                <p>Ahora puedes:</p>
                <ul>
                  <li>📊 Generar reportes semanales</li>
                  <li>📧 Enviar reportes por correo</li>
                  <li>⏰ Programar envíos automáticos</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>Sistema de Gestión CSI - Proyecto Nexus</p>
                <p>Este es un correo automático, por favor no respondas.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.getTransporter().sendMail(mailOptions);
      console.log('✅ Correo de prueba enviado exitosamente:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando correo de prueba:', error);
      throw error;
    }
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

export default new EmailService();
