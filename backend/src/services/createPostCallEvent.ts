// createPostCallEvent.ts
import { PostCallEvent } from './FlowService';
import { flowService } from './FlowService';

async function main() {
  // 1️⃣ Define el evento de llamada perdida
  const event: PostCallEvent = {
    callId: 'call-' + Date.now(), // ID único
    userId: 'e664b7cd-b2f6-42f4-9082-4310632e80dd',    // Reemplaza con el UUID del usuario
    locationId: 1,                // ID de la location
    virtualNumber: '+34123456789',// Número que recibe la llamada
    callerNumber: '+34987654321', // Número del cliente
    callType: 'missed',
    timestamp: new Date().toISOString(),
    duration: 0,
  };

  // 2️⃣ Procesar la llamada perdida
  const result = await flowService.handleMissedCall(event);

  console.log('✅ Resultado del PostCallEvent:', result);
}

// Ejecutar
main().catch(err => console.error(err));
