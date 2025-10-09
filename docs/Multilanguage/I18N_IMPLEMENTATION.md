# 🌍 Implementación i18n - Multi-idioma (ES, EN, FR)

## ✅ CAMBIOS REALIZADOS

### 1. Configuración i18n
- ✅ Agregado `i18next`, `react-i18next`, `i18next-browser-languagedetector` al `package.json`
- ✅ Creado `/src/i18n/config.ts` - Configuración principal i18n
- ✅ Creado `/src/i18n/locales/es.json` - Traducciones completas Español
- ✅ Creado `/src/i18n/locales/en.json` - Traducciones completas English  
- ✅ Creado `/src/i18n/locales/fr.json` - Traducciones completas Français

### 2. Componentes Actualizados
- ✅ Creado `/src/components/LanguageSelector.tsx` - Selector de idioma dropdown
- ✅ Actualizado `/src/components/nav/header.tsx` - Incluye LanguageSelector
- ✅ Actualizado `/src/components/nav/sidebar.tsx` - Navegación traducida
- ✅ Actualizado `/src/pages/AuthPage.tsx` - Login/Register traducido + LanguageSelector
- ✅ Actualizado `/src/App.tsx` - Import i18n config, rutas optimizadas

### 3. Código Duplicado Eliminado
- ✅ Eliminado `/src/pages/Landing.tsx` (duplicado de LandingPage.tsx)
- ✅ Eliminada ruta duplicada `/landing` en App.tsx
- ✅ Optimizadas rutas: solo una ruta por funcionalidad

## 🔧 INSTRUCCIONES DE INSTALACIÓN

### Paso 1: Instalar dependencias
```bash
cd "Lean Refactored/frontend"
npm install
```

### Paso 2: Verificar package.json
Asegúrate de que estas dependencias están instaladas:
```json
{
  "i18next": "^23.7.6",
  "i18next-browser-languagedetector": "^7.2.0",
  "react-i18next": "^13.5.0"
}
```

### Paso 3: Ejecutar aplicación
```bash
npm run dev
```

## 📋 PÁGINAS PENDIENTES DE TRADUCCIÓN

Las siguientes páginas necesitan ser actualizadas para usar `useTranslation()`:

### 🟡 Prioridad Alta (Core)
1. ⏳ `/src/pages/LandingPage.tsx` - Landing completo
2. ⏳ `/src/pages/Dashboard.tsx` - Dashboard principal
3. ⏳ `/src/pages/Templates.tsx` - CRUD templates

### 🟡 Prioridad Media (B2B Features)
4. ⏳ `/src/pages/RentabilidadUNMI.tsx` - Calculadora ROI
5. ⏳ `/src/pages/Telefonia.tsx` - Analytics llamadas
6. ⏳ `/src/pages/Plan.tsx` - Gestión planes
7. ⏳ `/src/pages/Chatbots.tsx` - Integración chatbots
8. ⏳ `/src/pages/Locations.tsx` - Multi-location

### 🟢 Prioridad Baja
9. ⏳ `/src/pages/ChoosePlan.tsx` - Selección plan post-registro

## 🎯 PATRÓN DE TRADUCCIÓN

### Importar useTranslation
```typescript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('section.key')}</h1>;
}
```

### Estructura JSON
```json
{
  "section": {
    "key": "Texto traducido"
  }
}
```

### Ejemplo Dashboard
```typescript
// ANTES
<h1>Dashboard</h1>
<p>Llamadas Hoy</p>

// DESPUÉS  
<h1>{t('dashboard.title')}</h1>
<p>{t('dashboard.metrics.callsToday')}</p>
```

## 🧪 TESTING

### 1. Cambiar idioma
- Hacer clic en el selector de idioma (header o AuthPage)
- Seleccionar ES / EN / FR
- Verificar que TODO el texto cambia

### 2. Persistencia
- Cambiar idioma → Refrescar página
- El idioma seleccionado debe mantenerse (localStorage)

### 3. Detección automática
- Borrar localStorage: `localStorage.removeItem('unmi_language')`
- Refrescar: debe detectar idioma del navegador

## 📊 ESTRUCTURA DE ARCHIVOS

```
frontend/
├── src/
│   ├── i18n/
│   │   ├── config.ts           ✅ Configuración i18n
│   │   └── locales/
│   │       ├── es.json         ✅ Español completo
│   │       ├── en.json         ✅ English completo
│   │       └── fr.json         ✅ Français completo
│   ├── components/
│   │   ├── LanguageSelector.tsx ✅ Selector idioma
│   │   └── nav/
│   │       ├── header.tsx      ✅ Con selector
│   │       └── sidebar.tsx     ✅ Nav traducida
│   ├── pages/
│   │   ├── AuthPage.tsx        ✅ Traducido
│   │   ├── LandingPage.tsx     ⏳ Pendiente
│   │   ├── Dashboard.tsx       ⏳ Pendiente
│   │   └── ... (resto)         ⏳ Pendientes
│   └── App.tsx                 ✅ Import i18n
└── package.json                ✅ Deps agregadas
```

## 🚀 SIGUIENTES PASOS

1. **Instalar dependencias**: `npm install` en /frontend
2. **Traducir LandingPage**: Página más grande, prioridad #1
3. **Traducir Dashboard**: Core de la aplicación
4. **Traducir Templates**: Feature principal B2B
5. **Traducir resto de páginas**: Según prioridad
6. **Testing completo**: Verificar todas las páginas en 3 idiomas

## 💡 NOTAS IMPORTANTES

### Auto-detección de idioma
- Orden: `localStorage` > `navegador` > fallback a ES
- Se guarda en `localStorage` como `unmi_language`

### Añadir nuevas traducciones
1. Editar `/src/i18n/locales/es.json` (o en/fr)
2. Añadir nueva key en la sección correspondiente
3. Usar en componente: `t('section.newKey')`

### Debugging
Para ver logs de i18n, cambiar en `config.ts`:
```typescript
debug: true  // Muestra keys faltantes en consola
```

## 📝 CHECKLIST FINAL

- [x] Configuración i18n completa
- [x] 3 archivos de idiomas completos (ES, EN, FR)
- [x] LanguageSelector component
- [x] Header con selector
- [x] Sidebar traducido
- [x] AuthPage traducido
- [x] App.tsx optimizado
- [x] Código duplicado eliminado
- [ ] LandingPage traducido
- [ ] Dashboard traducido
- [ ] Templates traducido
- [ ] Resto de páginas traducidas
- [ ] Testing E2E completo

---

**Siguiente tarea**: Traducir `LandingPage.tsx` - La página más crítica para conversión B2B

