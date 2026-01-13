import mongoose from 'mongoose';
import Project from '../models/Project.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function deleteTestProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/proyecto_nexus');
    console.log('✓ Conectado a MongoDB');

    const projectsToDelete = [
      'Diseño Página Web',
      'Rediseño web',
      'Página Web', 
      'Desarrollo app',
      'rediseño web',
      'pagina web',
      'desarrollo app'
    ];

    console.log('\n🗑️  Eliminando proyectos de prueba...\n');

    const result = await Project.deleteMany({ 
      name: { $in: projectsToDelete } 
    });

    console.log(`✓ ${result.deletedCount} proyectos eliminados`);

    // Mostrar proyectos restantes
    const remaining = await Project.find({}).lean();
    console.log(`\n📊 Proyectos restantes: ${remaining.length}`);
    remaining.forEach(p => console.log(`  - ${p.name}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

deleteTestProjects();
