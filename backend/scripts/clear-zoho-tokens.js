import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB\n');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function clearZohoTokens() {
  try {
    const result = await User.updateMany(
      {},
      {
        $unset: {
          zohoAccessToken: '',
          zohoRefreshToken: ''
        }
      }
    );

    console.log('🗑️  Tokens de Zoho eliminados');
    console.log('   Usuarios actualizados:', result.modifiedCount);
    console.log('\n✅ Ahora puedes hacer login nuevamente con Zoho');
    console.log('   El sistema guardará el token con los scopes correctos');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

await clearZohoTokens();
