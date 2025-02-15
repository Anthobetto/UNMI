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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Location, PhoneNumber } from "@shared/schema";
import { MapPin, Plus, Phone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const locationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  phoneType: z.enum(["sms", "whatsapp", "both"]),
});

type LocationFormData = z.infer<typeof locationFormSchema>;

export default function Locations() {
  const { toast } = useToast();
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: phoneNumbers } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/phone-numbers"],
  });

  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
      phoneType: "both",
    },
  });

  const createLocation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      try {
        // First create the location
        const locationRes = await apiRequest("POST", "/api/locations", {
          name: data.name,
          address: data.address,
        });
        const location = await locationRes.json();

        // Then create the associated phone number
        await apiRequest("POST", "/api/phone-numbers", {
          locationId: location.id,
          number: data.phoneNumber,
          type: data.phoneType,
          active: true,
        });

        return location;
      } catch (error) {
        console.error("Error creating location:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
      toast({
        title: "Success",
        description: "Location and phone number created successfully",
      });
      locationForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create location: " + error.message,
        variant: "destructive",
      });
    },
  });

  const createPhoneNumber = useMutation({
    mutationFn: async (data: { locationId: number; number: string; type: string }) => {
      const res = await apiRequest("POST", "/api/phone-numbers", {
        ...data,
        active: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
      toast({
        title: "Success",
        description: "Phone number added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to add phone number: " + error.message,
        variant: "destructive",
      });
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
                  <DialogDescription>
                    Add a new business location with its primary contact number.
                  </DialogDescription>
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
                    <FormField
                      control={locationForm.control}
                      name="phoneNumber"
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
                    <FormField
                      control={locationForm.control}
                      name="phoneType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select channel type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sms">SMS Only</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                              <SelectItem value="both">Both SMS & WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                <CardContent>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Communication Channels</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Number
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Communication Channel</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input placeholder="+1 (555) 000-0000" />
                            <Select defaultValue="both">
                              <SelectTrigger>
                                <SelectValue placeholder="Select channel type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sms">SMS Only</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                                <SelectItem value="both">Both SMS & WhatsApp</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              className="w-full"
                              onClick={() =>
                                createPhoneNumber.mutate({
                                  locationId: location.id,
                                  number: "",
                                  type: "both",
                                })
                              }
                              disabled={createPhoneNumber.isPending}
                            >
                              Add Number
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-3">
                      {phoneNumbers
                        ?.filter((pn) => pn.locationId === location.id)
                        .map((phoneNumber) => (
                          <div
                            key={phoneNumber.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{phoneNumber.number}</span>
                            </div>
                            <span className="text-sm text-muted-foreground capitalize">
                              {phoneNumber.type}
                            </span>
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