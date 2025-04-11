import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { UnmiSvgLogo } from "@/components/logo/unmi-svg-logo";

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] p-4">
      <Card className="w-full max-w-md shadow-sm bg-white rounded-3xl border-0">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-3">
              <UnmiSvgLogo width={180} />
            </div>
            <p className="text-[#333333] text-center mt-2">
              Transform your business communications
            </p>
          </div>

          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-full">
              <TabsTrigger 
                value="login" 
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit((data) =>
                    loginMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333] font-medium">Username</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-14 rounded-xl border-gray-200" />
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
                        <FormLabel className="text-[#333333] font-medium">Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} className="h-14 rounded-xl border-gray-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-full mt-6 bg-[#E53935] hover:bg-[#D32F2F] text-white font-medium text-lg"
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
                  className="space-y-6"
                >
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333] font-medium">Username</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-14 rounded-xl border-gray-200" />
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
                        <FormLabel className="text-[#333333] font-medium">Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} className="h-14 rounded-xl border-gray-200" />
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
                        <FormLabel className="text-[#333333] font-medium">Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-14 rounded-xl border-gray-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-full mt-6 bg-[#E53935] hover:bg-[#D32F2F] text-white font-medium text-lg"
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
  );
}