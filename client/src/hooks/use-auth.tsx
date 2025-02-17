import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) return null;
      return {
        id: parseInt(user.id),
        username: user.email || '',
        companyName: user.user_metadata.company_name || '',
        password: '' // Password is never returned
      };
    },
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username,
        password: credentials.password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user returned after login");
      return {
        id: parseInt(data.user.id),
        username: data.user.email || '',
        companyName: data.user.user_metadata.company_name || '',
        password: '' // Password is never returned
      };
    },
    onSuccess: (user: SelectUser) => {
      navigate("/");
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.username,
        password: credentials.password,
        options: {
          data: {
            company_name: credentials.companyName
          }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user returned after registration");
      return {
        id: parseInt(data.user.id),
        username: data.user.email || '',
        companyName: data.user.user_metadata.company_name || '',
        password: '' // Password is never returned
      };
    },
    onSuccess: (user: SelectUser) => {
      navigate("/");
      toast({
        title: "Welcome!",
        description: "Successfully registered.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      navigate("/auth");
      toast({
        title: "Goodbye!",
        description: "Successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}