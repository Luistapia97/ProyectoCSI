# 🖼️ Configuración de Cloudinary para Imágenes de Perfil

## ⚠️ Problema
En Render (hosting gratuito), los archivos subidos se **borran cuando el servidor se reinicia** porque usa almacenamiento efímero. Cloudinary soluciona esto guardando las imágenes en la nube permanentemente.

## 📋 Pasos para Configurar Cloudinary

### 1. Crear Cuenta en Cloudinary (Gratis)

1. Ve a [https://cloudinary.com](https://cloudinary.com)
2. Haz clic en "Sign Up Free"
3. Regístrate con tu email
4. Confirma tu cuenta

### 2. Obtener Credenciales

Una vez dentro de tu Dashboard de Cloudinary:

1. En la página principal verás un panel "Product Environment Credentials"
2. Copia estos 3 valores:
   - **Cloud Name**: `tu_cloud_name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz`

### 3. Configurar Variables de Entorno

#### 🔧 Desarrollo Local (archivo `.env`)

Edita el archivo `backend/.env` y reemplaza:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
```

#### ☁️ Producción (Render)

1. Ve a tu Dashboard de Render
2. Selecciona tu servicio backend
3. Ve a "Environment" en el menú lateral
4. Agrega estas 3 variables:
   - `CLOUDINARY_CLOUD_NAME` = tu_cloud_name
   - `CLOUDINARY_API_KEY` = tu_api_key
   - `CLOUDINARY_API_SECRET` = tu_api_secret
5. Haz clic en "Save Changes"
6. Render reiniciará automáticamente el servicio

### 4. Verificar Configuración

Cuando inicies el servidor, deberías ver:

```
✓ Cloudinary configurado correctamente
   Cloud Name: tu_cloud_name
```

Si ves:
```
⚠ Cloudinary NO configurado - Las imágenes se guardarán localmente
```
Significa que falta alguna variable de entorno.

## ✨ Beneficios de Cloudinary

- ✅ **Persistencia**: Las imágenes nunca se borran
- ✅ **CDN Global**: Carga rápida desde cualquier parte del mundo
- ✅ **Optimización**: Comprime automáticamente las imágenes
- ✅ **Transformaciones**: Redimensiona a 500x500px con enfoque en rostro
- ✅ **Plan Gratuito**: 25GB de almacenamiento y 25GB de ancho de banda/mes

## 🔄 Migración Automática

El código está preparado para funcionar en **modo híbrido**:

- **Si Cloudinary está configurado**: Usa Cloudinary (recomendado para producción)
- **Si NO está configurado**: Usa almacenamiento local (solo para desarrollo)

No necesitas modificar nada en el frontend, todo funciona transparente.

## 🧪 Probar que Funciona

1. Sube una imagen de perfil
2. Ve a Cloudinary → Media Library
3. Deberías ver tu imagen en la carpeta `avatars`
4. La URL del avatar ahora será algo como:
   ```
   https://res.cloudinary.com/tu_cloud_name/image/upload/v1234567890/avatars/avatar-userId-timestamp.jpg
   ```

## 📊 Límites del Plan Gratuito

- **Almacenamiento**: 25 GB
- **Transformaciones**: 25 créditos/mes
- **Ancho de banda**: 25 GB/mes
- **Imágenes**: Ilimitadas

Más que suficiente para un proyecto de este tamaño.

## 🛠️ Comandos de Instalación

El paquete ya está instalado. Si necesitas reinstalarlo:

```bash
cd backend
npm install cloudinary
```

## 📝 Notas Importantes

- **Sin Cloudinary**: Las imágenes se guardan en `backend/uploads/avatars/` (se borran en Render)
- **Con Cloudinary**: Las imágenes se guardan en la nube (permanentes)
- **Iniciales**: La opción de usar iniciales sigue funcionando con `ui-avatars.com`
- **Retrocompatibilidad**: Usuarios existentes con avatares locales seguirán funcionando

## 🔒 Seguridad

- ✅ Las credenciales están en `.env` (no en el código)
- ✅ `.env` está en `.gitignore` (no se sube a GitHub)
- ✅ En Render, las variables de entorno están cifradas
- ✅ Solo el backend tiene acceso a las credenciales

---

**¿Tienes dudas?** Revisa la documentación oficial: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
