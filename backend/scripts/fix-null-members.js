// Script para limpiar members con user null en proyectos
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Project = mongoose.model('Project', new mongoose.Schema({
  name: String,
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String
  }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { strict: false }));

async function fixNullMembers() {
  try {
    console.log('🔍 Buscando proyectos con members.user = null...');
    
    const projects = await Project.find({ 'members.user': null });
    
    console.log(`📊 Encontrados ${projects.length} proyectos con members null`);
    
    for (const project of projects) {
      console.log(`\n🔧 Limpiando proyecto: ${project.name} (${project._id})`);
      console.log(`   Members antes: ${project.members.length}`);
      
      // Filtrar members con user null
      const cleanMembers = project.members.filter(m => m.user != null);
      
      console.log(`   Members después: ${cleanMembers.length}`);
      console.log(`   Eliminados: ${project.members.length - cleanMembers.length}`);
      
      // Actualizar proyecto
      await Project.findByIdAndUpdate(project._id, {
        $set: { members: cleanMembers }
      });
      
      console.log(`   ✅ Proyecto actualizado`);
    }
    
    console.log('\n✅ Limpieza completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixNullMembers();
