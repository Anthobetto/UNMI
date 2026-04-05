import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 1. Intentamos cargar y capturar el resultado
const result = dotenv.config();

// 2. DEBUG: Esto te dirá el error real en la consola
if (result.error) {
  console.error("❌ Error de Dotenv:", result.error.message);
  
  // Intento de rescate: Si falla, probamos buscarlo manualmente en la raíz
  console.log("Reintentando carga manual...");
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

console.log('🔍 Database Config: Checking Supabase variables...');
// ... el resto de tus logs y lógica
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ LOADED' : '❌ MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ LOADED' : '❌ MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ LOADED' : '❌ MISSING');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Missing Supabase credentials. Database operations will fail.');
}

// Cliente admin (Service Role)
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Cliente usuario (Anon Key)
export const supabaseAuth: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder_anon_key'
);

export default supabase;
