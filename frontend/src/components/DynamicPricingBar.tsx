/**
 * DynamicPricingBar - Interactive pricing slider
 * Real-time calculation preview for B2B upselling
 */

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, MapPin, MessageSquare, DollarSign } from 'lucide-react';
import { pricingService, type PricingTier, type PricingCalculation } from '@/services/PricingService';

interface DynamicPricingBarProps {
  tier: PricingTier;
  locations?: number;
  onPriceChange?: (calculation: PricingCalculation) => void;
  showLocationInput?: boolean;
}

export function DynamicPricingBar({ 
  tier, 
  locations = 1, 
  onPriceChange,
  showLocationInput = false 
}: DynamicPricingBarProps) {
  const [dailyMessages, setDailyMessages] = useState(tier.minMessages);
  const [locationCount, setLocationCount] = useState(locations);
  const [calculation, setCalculation] = useState<PricingCalculation>(
    pricingService.calculateMonthly(tier.id, tier.minMessages, locations)
  );

  useEffect(() => {
    const newCalc = pricingService.calculateMonthly(tier.id, dailyMessages, locationCount);
    setCalculation(newCalc);
    onPriceChange?.(newCalc);
  }, [dailyMessages, locationCount, tier.id, onPriceChange]);

  const handleMessagesChange = (value: number[]) => {
    setDailyMessages(value[0]);
  };

  const handleLocationsChange = (value: number[]) => {
    setLocationCount(value[0]);
  };

  const messagesPerMonth = dailyMessages * 30;
  const savingsPercent = calculation.locationDiscount > 0 
    ? Math.round((calculation.locationDiscount / (calculation.basePrice + calculation.messagesCost)) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Messages Slider */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Daily Messages</CardTitle>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {dailyMessages} msgs/day
            </Badge>
          </div>
          <CardDescription>
            Adjust your daily WhatsApp message volume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[dailyMessages]}
            onValueChange={handleMessagesChange}
            min={tier.minMessages}
            max={tier.dailyMessageCap}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{tier.minMessages} min</span>
            <span>{messagesPerMonth} msgs/month</span>
            <span>{tier.dailyMessageCap} max</span>
          </div>
        </CardContent>
      </Card>

      {/* Locations Slider (if enabled) */}
      {showLocationInput && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Physical Locations</CardTitle>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">
                {locationCount} {locationCount === 1 ? 'store' : 'stores'}
              </Badge>
            </div>
            <CardDescription>
              Add more locations to unlock bundle discounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              value={[locationCount]}
              onValueChange={handleLocationsChange}
              min={1}
              max={tier.id === 'starter' ? 1 : tier.id === 'professional' ? 5 : 20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1 location</span>
              <span>
                {locationCount > 1 && `${savingsPercent}% discount applied`}
              </span>
              <span>
                {tier.id === 'starter' ? '1 max' : tier.id === 'professional' ? '5 max' : 'Unlimited'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Breakdown */}
      <Card className="bg-gradient-to-br from-primary/5 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Your Custom Price
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base price</span>
              <span className="font-medium">€{calculation.basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Messages ({messagesPerMonth}/month × €{tier.messageRate.toFixed(2)})
              </span>
              <span className="font-medium">€{calculation.messagesCost.toFixed(2)}</span>
            </div>
            {calculation.locationDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Multi-location discount</span>
                <span className="font-medium">-€{calculation.locationDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Monthly</span>
              <span className="text-3xl font-bold text-primary">
                €{calculation.totalMonthly.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
              <span>Yearly (10% off)</span>
              <span className="font-medium">€{calculation.totalYearly.toFixed(2)}/year</span>
            </div>
          </div>

          {locationCount > 1 && calculation.locationDiscount > 0 && (
            <Alert className="bg-green-50 border-green-200">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>You're saving €{calculation.locationDiscount.toFixed(2)}/month</strong> with {locationCount} locations!
                {locationCount < (tier.id === 'professional' ? 5 : 20) && (
                  <span className="block mt-1 text-sm">
                    Add {(tier.id === 'professional' ? 5 : 20) - locationCount} more location(s) for even bigger savings.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

