# 🚀 UNMI SaaS Platform - Lean Refactored v2.0

> **Plataforma completa y profesional para gestión omnicanal de comunicaciones empresariales**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://semver.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Características Principales

- 🎯 **Gestión Omnicanal**: SMS, WhatsApp, llamadas VoIP, chatbots IA
- 🌍 **Multi-idioma**: Español, Inglés, Francés (i18n completo)
- 💳 **Pagos integrados**: Stripe con webhooks y suscripciones
- 📊 **Analytics en tiempo real**: Métricas de llamadas, mensajes y conversiones
- 🤖 **Chatbots IA**: Integración con GPT para atención automatizada
- 📱 **100% Responsive**: Mobile-first design
- 🔒 **Seguridad avanzada**: Autenticación JWT, validación Zod, Helmet
- ⚡ **Alto rendimiento**: Vite, code splitting, lazy loading

## 🏗️ Arquitectura

```
Lean Refactored/
├── frontend/              # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # 47+ componentes UI reutilizables
│   │   ├── pages/        # 10 páginas principales
│   │   ├── services/     # API clients
│   │   ├── hooks/        # Custom React hooks
│   │   ├── contexts/     # Context API
│   │   ├── i18n/         # Traducciones (ES, EN, FR)
│   │   └── utils/        # Utilidades
│   └── package.json
│
├── backend/              # Express + TypeScript
│   ├── src/
│   │   ├── routes/       # API routes (auth, api, webhooks)
│   │   ├── services/     # Business logic (Stripe, Supabase, Infobip)
│   │   ├── middleware/   # Auth, error handling
│   │   └── config/       # Database, storage, vite
│   └── package.json
│
├── shared/               # Código compartido
│   ├── schema.ts        # Esquemas Zod
│   └── types/           # TypeScript types
│
└── docs/                # Documentación completa
```

## 🚀 Quick Start

### Requisitos previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (o cuenta de Supabase)
- Cuenta Stripe (modo test)

### 1. Instalación

```bash
# Clonar el repositorio
cd "Lean Refactored"

# Instalar todas las dependencias (frontend + backend)
npm install
```

### 2. Configuración

Copia el archivo de ejemplo y configura tus variables:

```bash
cp env.example .env
```

Completa el archivo `.env` con tus credenciales:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Infobip (SMS/WhatsApp)
INFOBIP_API_KEY=your_infobip_key
INFOBIP_BASE_URL=https://api.infobip.com

# Slack (Notificaciones)
SLACK_WEBHOOK_URL=your_slack_webhook

# Database
DATABASE_URL=your_postgresql_url
```

### 3. Migraciones de Base de Datos

```bash
# Ejecutar migraciones con Drizzle
npm run db:push
```

### 4. Desarrollo

```bash
# Iniciar frontend y backend simultáneamente
npm run dev

# O iniciarlos por separado:
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3000
```

### 5. Producción

```bash
# Build completo
npm run build

# Iniciar en producción
npm start
```

## 📦 Tecnologías Principales

### Frontend
- **React 18.3** - Framework UI
- **TypeScript 5.6** - Type safety
- **Vite 6.3** - Build tool ultra-rápido
- **TanStack Query** - State management
- **i18next** - Internacionalización
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Componentes accesibles
- **React Hook Form + Zod** - Formularios validados
- **Recharts** - Gráficos y visualizaciones

### Backend
- **Express.js 4.21** - Framework HTTP
- **TypeScript 5.6** - Type safety
- **Supabase** - Auth + Database (PostgreSQL)
- **Stripe** - Procesamiento de pagos
- **Drizzle ORM** - Type-safe DB queries
- **Zod** - Validación de schemas
- **Infobip** - SMS/WhatsApp API
- **Twilio** - VoIP y llamadas

### DevOps
- **ESLint** - Linting
- **Vitest** - Testing
- **tsx** - TypeScript execution
- **esbuild** - Bundling rápido

## 🎨 Características UI/UX

### Componentes Disponibles
- ✅ 47+ componentes UI (Radix + Tailwind)
- ✅ Tema UNMI personalizado (rojo #FF0000 + azul #003366)
- ✅ Dark mode ready
- ✅ Animaciones suaves con Framer Motion
- ✅ Toast notifications
- ✅ Modales, dropdowns, popovers
- ✅ Formularios con validación en tiempo real
- ✅ Tablas con paginación y filtros
- ✅ Gráficos interactivos

### Páginas
1. **Landing Page** - Hero, features, pricing
2. **Dashboard** - Overview con métricas
3. **Locations** - Gestión de sucursales
4. **Templates** - Plantillas de mensajes
5. **Chatbots** - Configuración de bots IA
6. **Telefonia** - Gestión de llamadas y números
7. **Plan** - Planes y suscripciones
8. **RentabilidadUNMI** - ROI y analytics
9. **AuthPage** - Login/Register
10. **ChoosePlan** - Selección de plan

## 🔐 Seguridad

- ✅ Autenticación JWT con Supabase
- ✅ Middleware `requireAuth` en rutas protegidas
- ✅ Validación de entrada con Zod
- ✅ Helmet para headers HTTP seguros
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Secrets en variables de entorno

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro con Stripe
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/refresh` - Refresh token

### Locations
- `GET /api/locations` - Listar locations
- `POST /api/locations` - Crear location
- `PUT /api/locations/:id` - Actualizar location
- `DELETE /api/locations/:id` - Eliminar location

### Templates
- `GET /api/templates` - Listar templates
- `POST /api/templates` - Crear template
- `PUT /api/templates/:id` - Actualizar template
- `DELETE /api/templates/:id` - Eliminar template

### Webhooks
- `POST /api/webhooks/stripe` - Eventos de Stripe
- `POST /api/webhooks/infobip` - Eventos de Infobip

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en watch mode
npm run test:watch
```

## 🌍 Internacionalización

Idiomas soportados:
- 🇪🇸 Español (por defecto)
- 🇬🇧 Inglés
- 🇫🇷 Francés

Agregar nuevo idioma:
1. Crear `frontend/src/i18n/locales/{code}.json`
2. Agregar traducciones
3. Actualizar `i18n/config.ts`

## 📖 Documentación

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Diseño del sistema
- [QUICK_START.md](./docs/QUICK_START.md) - Guía rápida
- [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) - Detalles de migración
- [I18N_IMPLEMENTATION.md](./I18N_IMPLEMENTATION.md) - Internacionalización

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

## 🙋 Soporte

¿Problemas o preguntas? Abre un issue

---

**Hecho con ❤️ por el equipo UNMI**

Version 2.0.0 | Octubre 2025

