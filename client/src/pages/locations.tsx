import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Location, PhoneNumber, insertLocationSchema, insertPhoneNumberSchema } from "@shared/schema";
import { MapPin, Plus, Phone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Locations() {
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: phoneNumbers } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/phone-numbers"],
  });

  const locationForm = useForm({
    resolver: zodResolver(insertLocationSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      address: "",
      latitude: "",
      longitude: "",
    },
  });

  const phoneForm = useForm({
    resolver: zodResolver(insertPhoneNumberSchema.omit({ userId: true })),
    defaultValues: {
      locationId: 0,
      number: "",
      active: true,
    },
  });

  const createLocation = useMutation({
    mutationFn: async (data: Omit<Location, "id" | "userId">) => {
      const res = await apiRequest("POST", "/api/locations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
  });

  const createPhoneNumber = useMutation({
    mutationFn: async (data: Omit<PhoneNumber, "id" | "userId">) => {
      const res = await apiRequest("POST", "/api/phone-numbers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
    },
  });

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Locations</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                </DialogHeader>
                <Form {...locationForm}>
                  <form
                    onSubmit={locationForm.handleSubmit((data) =>
                      createLocation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={locationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={locationForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={locationForm.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={locationForm.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createLocation.isPending}
                    >
                      Add Location
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locations?.map((location) => (
              <Card key={location.id}>
                <CardHeader className="flex flex-row items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-xl">{location.name}</CardTitle>
                    <CardDescription>{location.address}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <div>Latitude: {location.latitude}</div>
                    <div>Longitude: {location.longitude}</div>
                  </div>

                  {/* Phone Numbers Section */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Phone Numbers</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Number
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Phone Number</DialogTitle>
                          </DialogHeader>
                          <Form {...phoneForm}>
                            <form
                              onSubmit={phoneForm.handleSubmit((data) =>
                                createPhoneNumber.mutate({ ...data, locationId: location.id })
                              )}
                              className="space-y-4"
                            >
                              <FormField
                                control={phoneForm.control}
                                name="number"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="+1 (555) 000-0000" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                className="w-full"
                                disabled={createPhoneNumber.isPending}
                              >
                                Add Number
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-2">
                      {phoneNumbers
                        ?.filter(pn => pn.locationId === location.id)
                        .map((phoneNumber) => (
                          <div
                            key={phoneNumber.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{phoneNumber.number}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}