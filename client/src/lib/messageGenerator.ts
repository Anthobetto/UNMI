import { renderTemplate } from "@/lib/template";
import { LostCall } from "@/lib/lostCall";
import { storage } from "server/storage";

export async function generateMissedCallMessage(call: LostCall, userId: number): Promise<string | null> {
  const templates = await storage.getTemplates(userId);
  const missedTemplate = templates.find(t => t.type === "missed_call");
  if (!missedTemplate) return null;

  const locations = await storage.getLocations(userId);
  const location = locations.find(loc => loc.id === call.storeId);
  const storeName = location?.name || "nuestra tienda";

  const variables = {
    StoreName: storeName,
    Hour: call.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  return renderTemplate(missedTemplate.content, variables);
}