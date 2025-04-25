import { Call } from "@shared/schema";
import { LostCall } from "@/lib/lostCall";

export function toLostCall(call: Call): LostCall {
  return {
    id: call.id,
    clientID: call.callerNumber,
    date: new Date(call.createdAt),
    storeId: call.routedToLocation!,
    messageSent: false
  };
}