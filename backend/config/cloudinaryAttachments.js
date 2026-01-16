import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Usar memoria temporal para multer
const storage = multer.memoryStorage();

// Crear el middleware de upload para attachments
const uploadTaskAttachment = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

// Función para subir a Cloudinary desde buffer
export const uploadToCloudinary = (fileBuffer, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    // Determinar el tipo de recurso
    const isImage = mimeType.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    // Generar un nombre único
    const filename = `${Date.now()}-${originalName.replace(/\s+/g, '-')}`;

    // Opciones base para upload
    const uploadOptions = {
      folder: 'nexus/task-attachments',
      resource_type: resourceType,
      public_id: filename,
    };

    // Para PDFs, agregar tipo de acceso para visualización en navegador
    if (mimeType === 'application/pdf') {
      uploadOptions.type = 'upload';
      uploadOptions.access_mode = 'public';
    }

    // Crear stream desde el buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convertir buffer a stream y pipe a Cloudinary
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// Función para eliminar archivo de Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    // Intentar eliminar como imagen primero
    let result = await cloudinary.uploader.destroy(publicId);
    
    // Si no se encontró como imagen, intentar como raw
    if (result.result === 'not found') {
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }
    
    return result;
  } catch (error) {
    console.error('Error eliminando de Cloudinary:', error);
    throw error;
  }
};

export { cloudinary, uploadTaskAttachment };
export default uploadTaskAttachment;
