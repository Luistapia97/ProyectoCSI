# 🎨 Guía Visual de Nexus

## Pantallas Principales

### 1. 🔐 Autenticación

#### Login
```
┌─────────────────────────────────────┐
│         🚀 Nexus                    │
│                                     │
│   Bienvenido de nuevo              │
│                                     │
│   ┌─────────────────────────┐     │
│   │ Email                   │     │
│   └─────────────────────────┘     │
│                                     │
│   ┌─────────────────────────┐     │
│   │ Contraseña              │     │
│   └─────────────────────────┘     │
│                                     │
│   [  Iniciar sesión  ]            │
│                                     │
│   ───────── o ─────────            │
│                                     │
│   [🔵 Continuar con Google]       │
│                                     │
│   ¿No tienes cuenta? Regístrate   │
└─────────────────────────────────────┘
```

### 2. 📊 Dashboard

```
┌──────────────────────────────────────────────────────────┐
│ 🚀 Nexus    [🌙] [@Usuario]  [Salir]                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Bienvenido, Usuario 👋         [+ Nuevo Proyecto]      │
│  Gestiona tus proyectos de manera simple y efectiva      │
│                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Proyecto 1  │ │ Proyecto 2  │ │ Proyecto 3  │      │
│  │ 🔴          │ │ 🔵          │ │ 🟢          │      │
│  │             │ │             │ │             │      │
│  │ Descripción │ │ Descripción │ │ Descripción │      │
│  │             │ │             │ │             │      │
│  │ #tag1 #tag2 │ │ #tag1       │ │ #tag1 #tag2 │      │
│  │             │ │             │ │             │      │
│  │ 10  5  50%  │ │ 8   4  50%  │ │ 15  12 80%  │      │
│  │ ██████░░░░  │ │ █████░░░░░  │ │ ████████░░  │      │
│  │             │ │             │ │             │      │
│  │ 👤👤👤      │ │ 👤👤        │ │ 👤👤👤👤    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 3. 📋 Board Kanban

```
┌────────────────────────────────────────────────────────────────────┐
│ [←] 🔴 Proyecto Web                    👤👤👤  [⚙️]               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│  │Pendiente │     │En Progreso│     │Completado│                 │
│  │    🔵 5  │     │    🔴 3   │     │    🟢 8  │                 │
│  │    [+]   │     │    [+]    │     │    [+]   │                 │
│  ├──────────┤     ├──────────┤     ├──────────┤                 │
│  │          │     │          │     │          │                 │
│  │┌────────┐│     │┌────────┐│     │┌────────┐│                 │
│  ││Tarea 1 ││     ││Tarea 4 ││     ││Tarea 7 ││                 │
│  ││🔴      ││     ││🟡      ││     ││🟢 ✓    ││                 │
│  ││        ││     ││        ││     ││        ││                 │
│  ││Desc... ││     ││Desc... ││     ││Desc... ││                 │
│  ││        ││     ││        ││     ││        ││                 │
│  ││#tag1   ││     ││#tag1   ││     ││#tag1   ││                 │
│  ││        ││     ││        ││     ││        ││                 │
│  ││📅 15 Nov│     ││📅 14 Nov│     ││📅 10 Nov│                 │
│  ││☑ 2/3   ││     ││☑ 1/2   ││     ││        ││                 │
│  ││👤👤    ││     ││👤      ││     ││👤      ││                 │
│  │└────────┘│     │└────────┘│     │└────────┘│                 │
│  │          │     │          │     │          │                 │
│  │┌────────┐│     │┌────────┐│     │┌────────┐│                 │
│  ││Tarea 2 ││     ││Tarea 5 ││     ││Tarea 8 ││                 │
│  ││🟡      ││     ││🔴      ││     ││🟢 ✓    ││                 │
│  │└────────┘│     │└────────┘│     │└────────┘│                 │
│  │          │     │          │     │          │                 │
│  └──────────┘     └──────────┘     └──────────┘                 │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 4. 📝 Modal de Tarea Detallada

