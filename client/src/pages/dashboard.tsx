import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Location, RoutingRule } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CallRoutingForm from "@/components/call-routing-form";
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

  const createLocationMutation = useMutation({
    mutationFn: async (data: Omit<Location, "id" | "userId">) => {
      const res = await apiRequest("POST", "/api/locations", data);
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

  if (loadingLocations || loadingRules) {
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
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.companyName}</h1>
          <p className="text-muted-foreground">
            Manage your locations and call routing rules
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Locations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Locations</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Location</DialogTitle>
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
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name
                      </label>
                      <input
                        name="name"
                        className="w-full border rounded p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Address
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
                          Latitude
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
                          Longitude
                        </label>
                        <input
                          name="longitude"
                          type="text"
                          className="w-full border rounded p-2"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={createLocationMutation.isPending}
                      className="w-full"
                    >
                      {createLocationMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Add Location"
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
                  No locations added yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Routing Rules */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Routing Rules</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Rule</DialogTitle>
                  </DialogHeader>
                  <CallRoutingForm
                    locations={locations || []}
                    onSubmit={async (data) => {
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
                        Priority {rule.priority} - {rule.action}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {JSON.stringify(rule.conditions)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No routing rules created yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
