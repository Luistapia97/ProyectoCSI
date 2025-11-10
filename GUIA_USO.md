# 📖 Guía de Uso - Nexus

## 🚀 Primeros Pasos

### 1. Crear tu Cuenta

**Opción 1: Email y Contraseña**
1. Ve a http://localhost:5173/register
2. Ingresa:
   - Nombre completo
   - Email
   - Contraseña (mínimo 6 caracteres)
3. Click en "Crear cuenta"
4. Serás redirigido automáticamente al Dashboard

**Opción 2: Google**
1. Click en "Continuar con Google"
2. Selecciona tu cuenta Google
3. Autoriza la aplicación
4. Serás redirigido al Dashboard

### 2. Iniciar Sesión

1. Ve a http://localhost:5173/login
2. Ingresa tu email y contraseña
3. Click en "Iniciar sesión"
4. O usa "Continuar con Google"

## 📊 Dashboard

### Ver tus Proyectos

El Dashboard muestra todos tus proyectos en tarjetas con:
- 🎨 **Color** identificador
- 📝 **Nombre** y descripción
- 🏷️ **Etiquetas** (máximo 3 visibles)
- 📈 **Estadísticas**: Total tareas, Completadas, Progreso %
- 📊 **Barra de progreso** visual
- 👥 **Miembros** del proyecto (avatares)

### Crear un Nuevo Proyecto

1. Click en el botón **"+ Nuevo Proyecto"** (esquina superior derecha)
2. Completa el formulario:
   ```
   📝 Nombre: "Lanzamiento Web" (requerido)
   📄 Descripción: "Preparar el lanzamiento del nuevo sitio"
   🎨 Color: Elige uno de los 8 colores disponibles
   🏷️ Etiquetas: "urgente, marketing, frontend"
   ```
3. Click en **"Crear Proyecto"**
4. ¡Listo! Tu proyecto aparecerá en el Dashboard

### Acceder a un Proyecto

- **Click** en cualquier tarjeta de proyecto
- Serás llevado al tablero Kanban del proyecto

## 📋 Tablero Kanban

### Estructura del Tablero

Por defecto, cada proyecto tiene 3 columnas:
1. **Pendiente** 🔵 - Tareas por hacer
2. **En Progreso** 🟡 - Tareas activas
3. **Completado** 🟢 - Tareas terminadas

### Crear una Tarea

1. Click en el botón **"+"** en la columna deseada
2. Completa el formulario:
   ```
   📝 Título: "Diseñar landing page" (requerido)
   📄 Descripción: "Crear diseño responsive..."
   🚩 Prioridad: Baja | Media | Alta | Urgente
   📅 Fecha límite: Selecciona una fecha
   🏷️ Etiquetas: "diseño, urgente"
   ```
3. Click en **"Crear Tarea"**
4. La tarea aparecerá en la columna seleccionada

### Mover Tareas (Drag & Drop)

**Método 1: Arrastrar**
1. Click y mantén presionado sobre una tarjeta
2. Arrastra hacia otra columna
3. Suelta la tarjeta
4. ¡La tarea cambia de columna automáticamente!

**Método 2: Dentro de la misma columna**
- Arrastra hacia arriba o abajo para reordenar
- La posición se guarda automáticamente

### Ver Detalles de una Tarea

1. **Click** en cualquier tarjeta de tarea
2. Se abre un modal con dos secciones:

**Sección Principal (Izquierda):**
- 📝 Descripción completa
- ☑️ Subtareas con checkboxes
- 💬 Comentarios tipo chat

**Sección Lateral (Derecha):**
- ✓ Botón "Completar/Marcar pendiente"
- 🚩 Prioridad
- 📅 Fecha límite
- 🏷️ Etiquetas
- ✏️ Botón "Editar"
- 🗑️ Botón "Eliminar"

## ✅ Gestión de Tareas

### Editar una Tarea

1. Abre la tarea (click en la tarjeta)
2. Click en **"Editar tarea"** (sidebar derecho)
3. Modifica los campos que necesites:
   - Título
   - Descripción
   - Prioridad
   - Fecha límite
4. Click en **"Guardar cambios"**

### Agregar Subtareas

1. Abre la tarea
2. En la sección "Subtareas":
   ```
   📝 [Escribe subtarea aquí]  [+]
   ```
3. Escribe el nombre de la subtarea
4. Presiona **Enter** o click en **"+"**
5. La subtarea aparece con un checkbox

### Marcar Subtareas

- **Click** en el checkbox junto a cada subtarea
- Se marca como completada (tachado)
- El contador se actualiza automáticamente

### Completar una Tarea

**Opción 1: Desde el modal**
1. Abre la tarea
2. Click en **"Marcar como completada"** (botón verde)
3. La tarea se marca como completada

**Opción 2: Desde el tablero**
1. Arrastra la tarea a la columna "Completado"
2. Se marca automáticamente

### Eliminar una Tarea

1. Abre la tarea
2. Click en **"Eliminar tarea"** (botón rojo)
3. Confirma la eliminación
4. La tarea se archiva (no se elimina permanentemente)

## 💬 Comentarios

### Agregar un Comentario

1. Abre la tarea
2. Scroll hasta la sección "Comentarios"
3. Escribe tu comentario en el campo de texto
4. Click en **"Enviar"** (icono ✉️)
5. El comentario aparece instantáneamente

### Características de Comentarios