```
┌────────────────────────────────────────────────┐
│  Crear Landing Page                      [X]   │
├──────────────────────────┬─────────────────────┤
│                          │                     │
│  📄 Descripción          │  Detalles          │
│  Diseñar la página...    │                     │
│                          │  🚩 Prioridad      │
│  ☑ Subtareas (1/3)       │  [Alta]            │
│  ☑ Wireframe             │                     │
│  ☐ Diseño UI             │  📅 Fecha límite   │
│  ☐ Implementar           │  15 Nov 2024       │
│                          │                     │
│  💬 Comentarios (3)      │  🏷️ Etiquetas      │
│  ┌────────────────┐      │  #diseño #urgente  │
│  │ 👤 Usuario 1   │      │                     │
│  │ Buen trabajo!  │      │  ───────────────   │
│  │ 14:30          │      │                     │
│  └────────────────┘      │  [✓ Completar]    │
│  ┌────────────────┐      │                     │
│  │ 👤 Usuario 2   │      │  [ Editar Tarea ] │
│  │ Gracias!       │      │                     │
│  │ 14:32          │      │  [ 🗑️ Eliminar ]  │
│  └────────────────┘      │                     │
│                          │                     │
│  [Escribe comentario...] │                     │
│  [Enviar]               │                     │
└──────────────────────────┴─────────────────────┘
```

## Paleta de Colores

### Modo Claro
```
Fondo Principal:    #f8fafc  ░░░░░░░░
Fondo Secundario:   #ffffff  ▓▓▓▓▓▓▓▓
Texto Principal:    #1e293b  ████████
Texto Secundario:   #64748b  ▓▓▓▓▓▓▓▓
Borde:              #e2e8f0  ░░░░░░░░
Acento:             #6366f1  ████████ (Índigo)
```

### Modo Oscuro
```
Fondo Principal:    #0f172a  ████████
Fondo Secundario:   #1e293b  ▓▓▓▓▓▓▓▓
Texto Principal:    #f1f5f9  ░░░░░░░░
Texto Secundario:   #94a3b8  ░░░░░░░░
Borde:              #334155  ▓▓▓▓▓▓▓▓
Acento:             #6366f1  ████████ (Índigo)
```

## Iconografía

```
📊 Dashboard       TrendingUp
🔐 Login           LogIn
👤 Usuario         User
📁 Proyectos       Folder
➕ Agregar         Plus
✏️ Editar          Edit
🗑️ Eliminar        Trash2
⚙️ Configuración   Settings
📅 Calendario      Calendar
🚩 Prioridad       Flag
🏷️ Etiqueta        Tag
☑️ Subtareas       CheckSquare
💬 Comentarios     MessageCircle
🔔 Notificación    Bell
← Regresar         ArrowLeft
🌙 Modo Oscuro     Moon
☀️ Modo Claro      Sun
↩️ Salir           LogOut
✓ Completado       Check
⚠️ Advertencia     AlertCircle
```

## Estados Visuales

### Prioridades
```
🟢 Baja       Verde   (#10b981)
🟡 Media      Amarillo (#f59e0b)
🟠 Alta       Naranja  (#ef4444)
🔴 Urgente    Rojo     (#dc2626)
```

### Estados de Tarea
```
📝 Pendiente      Sin color especial
⚡ En Progreso    Azul
✅ Completado     Verde con check
⏰ Vencida        Rojo con alerta
```

## Animaciones

### Microinteracciones
```
Hover en botones:      translateY(2px) + sombra
Click en tarjeta:      Scale(0.98)
Drag tarea:            Opacidad 0.5
Drop zona:             Borde punteado azul
Modal abrir:           slideUp + fadeIn
Modal cerrar:          fadeOut
Loading:               Spinner rotación
Crear elemento:        fadeIn + slideUp
Eliminar elemento:     fadeOut + slideOut
```

## Responsive Breakpoints

```
Mobile:     < 640px   (1 columna)
Tablet:     6401024px (2 columnas)
Desktop:    > 1024px   (3+ columnas)
```

## Flujo de Navegación

```
┌─────────┐
│  Login  │
└────┬────┘
     │
     ↓
┌─────────────┐
│  Dashboard  │←────────────┐
└──────┬──────┘             │
       │                    │
       ↓                    │
┌─────────────┐             │
│   Board     │─────────────┘
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Task Modal  │
└─────────────┘
```

## Principios de Diseño

1. **Menos es Más**  Solo lo esencial
2. **Feedback Inmediato**  Cada acción tiene respuesta
3. **Jerarquía Visual**  Tamaños y colores claros
4. **Consistencia**  Mismo estilo en toda la app
5. **Accesibilidad**  Contraste y tamaños legibles
6. **Performance**  Animaciones de 60fps
7. **Responsivo**  Funciona en todos los dispositivos



**Diseño pensado para la productividad y la simplicidad** 🎨✨

