## Estado del Proyecto UNMI (Última actualización: Diseño de Landing Page & Telnyx)

### Contexto General Analizado:
- **Arquitectura**: Monorepositorio (Frontend en React/Vite + Backend en Node/Express).
- **Base de datos**: Supabase (PostgreSQL).
- **Despliegue**: Render.com (Backend y Frontend).
- **Proveedor de Telefonía**: **Telnyx** (V2 API).

### Avances Realizados (Frontend - Landing Page):

1. **Efectos Visuales Premium**:
   - **Meteors**: Se implementó un componente de fondo animado con meteoritos que cubre toda la Landing Page, dando un aspecto dinámico y moderno.
   - **Spotlight (GlowCard)**: Se creó un componente interactivo que genera un haz de luz siguiendo el cursor del usuario. Se ha aplicado a todas las tarjetas de la página (Cómo funciona, Características, Precios, FAQ, Cierre).

2. **Navegación e Interfaz**:
   - **Navbar Interactivo**: Los enlaces se transformaron en botones estilo "pastilla" con efectos hover. Se implementó el "Smooth Scroll" (`scrollToSection`) para navegar suavemente por la misma página sin recargar.
   - **Dark Mode**: Se arregló la lógica del hook `useTheme.tsx` para aplicar correctamente la clase `dark` al DOM y guardar la preferencia en `localStorage`, resolviendo problemas de renderizado de React.

3. **Nuevas Secciones Estructuradas**:
   - **Cómo Funciona**: Diseño visual en 3 pasos mediante tarjetas `GlowCard` translúcidas.
   - **FAQ (Preguntas Frecuentes)**: Integración del componente `Accordion` dentro de una tarjeta destacada.
   - **Cierre (CTA)**: Tarjeta final de gran formato invitando al registro.
   - **Unificación de Badges**: Se estandarizó el diseño rojo con hover para las etiquetas de cada sección (Características, Precios, etc.).

4. **Diseño Responsivo (Móvil)**:
   - Ajuste drástico de fuentes (`h1`, `h2`, `h3`) para que no se desborden en pantallas estrechas.
   - Incremento de márgenes de seguridad (`px-4` a `px-6`).
   - Reducción del padding interno de las tarjetas y redimensionamiento de iconos en la vista móvil.

### Avances Previos (Integración Telnyx):

1. **Backend - Infraestructura de Voz**:
   - Instalación del SDK `telnyx`.
   - Creado `TelnyxService.ts` y webhook `/api/webhooks/telnyx` para capturar eventos de llamadas (`call.initiated`, `call.answered`, etc.).
   - Entorno Ngrok configurado y número de teléfono de prueba adquirido. Script de test superado.

### Próximos pasos pendientes para la siguiente sesión:

**Opciones de Frontend**:
- Continuar refinando otras páginas del frontend si fuera necesario (Panel de control, Auth, etc.).

**Opciones de Backend (Telefonía)**:
- Retomar la implementación de la lógica de respuesta de voz (IVR) usando Call Control de Telnyx (Text-to-Speech o archivos de audio).
- Configurar el flujo de desvío de llamadas dinámico (simular la llamada perdida).
- Iniciar el proceso de verificación eKYC en Telnyx para adquirir números de España (+34).
