import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function checkOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado a MongoDB\n');

    const users = await User.find().select('name email role');
    const projects = await Project.find({ archived: false }).populate('owner', 'name email');

    console.log('=== USUARIOS ===');
    users.forEach(u => console.log(`  ${u.name} (${u.email}) - ${u.role}`));

    console.log('\n=== PROYECTOS Y OWNERS ===');
    projects.forEach(p => console.log(`  ${p.name} - Owner: ${p.owner.name} (${p.owner.email})`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkOwners();
