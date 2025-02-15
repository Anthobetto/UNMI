import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Location, RoutingRule, Call, Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CallRoutingForm from "../components/call-routing-form";
import CallsTable from "../components/calls-table";
import TemplateEditor from "../components/template-editor";
import TemplateList from "../components/template-list";
import SidebarNav from "@/components/layout/sidebar-nav";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: locations, isLoading: loadingLocations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: rules, isLoading: loadingRules } = useQuery<RoutingRule[]>({
    queryKey: ["/api/rules"],
  });

  const { data: calls, isLoading: loadingCalls } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });

  const { data: templates, isLoading: loadingTemplates } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  // Change the location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: Omit<Location, "id" | "userId">) => {
      const res = await apiRequest("POST", "/api/locations", {
        ...data,
        businessType: data.businessType || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: Omit<RoutingRule, "id" | "userId">) => {
      const res = await apiRequest("POST", "/api/rules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
    },
  });

  // Update the template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: Omit<Template, "id" | "userId" | "isSystem">) => {
      const templateData = {
        ...data,
        type: data.type || "service",
      } as const;
      const res = await apiRequest("POST", "/api/templates", templateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
  });

  if (loadingLocations || loadingRules || loadingCalls || loadingTemplates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bienvenido, {user?.companyName}
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus ubicaciones, llamadas y mensajes
          </p>
        </div>

        <Tabs defaultValue="locations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
            <TabsTrigger value="calls">Llamadas</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
          </TabsList>

          {/* Locations Tab */}
          <TabsContent value="locations" className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ubicaciones</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Ubicación
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nueva Ubicación</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        await createLocationMutation.mutateAsync({
                          name: formData.get("name") as string,
                          address: formData.get("address") as string,
                          latitude: formData.get("latitude") as string,
                          longitude: formData.get("longitude") as string,
                          businessType: formData.get("businessType") as string || null,
                        });
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Nombre
                        </label>
                        <input
                          name="name"
                          className="w-full border rounded p-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Dirección
                        </label>
                        <input
                          name="address"
                          className="w-full border rounded p-2"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Latitud
                          </label>
                          <input
                            name="latitude"
                            type="text"
                            className="w-full border rounded p-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Longitud
                          </label>
                          <input
                            name="longitude"
                            type="text"
                            className="w-full border rounded p-2"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Tipo de Negocio
                        </label>
                        <input
                          name="businessType"
                          className="w-full border rounded p-2"
                          placeholder="Opcional"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={createLocationMutation.isPending}
                        className="w-full"
                      >
                        {createLocationMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Añadir Ubicación"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {locations && locations.length > 0 ? (
                  <div className="space-y-4">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <h3 className="font-medium">{location.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {location.address}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay ubicaciones añadidas todavía
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reglas de Enrutamiento</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Regla
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nueva Regla</DialogTitle>
                    </DialogHeader>
                    <CallRoutingForm
                      locations={locations || []}
                      onSubmit={async (data: Omit<RoutingRule, "id" | "userId">) => {
                        await createRuleMutation.mutateAsync(data);
                      }}
                      isSubmitting={createRuleMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {rules && rules.length > 0 ? (
                  <div className="space-y-4">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <h3 className="font-medium">
                          Prioridad {rule.priority} - {rule.action}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {JSON.stringify(rule.conditions)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay reglas de enrutamiento creadas todavía
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Llamadas</CardTitle>
              </CardHeader>
              <CardContent>
                <CallsTable calls={calls || []} locations={locations || []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Crear Plantilla</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplateEditor
                    onSave={async (template) => {
                      await createTemplateMutation.mutateAsync(template);
                    }}
                    isSubmitting={createTemplateMutation.isPending}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <TemplateList
                templates={templates || []}
                onSelect={(template) => {
                  // Copy template to editor
                  createTemplateMutation.mutate({
                    name: `${template.name} (Copia)`,
                    content: template.content,
                    imageUrl: template.imageUrl,
                    externalLink: template.externalLink,
                    type: template.type,
                  });
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}