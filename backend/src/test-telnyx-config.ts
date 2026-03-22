import telnyx from 'telnyx';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const apiKey = process.env.TELNYX_API_KEY;

if (!apiKey) {
  console.error('❌ ERROR: No se encuentra la variable TELNYX_API_KEY en .env.local');
  process.exit(1);
}

// @ts-ignore
const client = new telnyx(apiKey);

async function testConnection() {
  console.log('⏳ Analizando cliente de Telnyx...');
  
  try {
    // 1. Verificar conexión básica
    await client.messagingProfiles.list();
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    console.log('--------------------------------------');
    
    // 2. Vamos a ver qué propiedades tiene realmente el objeto client
    // Esto nos dirá el nombre exacto de la función de aplicaciones
    const keys = Object.keys(client);
    console.log('🔍 Propiedades disponibles en tu versión de Telnyx:');
    
    const interestingKeys = keys.filter(k => 
        k.toLowerCase().includes('app') || 
        k.toLowerCase().includes('phone') || 
        k.toLowerCase().includes('call')
    );
    
    interestingKeys.forEach(k => console.log(`   - ${k}`));
    
    console.log('--------------------------------------');
    
    // Intentar listar números (esta suele ser universal)
    if (client.phoneNumbers) {
        const numbers = await client.phoneNumbers.list();
        console.log(`📞 Números encontrados: ${numbers.data.length}`);
    }

  } catch (error: any) {
    console.error('❌ ERROR EN EL TEST:');
    console.error(error.message);
  }
}

testConnection();
