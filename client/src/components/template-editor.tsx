import { useState } from "react";
import { Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ImagePlus, Link as LinkIcon, Save } from "lucide-react";

type TemplateEditorProps = {
  template?: Partial<Template>;
  onSave: (template: Partial<Template>) => Promise<void>;
  isSubmitting?: boolean;
};

export default function TemplateEditor({
  template,
  onSave,
  isSubmitting,
}: TemplateEditorProps) {
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>(
    template || {
      name: "",
      content: "",
      imageUrl: "",
      externalLink: "",
      type: "service" as const,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentTemplate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {template ? "Editar Plantilla" : "Nueva Plantilla"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Plantilla</Label>
            <Input
              id="name"
              value={currentTemplate.name}
              onChange={(e) =>
                setCurrentTemplate({ ...currentTemplate, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Mensaje</Label>
            <Select
              value={currentTemplate.type}
              onValueChange={(value) =>
                setCurrentTemplate({ ...currentTemplate, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Post-Servicio</SelectItem>
                <SelectItem value="upsale">Upsale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenido del Mensaje</Label>
            <Textarea
              id="content"
              value={currentTemplate.content}
              onChange={(e) =>
                setCurrentTemplate({ ...currentTemplate, content: e.target.value })
              }
              className="min-h-[200px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              URL de la Imagen
            </Label>
            <Input
              id="imageUrl"
              value={currentTemplate.imageUrl || ""}
              onChange={(e) =>
                setCurrentTemplate({ ...currentTemplate, imageUrl: e.target.value || null })
              }
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalLink" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Enlace Externo
            </Label>
            <Input
              id="externalLink"
              value={currentTemplate.externalLink || ""}
              onChange={(e) =>
                setCurrentTemplate({
                  ...currentTemplate,
                  externalLink: e.target.value || null,
                })
              }
              placeholder="https://ejemplo.com"
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Guardar Plantilla
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}