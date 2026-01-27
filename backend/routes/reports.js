import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import reportService from '../services/reportService.js';
import emailService from '../services/emailService.js';
import cronJobService from '../services/cronJobs.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @route   GET /api/reports/generate
 * @desc    Genera un reporte PDF manualmente
 * @access  Private/Admin
 */
router.get('/generate', protect, admin, async (req, res) => {
  try {
    console.log('📊 Solicitud de generación de reporte...');
    
    // Aumentar timeout a 2 minutos para generación de reportes grandes
    req.setTimeout(120000);
    res.setTimeout(120000);
    
    const result = await reportService.generateWeeklyReport();
    
    console.log('✅ Reporte generado, enviando respuesta...');
    
    res.json({
      success: true,
      message: 'Reporte generado exitosamente',
      filename: result.filename,
      filepath: result.filepath,
      generatedAt: result.reportData.generatedAt,
      summary: {
        totalProjects: result.reportData.globalMetrics.totalProjects,
        totalUsers: result.reportData.globalMetrics.totalUsers,
        completionRate: result.reportData.globalMetrics.globalCompletionRate
      }
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando el reporte',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/reports/download/:filename
 * @desc    Descarga un reporte específico
 * @access  Private/Admin
 */
router.get('/download/:filename', protect, admin, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validar que el archivo solo contenga caracteres válidos (seguridad)
    if (!/^reporte-semanal-[\w-]+\.pdf$/.test(filename)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo inválido'
      });
    }

    const reportsDir = path.join(__dirname, '..', 'reports');
    const filepath = path.join(reportsDir, filename);

    // Verificar que el archivo exista
    try {
      await fs.access(filepath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Leer el archivo y enviarlo con headers correctos
    const fileBuffer = await fs.readFile(filepath);
    
    // 🆕 Headers anti-caché para asegurar descarga del archivo más reciente
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Last-Modified', new Date().toUTCString());
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error en descarga de reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error descargando el reporte',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/reports/email
 * @desc    Envía el último reporte por correo a destinatarios específicos
 * @access  Private/Admin
 */
router.post('/email', protect, admin, async (req, res) => {
  try {
    const { recipients } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un destinatario'
      });
    }

    // Generar el reporte
    const { filepath, reportData } = await reportService.generateWeeklyReport();

    // Enviar a cada destinatario
    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await emailService.sendWeeklyReport(filepath, reportData, recipient);
        results.push({
          recipient,
          success: true,
          messageId: result.messageId
        });
      } catch (error) {
        results.push({
          recipient,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: successCount > 0,
      message: `Reporte enviado a ${successCount} de ${recipients.length} destinatarios`,
      results
    });
  } catch (error) {
    console.error('Error enviando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando el reporte',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/reports/history
 * @desc    Lista todos los reportes generados
 * @access  Private/Admin
 */
router.get('/history', protect, admin, async (req, res) => {
  try {
    const reportsDir = path.join(__dirname, '..', 'reports');
    
    // Crear directorio si no existe
    try {
      await fs.access(reportsDir);
    } catch (error) {
      await fs.mkdir(reportsDir, { recursive: true });
      return res.json({ success: true, reports: [] });
    }

    // Leer archivos del directorio
    const files = await fs.readdir(reportsDir);
    
    // Filtrar solo archivos PDF y obtener información
    const reports = await Promise.all(
      files
        .filter(file => file.endsWith('.pdf'))
        .map(async (file) => {
          const filepath = path.join(reportsDir, file);
          const stats = await fs.stat(filepath);
          
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        })
    );

    // Ordenar por fecha de creación (más reciente primero)
    reports.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de reportes',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/reports/trigger
 * @desc    Ejecuta manualmente el envío automático del reporte
 * @access  Private/Admin
 */
router.post('/trigger', protect, admin, async (req, res) => {
  try {
    console.log('🚀 Iniciando ejecución manual del reporte semanal...');
    
    // Ejecutar el proceso de reporte semanal
    await cronJobService.triggerWeeklyReport();

    const recipients = cronJobService.getReportRecipients();
    
    res.json({
      success: true,
      message: `Reporte generado y enviado exitosamente a ${recipients.length} destinatario(s)`,
      recipients: recipients
    });
  } catch (error) {
    console.error('❌ Error ejecutando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando el reporte: ' + error.message,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/reports/cron-status
 * @desc    Obtiene el estado de los trabajos programados
 * @access  Private/Admin
 */
router.get('/cron-status', protect, admin, async (req, res) => {
  try {
    const status = cronJobService.getJobsStatus();
    
    res.json({
      success: true,
      jobs: status,
      recipients: cronJobService.getReportRecipients()
    });
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado de tareas programadas',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/reports/verify-email
 * @desc    Verifica la configuración del correo enviando un email de prueba
 * @access  Private/Admin
 */
router.post('/verify-email', protect, admin, async (req, res) => {
  try {
    console.log('📧 Verificando configuración SMTP...');
    
    // Primero verificar la conexión
    const isValid = await emailService.verifyConnection();
    
    if (!isValid) {
      return res.status(500).json({
        success: false,
        message: 'No se pudo conectar al servidor SMTP. Verifica las credenciales.'
      });
    }
    
    // Si la conexión es válida, enviar correo de prueba
    console.log('📧 Enviando correo de prueba...');
    await emailService.sendTestEmail();
    
    res.json({
      success: true,
      message: `Correo de prueba enviado exitosamente a ${process.env.SMTP_USER}. Revisa tu bandeja de entrada.`
    });
  } catch (error) {
    console.error('❌ Error verificando correo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar correo de prueba: ' + error.message,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/reports/:filename
 * @desc    Elimina un reporte específico
 * @access  Private/Admin
 */
router.delete('/:filename', protect, admin, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validar nombre de archivo
    if (!/^reporte-semanal-[\w-]+\.pdf$/.test(filename)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo inválido'
      });
    }

    const reportsDir = path.join(__dirname, '..', 'reports');
    const filepath = path.join(reportsDir, filename);

    // Verificar que el archivo exista
    try {
      await fs.access(filepath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Eliminar el archivo
    await fs.unlink(filepath);

    res.json({
      success: true,
      message: 'Reporte eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando el reporte',
      error: error.message
    });
  }
});

export default router;
