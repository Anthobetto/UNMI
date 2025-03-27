import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Building2, CreditCard } from "lucide-react";

const promoSchema = z.object({
  code: z.string().min(1, "Please enter a promo code"),
});

const plans = [
  {
    id: "per-location",
    name: "Per Location",
    description: "Perfect for small to medium businesses",
    price: "30€",
    interval: "per location/month",
    features: [
      "Location-based call routing",
      "Basic call templates",
      "Real-time analytics",
      "Email support",
      "24/7 system monitoring",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    interval: "contact sales",
    features: [
      "Volume-based discounts",
      "Custom routing rules",
      "Premium templates",
      "24/7 phone support",
      "Advanced analytics",
      "Custom integrations",
      "Dedicated account manager",
    ],
  },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPromoValid, setIsPromoValid] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmitPromo = (data: z.infer<typeof promoSchema>) => {
    if (data.code === "unmi123") {
      setIsPromoValid(true);
      toast({
        title: "Success!",
        description: "Promo code applied successfully. You can now access the platform.",
      });
      setLocation("/");
    } else {
      toast({
        title: "Invalid code",
        description: "Please enter a valid promo code",
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    // This will be replaced with actual Stripe integration later
    toast({
      title: "Coming soon",
      description: "Payment integration will be available soon.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started with Unmi today. Choose the plan that best fits your business needs.
          </p>
        </div>

        {/* Promo Code Section */}
        <div className="max-w-md mx-auto mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Have a Promo Code?</CardTitle>
              <CardDescription>Enter your code to access the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPromo)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promo Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Apply Code
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              {plan.id === "enterprise" && (
                <div className="absolute -top-2 -right-2 bg-primary text-white px-3 py-1 rounded-full text-sm">
                  Popular
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  {plan.id === "per-location" ? (
                    <Building2 className="h-5 w-5 text-primary" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">
                    {plan.interval}
                  </span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.id === "enterprise" ? "outline" : "default"}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {plan.id === "enterprise" ? "Contact Sales" : "Subscribe Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}