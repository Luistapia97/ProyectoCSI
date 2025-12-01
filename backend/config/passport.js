import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import User from '../models/User.js';
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET) {
  console.log('Configurando Zoho OAuth con OpenID Connect');
  console.log('   Scopes: openid, email, profile');
  
  passport.use('zoho', new OAuth2Strategy({
      authorizationURL: 'https://accounts.zoho.com/oauth/v2/auth',
      tokenURL: 'https://accounts.zoho.com/oauth/v2/token',
      clientID: process.env.ZOHO_CLIENT_ID,
      clientSecret: process.env.ZOHO_CLIENT_SECRET,
      callbackURL: process.env.ZOHO_REDIRECT_URI,
      // Scopes básicos para login con Zoho
      scope: [
        'openid', 
        'email', 
        'profile'
      ],
      passReqToCallback: true,
      state: true,
      // Parámetros adicionales para obtener refresh token
      customHeaders: {
        'access_type': 'offline'
      }
    },
    async (req, accessToken, refreshToken, params, profile, done) => {
      try {
        console.log('✓ OAuth callback recibido de Zoho');
        console.log('Access Token recibido');
        console.log('Refresh Token:', refreshToken ? 'Sí' : 'No');
        
        // Leer el tipo de registro desde la cookie
        const registerType = req.cookies?.register_type;
        const isAdminRegistration = registerType === 'admin';
        
        console.log('Register Type (cookie):', registerType);
        console.log('Registro de admin:', isAdminRegistration ? 'Sí' : 'No');
        
        let userEmail, userId, userName, userPicture;
        
        // PASO 1: Decodificar el id_token (JWT) - Contiene la información verificada del usuario
        if (params.id_token) {
          console.log('ID Token recibido, decodificando...');
          try {
            // Decodificar el JWT sin verificar (Zoho lo firma, pero para testing no verificamos)
            const decoded = jwt.decode(params.id_token);
            console.log('Información del ID Token:', JSON.stringify(decoded, null, 2));
            
            userEmail = decoded.email;
            userId = decoded.sub; // "sub" es el ID único del usuario en OpenID Connect
            userName = decoded.name || decoded.given_name;
            userPicture = decoded.picture;
            
            console.log('✓ Email obtenido del ID Token:', userEmail);
            console.log('✓ Nombre obtenido:', userName);
            console.log('✓ User ID (sub):', userId);
          } catch (decodeError) {
            console.log('Error al decodificar ID Token:', decodeError.message);
          }
        }
        
        // PASO 2: Si no hay id_token o no se pudo decodificar, usar userinfo endpoint
        if (!userEmail) {
          console.log('Intentando obtener info del usuario con userinfo endpoint...');
          try {
            const response = await axios.get('https://accounts.zoho.com/oauth/user/info', {
              headers: { 'Authorization': 'Bearer ' + accessToken }
            });
            
            console.log('✓ Respuesta de userinfo:', JSON.stringify(response.data, null, 2));
            
            userEmail = response.data.email || response.data.Email;
            userId = response.data.sub || response.data.ZUID;
            userName = response.data.name || response.data.Display_Name || response.data.given_name;
            userPicture = response.data.picture;
            
            console.log('✓ Email obtenido de userinfo:', userEmail);
          } catch (err) {
            console.log('Error en userinfo endpoint:', err.response?.status, err.response?.data || err.message);
          }
        }
        
        // PASO 3: Validar que tenemos email
        if (!userEmail) {
          console.error('✗ No se pudo obtener el email del usuario');
          return done(new Error('No se pudo obtener información del usuario de Zoho'), null);
        }
        
        console.log('\nInformación final del usuario:');
        console.log('   Email:', userEmail);
        console.log('   Nombre:', userName);
        console.log('   ID:', userId);
        
        // PASO 4: Buscar si el usuario ya existe por Zoho ID
        let user = await User.findOne({ zohoId: userId });
        
        if (user) {
          console.log('✓ Usuario existente encontrado por zohoId');
          user.zohoAccessToken = accessToken;
          user.zohoRefreshToken = refreshToken || user.zohoRefreshToken;
          
          // Si es registro de admin, actualizar rol
          if (isAdminRegistration && user.role !== 'administrador') {
            const adminCount = await User.countDocuments({ role: 'administrador' });
            if (adminCount >= 3) {
              console.log('Límite de administradores alcanzado (3/3)');
              return done(new Error('Ya existen 3 administradores. No se pueden registrar más.'), null);
            }
            user.role = 'administrador';
            console.log(`Actualizando rol a administrador (${adminCount + 1}/3)`);
          }
          
          await user.save();
          return done(null, user);
        }
        
        // PASO 5: Buscar si existe un usuario con ese email
        user = await User.findOne({ email: userEmail });
        
        if (user) {
          console.log('✓ Usuario existente encontrado por email, vinculando Zoho');
          user.zohoId = userId;
          user.zohoAccessToken = accessToken;
          user.zohoRefreshToken = refreshToken;
          user.authProvider = 'zoho';
          if (userPicture && !user.avatar) {
            user.avatar = userPicture;
          }
          
          // Si es registro de admin, actualizar rol
          if (isAdminRegistration && user.role !== 'administrador') {
            const adminCount = await User.countDocuments({ role: 'administrador' });
            if (adminCount >= 3) {
              console.log('Límite de administradores alcanzado (3/3)');
              return done(new Error('Ya existen 3 administradores. No se pueden registrar más.'), null);
            }
            user.role = 'administrador';
            console.log(`Actualizando rol a administrador (${adminCount + 1}/3)`);
          }
          await user.save();
          return done(null, user);
        }
        
        // PASO 6: Crear nuevo usuario
        console.log('Creando nuevo usuario con Zoho OAuth');
        
        // Determinar el rol basado en el state
        let userRole = 'usuario';
        let userStatus = 'pending'; // Por defecto pendiente para Zoho
        
        if (isAdminRegistration) {
          // Verificar límite de administradores
          const adminCount = await User.countDocuments({ role: 'administrador' });
          if (adminCount >= 3) {
            console.log('Límite de administradores alcanzado (3/3)');
            return done(new Error('Ya existen 3 administradores. No se pueden registrar más.'), null);
          }
          userRole = 'administrador';
          userStatus = 'approved'; // Admins se aprueban automáticamente
          console.log(`Registrando como administrador (${adminCount + 1}/3)`);
        } else {
          console.log('Usuario creado con estado PENDIENTE - requiere aprobación de administrador');
        }
        
        const newUser = await User.create({
          zohoId: userId,
          name: userName || userEmail.split('@')[0],
          email: userEmail,
          avatar: userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || userEmail)}`,
          role: userRole,
          status: userStatus,
          authProvider: 'zoho',
          zohoAccessToken: accessToken,
          zohoRefreshToken: refreshToken
        });
        
        console.log('✓ Nuevo usuario creado:', newUser.email, '- Estado:', userStatus);
        done(null, newUser);
        
      } catch (error) {
        console.error('✗ Error crítico en OAuth:', error.message);
        console.error('   Stack:', error.stack);
        done(error, null);
      }
    }
  ));
  
  console.log('✓ Zoho OAuth (OpenID Connect) configurado correctamente');
}

export default passport;
