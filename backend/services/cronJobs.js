import cron from 'node-cron';
import reportService from './reportService.js';
import emailService from './emailService.js';

class CronJobService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Inicializa todos los trabajos programados
   */
  initializeJobs() {
    // Reporte semanal - Lunes a las 9:00 AM
    const weeklyReportJob = cron.schedule(
      process.env.CRON_WEEKLY_REPORT || '0 9 * * 1',
      async () => {
        console.log('🕐 Ejecutando tarea programada: Reporte semanal');
        await this.sendWeeklyReport();
      },
      {
        scheduled: true,
        timezone: process.env.TIMEZONE || 'America/Mexico_City'
      }
    );

    this.jobs.push({
      name: 'weekly-report',
      job: weeklyReportJob,
      schedule: process.env.CRON_WEEKLY_REPORT || '0 9 * * 1'
    });

    console.log('✅ Trabajos programados inicializados:');
    this.jobs.forEach(({ name, schedule }) => {
      console.log(`   - ${name}: ${schedule}`);
    });
  }

  /**
   * Genera y envía el reporte semanal
   */
  async sendWeeklyReport() {
    try {
      console.log('📊 Generando reporte semanal...');
      
      // Generar el reporte PDF
      const { filepath, reportData } = await reportService.generateWeeklyReport();
      console.log(`✅ Reporte generado: ${filepath}`);

      // Obtener destinatarios del reporte
      const recipients = this.getReportRecipients();

      if (recipients.length === 0) {
        console.log('⚠️ No hay destinatarios configurados para el reporte');
        console.log('💡 Configura REPORT_RECIPIENTS en el archivo .env');
        throw new Error('No hay destinatarios configurados. Configura REPORT_RECIPIENTS en .env');
      }

      console.log(`📧 Enviando reporte a ${recipients.length} destinatario(s)...`);
      
      // Enviar el reporte a cada destinatario
      let successCount = 0;
      let errorCount = 0;
      
      for (const recipient of recipients) {
        try {
          console.log(`📤 Enviando a: ${recipient}...`);
          await emailService.sendWeeklyReport(filepath, reportData, recipient);
          console.log(`✅ Reporte enviado exitosamente a: ${recipient}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Error enviando reporte a ${recipient}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Proceso completado: ${successCount} exitosos, ${errorCount} fallidos`);
      
      if (errorCount > 0 && successCount === 0) {
        throw new Error(`No se pudo enviar el reporte a ningún destinatario`);
      }
    } catch (error) {
      console.error('❌ Error en proceso de reporte semanal:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de destinatarios desde variables de entorno
   */
  getReportRecipients() {
    const recipientsString = process.env.REPORT_RECIPIENTS;
    
    if (!recipientsString) {
      return [];
    }

    // Soporta múltiples destinatarios separados por coma
    return recipientsString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  /**
   * Ejecuta manualmente el envío del reporte (para pruebas o uso manual)
   */
  async triggerWeeklyReport() {
    console.log('🔧 Ejecución manual del reporte semanal');
    await this.sendWeeklyReport();
  }

  /**
   * Detiene todos los trabajos programados
   */
  stopAllJobs() {
    console.log('🛑 Deteniendo trabajos programados...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`   - ${name} detenido`);
    });
  }

  /**
   * Reinicia todos los trabajos programados
   */
  restartAllJobs() {
    console.log('🔄 Reiniciando trabajos programados...');
    this.jobs.forEach(({ name, job }) => {
      job.start();
      console.log(`   - ${name} reiniciado`);
    });
  }

  /**
   * Obtiene el estado de todos los trabajos
   */
  getJobsStatus() {
    return this.jobs.map(({ name, schedule, job }) => ({
      name,
      schedule,
      running: job.running || false
    }));
  }
}

export default new CronJobService();
