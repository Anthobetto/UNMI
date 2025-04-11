import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PhoneCall, 
  BarChart3, 
  Clock, 
  HeartHandshake,
  Lightbulb,
  TrendingUp
} from "lucide-react";

type LoginData = Pick<InsertUser, "username" | "password">;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(insertUserSchema.pick({ username: true, password: true })),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      companyName: "",
    },
  });

  return (
    <div className="min-h-screen flex">
      {/* Left column - Forms */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex justify-center items-center gap-2 text-2xl font-bold">
              <svg
                width={40}
                height={40}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="20" cy="20" r="18" fill="#E53935" stroke="#E53935" strokeWidth="2" />
                <path
                  d="M15 17.5C15 16.1193 16.1193 15 17.5 15C18.8807 15 20 16.1193 20 17.5V25C20 25.5523 19.5523 26 19 26C18.4477 26 18 25.5523 18 25V17.5C18 17.2239 17.7761 17 17.5 17C17.2239 17 17 17.2239 17 17.5V25C17 25.5523 16.5523 26 16 26C15.4477 26 15 25.5523 15 25V17.5Z"
                  fill="white"
                />
                <path
                  d="M25 17.5C25 16.1193 23.8807 15 22.5 15C21.1193 15 20 16.1193 20 17.5V25C20 25.5523 20.4477 26 21 26C21.5523 26 22 25.5523 22 25V17.5C22 17.2239 22.2239 17 22.5 17C22.7761 17 23 17.2239 23 17.5V25C23 25.5523 23.4477 26 24 26C24.5523 26 25 25.5523 25 25V17.5Z"
                  fill="white"
                />
                <path
                  d="M14 21H12C11.4477 21 11 21.4477 11 22C11 22.5523 11.4477 23 12 23H14V21Z"
                  fill="white"
                />
                <path
                  d="M28 21H26V23H28C28.5523 23 29 22.5523 29 22C29 21.4477 28.5523 21 28 21Z"
                  fill="white"
                />
              </svg>
              <span className="text-[#0A1930] font-bold">
                Unmi
              </span>
            </CardTitle>
            <CardDescription>
              Transform your business communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit((data) =>
                      loginMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit((data) =>
                      registerMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      Register
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Right column - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center p-12">
        <div className="max-w-2xl space-y-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Elevate Your Business Communication
          </h1>

          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Drive Revenue Growth</h3>
                <p className="text-muted-foreground">
                  Convert missed calls into opportunities with instant follow-ups and smart message routing
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">24/7 Business Presence</h3>
                <p className="text-muted-foreground">
                  Never miss a customer inquiry with automated responses and round-the-clock message handling
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Operational Excellence</h3>
                <p className="text-muted-foreground">
                  Streamline communications across all locations with intelligent routing and templates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HeartHandshake className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Enhanced Customer Experience</h3>
                <p className="text-muted-foreground">
                  Deliver consistent, professional responses across all channels - SMS, WhatsApp, and voice
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-primary/10">
            <p className="text-sm text-muted-foreground">
              Trusted by growing businesses across multiple industries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}