import { Sidebar } from "@/components/nav/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for small businesses",
    features: [
      "Up to 3 locations",
      "Basic call routing",
      "5 call templates",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "$79",
    description: "For growing companies",
    features: [
      "Up to 10 locations",
      "Advanced call routing",
      "20 call templates",
      "Priority support",
      "Call analytics",
    ],
  },
  {
    name: "Enterprise",
    price: "$199",
    description: "For large organizations",
    features: [
      "Unlimited locations",
      "Custom routing rules",
      "Unlimited templates",
      "24/7 phone support",
      "Advanced analytics",
      "Custom integrations",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="p-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Pricing Plans</h1>
            <p className="text-lg text-muted-foreground">
              Choose the perfect plan for your business
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
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
                  <Button className="w-full" variant="outline">
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
