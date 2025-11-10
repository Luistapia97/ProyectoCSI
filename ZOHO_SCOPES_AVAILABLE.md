# Scopes Disponibles en Zoho OAuth

## Zoho Mail Scopes
 `ZohoMail.messages.ALL`  Todos los permisos de mensajes
 `ZohoMail.messages.READ`  Leer mensajes
 `ZohoMail.messages.CREATE`  Crear/enviar mensajes
 `ZohoMail.folders.ALL`  Gestionar carpetas
 `ZohoMail.accounts.READ`  Leer información de cuentas

## Zoho Tasks Scopes (Standalone App)
 `ZohoTasks.tasks.ALL`  Todos los permisos de tareas
 `ZohoTasks.tasks.READ`  Leer tareas
 `ZohoTasks.tasks.CREATE`  Crear tareas
 `ZohoTasks.tasks.UPDATE`  Actualizar tareas
 `ZohoTasks.tasks.DELETE`  Eliminar tareas

## ⚠️ Problema con ZohoMail.tasks.ALL

El scope `ZohoMail.tasks.ALL` **NO EXISTE** en la documentación oficial de Zoho.

Las tareas en Zoho Mail no tienen una API pública documentada. Solo la aplicación Zoho Tasks standalone tiene API.

## ✅ Solución Alternativa

Ya que Zoho no proporciona una API pública confiable para Tasks, las mejores opciones son:

1. **Notificaciones Push Internas** (Socket.IO) ✅ Ya implementado
2. **Webhooks** para sistemas externos
3. **Integración con otras herramientas** (Slack, Discord, Microsoft Teams)
4. **Email con SMTP normal** (no Zoho)

## 🎯 Recomendación

**Desactivar la sincronización con Zoho Tasks** y usar solo las notificaciones internas del sistema que ya funcionan perfectamente.

