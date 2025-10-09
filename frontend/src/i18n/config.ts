/**
 * i18n Configuration
 * Multi-language support: ES, EN, FR
 * Auto-detect browser language with fallback to ES
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import es from './locales/es.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

// Language resources
const resources = {
  es: { translation: es },
  en: { translation: en },
  fr: { translation: fr },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources,
    fallbackLng: 'es', // Fallback language
    supportedLngs: ['es', 'en', 'fr'],
    debug: false, // Set to true for development debugging
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'unmi_language',
    },
  });

export default i18n;