- ⚡ **Tiempo Real** - Los comentarios aparecen al instante
- 👤 **Avatar** - Identifica quién comentó
- 🕐 **Timestamp** - Hora y fecha del comentario
- 💬 **Chat Style** - Diseño tipo mensajería

## 👥 Colaboración

### Agregar Miembros (Próximamente)

La funcionalidad está en el código backend, para activarla:

1. En el Board, click en ⚙️ (configuración)
2. Sección "Miembros"
3. Ingresa el email del usuario
4. Selecciona el rol:
   - **Owner** - Control total
   - **Admin** - Gestión completa
   - **Member** - Editar y comentar
   - **Guest** - Solo ver y comentar
5. Click en "Agregar"

### Asignar Tareas a Usuarios

1. Abre la tarea
2. En modo edición, busca "Asignar a"
3. Selecciona los usuarios
4. Guardar cambios
5. Los avatares aparecen en la tarjeta

## 🎨 Personalización

### Cambiar Tema (Claro/Oscuro)

1. En el Dashboard, busca el icono 🌙/☀️
2. Click para alternar entre temas
3. El tema se guarda automáticamente

### Colores de Proyectos

Al crear o editar un proyecto:
- Elige entre 8 colores predefinidos
- El color aparece como indicador en el Dashboard y Board

### Etiquetas Personalizadas

- Usa etiquetas para categorizar proyectos y tareas
- Formato: palabras separadas por comas
- Ejemplos: "urgente, marketing, diseño"

## 🔍 Tips y Trucos

### Productividad

1. **Prioridades**: Usa los colores para identificar rápidamente:
   - 🟢 Baja - Puede esperar
   - 🟡 Media - Normal
   - 🟠 Alta - Importante
   - 🔴 Urgente - ¡Hazlo ya!

2. **Subtareas**: Divide tareas grandes en pasos pequeños
   - ☑️ Más fácil de seguir
   - ☑️ Sensación de progreso
   - ☑️ Menos abrumador

3. **Fechas Límite**: Establece fechas realistas
   - 📅 Tareas vencidas se marcan en rojo
   - ⏰ Planifica con anticipación

4. **Comentarios**: Usa para:
   - 💭 Aclaraciones
   - 📎 Enlaces y recursos
   - 👍 Feedback
   - 📝 Notas importantes

### Organización

1. **Columnas Claras**: Mantén un flujo lógico
   ```
   Pendiente → En Progreso → Completado
   ```

2. **Un Proyecto = Un Objetivo**: 
   - No mezcles temas no relacionados
   - Crea proyectos separados

3. **Revisa Regularmente**:
   - Actualiza el progreso diariamente
   - Mueve tareas completadas
   - Limpia tareas viejas

4. **Etiquetas Consistentes**:
   - Usa las mismas etiquetas en proyectos relacionados
   - Ejemplos: #frontend, #backend, #diseño, #urgente

## ⌨️ Atajos (Próximamente)

Atajos de teclado planeados:
- `N` - Nueva tarea
- `P` - Nuevo proyecto
- `Esc` - Cerrar modal
- `/` - Buscar
- `C` - Comentar

## 🐛 Solución de Problemas

### Las tareas no se mueven

1. Refresca la página (F5)
2. Verifica tu conexión a internet
3. Revisa que el backend esté corriendo

### No puedo ver mis cambios

1. Verifica que Socket.IO esté conectado
2. Mira la consola del navegador (F12)
3. Refresca la página

### Error al crear proyecto/tarea

1. Verifica que todos los campos requeridos estén llenos
2. Revisa la conexión al backend
3. Mira los mensajes de error en pantalla

### No recibo notificaciones

1. Las notificaciones están en desarrollo
2. Por ahora, usa la vista de tablero
3. Los cambios se reflejan en tiempo real

## 📱 Uso Móvil

### Responsive Design

Nexus funciona en móviles:
- 📱 Tarjetas apiladas verticalmente
- 👆 Scroll horizontal para columnas
- 🤏 Touch para drag & drop
- 📐 Interfaz adaptada

### Recomendaciones Móviles

1. Usa modo horizontal para mejor vista del Board
2. Los modales ocupan pantalla completa
3. El menú de usuario se simplifica

## 🎯 Casos de Uso

### Desarrollo de Software

```
Proyecto: "App Mobile v2.0"
Columnas: Backlog | En Desarrollo | Testing | Completado
Etiquetas: #frontend, #backend, #bug, #feature
```

### Marketing

```
Proyecto: "Campaña Q4"
Columnas: Ideas | En Producción | Publicado
Etiquetas: #redes, #email, #contenido
```

### Diseño

```
Proyecto: "Rediseño Web"
Columnas: Investigación | Diseño | Revisión | Aprobado
Etiquetas: #ui, #ux, #branding
```

### Personal

```
Proyecto: "Aprender React"
Columnas: Por Aprender | Estudiando | Dominado
Etiquetas: #tutorial, #proyecto, #revisión
```

## 📞 Ayuda Adicional

- 📖 Lee el [README.md](README.md) para detalles técnicos
- 🚀 Consulta [INICIO_RAPIDO.md](INICIO_RAPIDO.md) para instalación
- 🎨 Revisa [GUIA_VISUAL.md](GUIA_VISUAL.md) para el diseño

---

**¡Disfruta gestionando tus proyectos con Nexus!** 🚀✨
