import mongoose from 'mongoose';
import Project from '../models/Project.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/proyecto_nexus');
    console.log('✓ Conectado a MongoDB');

    const projects = await Project.find({}).lean();
    
    console.log('\n=== PROYECTOS EN BASE DE DATOS ===\n');
    projects.forEach(p => {
      console.log(`📁 ${p.name}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Archivado: ${p.archived ? '✓ SÍ' : '✗ NO'}`);
      console.log('');
    });
    
    console.log(`Total: ${projects.length} proyectos`);
    console.log(`Activos: ${projects.filter(p => !p.archived).length}`);
    console.log(`Archivados: ${projects.filter(p => p.archived).length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkProjects();
