import { renderTemplate } from "@/lib/template";
import { LostCall } from "@/lib/lostCall";
import { storage } from "server/storage";

export async function generateMissedCallMessage(call: LostCall, userId: number): Promise<string | null> {
  // 1. Buscar la plantilla
  const templates = await storage.getTemplates(userId);
  const missedTemplate = templates.find(t => t.type === "missed_call");
  if (!missedTemplate) return null;

  // 2. Buscar datos extra (ej. nombre de la tienda)
  const locations = await storage.getLocations(userId);
  const location = locations.find(loc => loc.id === call.storeId);
  const storeName = location?.name || "nuestra tienda";

  // 3. Crear las variables para reemplazar
  const variables = {
    StoreName: storeName,
    Hour: call.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  // 4. Reemplazar y devolver mensaje
  return renderTemplate(missedTemplate.content, variables);
}