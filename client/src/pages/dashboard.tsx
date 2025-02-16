import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Location, Template, RoutingRule } from "@shared/schema";
import {
  PhoneCall,
  MapPin,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Phone,
  MessageCircle,
  DollarSign,
  Calculator,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-3))"];

// Sample data for recent calls
const recentCalls = [
  {
    id: 1,
    number: "+1 (555) 123-4567",
    shop: "Downtown Coffee",
    location: "Main Street",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    number: "+1 (555) 234-5678",
    shop: "Westside Bakery",
    location: "West Plaza",
    timestamp: "10:25 AM",
  },
  {
    id: 3,
    number: "+1 (555) 345-6789",
    shop: "North Cafe",
    location: "North Avenue",
    timestamp: "10:20 AM",
  },
  {
    id: 4,
    number: "+1 (555) 456-7890",
    shop: "East Diner",
    location: "East Street",
    timestamp: "10:15 AM",
  },
  {
    id: 5,
    number: "+1 (555) 567-8901",
    shop: "South Restaurant",
    location: "South Boulevard",
    timestamp: "10:10 AM",
  },
];

// Fix the data.map errors in the Call Distribution chart
const callDistributionData = [
  { name: "Answered", value: 85 },
  { name: "Missed", value: 15 },
];

export default function Dashboard() {
  const [averagePrice, setAveragePrice] = useState("50"); // Default average price

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });
  const { data: templates } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });
  const { data: rules } = useQuery<RoutingRule[]>({
    queryKey: ["/api/routing-rules"],
  });
  const { data: missedCallsData } = useQuery<{ total: number }>({
    queryKey: ["/api/calls/missed"],
    queryFn: async () => {
      const response = await fetch("/api/calls/missed");
      return response.json();
    },
  });

  const expectedGains = missedCallsData?.total
    ? Number(averagePrice) * missedCallsData.total
    : 0;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Dashboard
          </h1>

          {/* Stats Overview */}
          <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Calls Today
                </CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 inline-flex items-center">
                    <ArrowUpRight className="h-3 w-3" />
                    12%
                  </span>{" "}
                  vs yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Locations
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locations?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across your organization
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Templates
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {templates?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready to use
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Messages Sent Today
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">63</div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    SMS: 42
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WhatsApp: 21
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* New Expected Gains Calculator Card */}
            <Card className="md:col-span-2 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    Expected Gains Calculator
                  </CardTitle>
                  <CardDescription>
                    Potential revenue from recovered missed calls
                  </CardDescription>
                </div>
                <Calculator className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="averagePrice">Average Sale Value</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="averagePrice"
                        type="number"
                        value={averagePrice}
                        onChange={(e) => setAveragePrice(e.target.value)}
                        className="pl-8"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Recovered Calls</p>
                      <p className="text-2xl font-bold text-primary">
                        {missedCallsData?.total || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Potential Revenue</p>
                      <p className="text-2xl font-bold text-primary">
                        ${expectedGains.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Calls Table */}
          <Card className="mb-8 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>
                Last 5 incoming calls across all locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">
                        {call.number}
                      </TableCell>
                      <TableCell>{call.shop}</TableCell>
                      <TableCell>{call.location}</TableCell>
                      <TableCell>{call.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Charts and Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-background to-primary/5">
              <CardHeader>
                <CardTitle>Call Distribution</CardTitle>
                <CardDescription>Today's call statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={callDistributionData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {callDistributionData.map((_, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4">
                  {callDistributionData.map((entry, index: number) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-sm">
                        {entry.name}: {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-background to-primary/5">
              <CardHeader>
                <CardTitle>Message Type Distribution</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "SMS", value: 65 },
                          { name: "WhatsApp", value: 35 },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="hsl(var(--chart-1))" />
                        <Cell fill="hsl(var(--chart-2))" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))]" />
                    <span className="text-sm">SMS: 65%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
                    <span className="text-sm">WhatsApp: 35%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <CardTitle>Active Routing Rules</CardTitle>
              <CardDescription>
                Currently applied routing configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules?.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Location #{rule.locationId}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Priority: {rule.priority}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}