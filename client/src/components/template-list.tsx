import { Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Image, Link as LinkIcon, Copy } from "lucide-react";

type TemplateListProps = {
  templates: Template[];
  onSelect: (template: Template) => void;
};

export default function TemplateList({ templates, onSelect }: TemplateListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Plantillas Disponibles</h3>
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              {template.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelect(template)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Usar
              </Button>
            </CardTitle>
            <CardDescription>
              {template.type === "service"
                ? "Mensaje Post-Servicio"
                : "Mensaje Upsale"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {template.content}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {template.imageUrl && (
                <span className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  Imagen adjunta
                </span>
              )}
              {template.externalLink && (
                <span className="flex items-center gap-1">
                  <LinkIcon className="h-4 w-4" />
                  Enlace incluido
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
