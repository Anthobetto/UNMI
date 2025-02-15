import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Call, Location } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type CallsTableProps = {
  calls: Call[];
  locations: Location[];
};

export default function CallsTable({ calls, locations }: CallsTableProps) {
  const getLocationName = (locationId: number) => {
    return locations.find(loc => loc.id === locationId)?.name || 'Desconocido';
  };

  const getBusinessType = (locationId: number) => {
    return locations.find(loc => loc.id === locationId)?.businessType || 'No especificado';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Tipo de Negocio</TableHead>
            <TableHead>Mensaje Enviado</TableHead>
            <TableHead>Fecha y Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                No hay llamadas registradas
              </TableCell>
            </TableRow>
          ) : (
            calls.map((call) => (
              <TableRow key={call.id}>
                <TableCell>{call.phoneNumber}</TableCell>
                <TableCell>{getLocationName(call.locationId)}</TableCell>
                <TableCell>{getBusinessType(call.locationId)}</TableCell>
                <TableCell>{call.messageSent || 'Sin mensaje'}</TableCell>
                <TableCell>
                  {format(new Date(call.timestamp), "PPp", { locale: es })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
