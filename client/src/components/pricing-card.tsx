import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { PRICING_TIERS } from "@shared/schema";
import { Link } from "wouter";

type PricingCardProps = {
  tier: (typeof PRICING_TIERS)[keyof typeof PRICING_TIERS];
};

export default function PricingCard({ tier }: PricingCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{tier.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-3xl font-bold">${tier.price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-3">
          {tier.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Link href="/auth" className="w-full">
          <Button className="w-full">Get Started</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
