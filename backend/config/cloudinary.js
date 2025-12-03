import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verificar configuración
const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isConfigured()) {
  console.log('✓ Cloudinary configurado correctamente');
  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  console.warn('⚠ Cloudinary NO configurado - Las imágenes se guardarán localmente (no recomendado para producción)');
}

export { cloudinary, isConfigured };
