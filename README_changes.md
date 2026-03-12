## Estado del Proyecto UNMI (Última actualización: Integración Técnica Telnyx & Ngrok)

### Contexto General Analizado:
- **Arquitectura**: Monorepositorio (Frontend en React/Vite + Backend en Node/Express).
- **Base de datos**: Supabase (PostgreSQL).
- **Despliegue**: Render.com (Backend y Frontend).
- **Proveedor de Telefonía**: **Telnyx** (V2 API).

### Avances Realizados Hoy (Integración Telnyx):

1. **Backend - Infraestructura de Voz**:
   - **Instalación del SDK**: Se ha añadido la dependencia oficial `telnyx` al backend.
   - **TelnyxService.ts**: Nuevo servicio creado para gestionar llamadas salientes, envío de SMS y consulta de recursos de la cuenta (aplicaciones y números).
   - **Webhook.routes.ts**: Implementación del endpoint `/api/webhooks/telnyx`. Configurados manejadores iniciales para eventos de llamada:
     - `call.initiated`: Detecta llamadas entrantes (con log visual gigante para pruebas).
     - `call.answered`: Punto de entrada para la respuesta automática (IVR).
     - `call.hangup`: Registro de finalización de llamadas.
     - `call.dtmf.received`: Preparado para capturar pulsaciones de teclas (Menú interactivo).

2. **Infraestructura de Desarrollo Local**:
   - **Ngrok**: Instalación y configuración de un túnel seguro hacia `http://localhost:5001`.
   - **URL del Túnel**: `https://wonderingly-overfoul-eli.ngrok-free.dev` (Vinculada en el panel de Telnyx).
   - **Seguridad**: Se ha verificado el AuthToken de ngrok para garantizar la estabilidad del túnel.

3. **Configuración de la Plataforma Telnyx**:
   - **Cuenta**: Creada y configurada con API Key (V2).
   - **Número de Teléfono**: Adquisición de un número de prueba de EE.UU. (+1 201 377 3769).
   - **Voice Application**: Creada la aplicación `UNMI_Local` en el portal de Telnyx, vinculada al número y configurada con el Webhook de ngrok.

4. **Validación y Testing**:
   - **test-telnyx-config.ts**: Script de prueba creado y ejecutado con éxito. Confirma que la API Key es válida y que el backend puede listar las aplicaciones y números de la cuenta de Telnyx en tiempo real.

5. **Mantenimiento y Git**:
   - **Fix Gitignore**: Se ha corregido un error de codificación en el archivo `.gitignore` que impedía ignorar el archivo `.env.local`.
   - **Limpieza de Caché**: Se ha eliminado el rastreo de archivos sensibles mediante `git rm --cached`.
   - **Push Seguro**: Código sincronizado en GitHub (Rama `develop-collab`) sin filtrar credenciales.

### Notas de Implementación Actual:
- **Ngrok**: Es necesario mantener abierta la terminal de ngrok y actualizar la "Webhook URL" en el panel de Telnyx si la dirección del túnel cambia en futuras sesiones.
- **API Key**: Almacenada de forma segura en la raíz del proyecto (`.env.local`).

### Próximos pasos pendientes:
- Implementar la lógica de respuesta de voz (IVR) usando Call Control (Text-to-Speech o archivos de audio).
- Configurar el flujo de desvío de llamadas dinámico.
- Iniciar el proceso de verificación eKYC en Telnyx para adquirir números de España (+34).
