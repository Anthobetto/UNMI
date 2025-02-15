import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import PricingCard from "@/components/pricing-card";
import { PhoneCall, Settings2, Globe2, BarChart3 } from "lucide-react";
import { PRICING_TIERS } from "@shared/schema";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-primary/5 to-primary/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
              Intelligent Call Management for Growing Businesses
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Route calls intelligently, manage multiple locations, and deliver
              exceptional customer service with our enterprise-grade solution.
            </p>
            <Link href="/auth">
              <Button size="lg" className="mr-4">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Features that Drive Growth
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <PhoneCall className="h-8 w-8" />,
                title: "Smart Call Routing",
                description:
                  "Route calls to the right location based on customer location and business rules",
              },
              {
                icon: <Settings2 className="h-8 w-8" />,
                title: "Custom Workflows",
                description:
                  "Create custom call handling workflows that match your business processes",
              },
              {
                icon: <Globe2 className="h-8 w-8" />,
                title: "Multi-Location Support",
                description:
                  "Manage multiple business locations from a single dashboard",
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Analytics & Insights",
                description:
                  "Get detailed insights into call patterns and performance metrics",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {Object.entries(PRICING_TIERS).map(([key, tier]) => (
              <PricingCard key={key} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 CallFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
