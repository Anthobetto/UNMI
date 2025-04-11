import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Header } from "@/components/nav/header";
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

const COLORS = ["#E53935", "#32a852"];

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

const callDistributionData = [
  { name: "Answered", value: 85 },
  { name: "Missed", value: 15 },
];

export default function Dashboard() {
  const [averagePrice, setAveragePrice] = useState("50"); 
  const queryClient = useQueryClient();

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });
  const { data: templates } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });
  const { data: rules } = useQuery<RoutingRule[]>({
    queryKey: ["/api/routing-rules"],
  });

  const totalMessagesSent = 63; 
  const expectedGains = totalMessagesSent * Number(averagePrice);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto unmi-main-content">
        <main>
          <Header pageName="Dashboard" />

          <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-2">
            {/* 1. Total Calls Today */}
            <Card className="bg-white border border-gray-100 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-[#0A1930]">
                  Total Calls Today
                </CardTitle>
                <PhoneCall className="h-6 w-6 text-[#E53935]" />
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-[#0A1930]">128</div>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="text-green-600 inline-flex items-center">
                    <ArrowUpRight className="h-4 w-4" />
                    12%
                  </span>{" "}
                  vs yesterday
                </p>
              </CardContent>
            </Card>

            {/* 2. Messages Sent Today */}
            <Card className="bg-white border border-gray-100 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-[#0A1930]">
                  Messages Sent Today
                </CardTitle>
                <MessageSquare className="h-6 w-6 text-[#0A1930]" />
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-[#0A1930]">{totalMessagesSent}</div>
                <div className="flex gap-4 text-sm text-gray-600 mt-2">
                  <span className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    SMS: 42
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp: 21
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Income Calculator */}
          <div className="grid gap-6 mb-8">
            <Card className="bg-white border border-gray-100 rounded-lg shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl text-[#0A1930]">Income Calculator</CardTitle>
                    <CardDescription className="text-gray-600">Message to sales conversion</CardDescription>
                  </div>
                  <Calculator className="h-6 w-6 text-[#E53935]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2" htmlFor="average-price">
                      Average booking value (€)
                    </Label>
                    <Input
                      id="average-price"
                      type="number"
                      min="0"
                      value={averagePrice}
                      onChange={(e) => setAveragePrice(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium">Messages sent</h4>
                      <p className="text-2xl font-bold mt-1">{totalMessagesSent}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Potential revenue</h4>
                      <p className="text-2xl font-bold mt-1 text-[#003366]">{expectedGains}€</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on an average conversion rate of 18% and the indicated booking value.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-2">
            {/* 4. Active Locations */}
            <Card className="bg-white border border-gray-100 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-[#0A1930]">
                  Active Locations
                </CardTitle>
                <MapPin className="h-6 w-6 text-[#E53935]" />
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-[#0A1930]">
                  {locations?.length ?? 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Across your organization
                </p>
              </CardContent>
            </Card>

            {/* 5. Active Templates */}
            <Card className="bg-white border border-gray-100 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-[#0A1930]">
                  Active Templates
                </CardTitle>
                <FileText className="h-6 w-6 text-[#0A1930]" />
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-[#0A1930]">
                  {templates?.length ?? 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Ready to use
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Calls Table */}
          <Card className="mb-8 bg-white border border-gray-100 rounded-lg shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-[#0A1930]">Recent Calls</CardTitle>
                  <CardDescription className="text-gray-600">
                    Last 5 incoming calls across all locations
                  </CardDescription>
                </div>
                <PhoneCall className="h-6 w-6 text-[#E53935]" />
              </div>
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
            
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white border border-gray-100 rounded-lg shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl text-[#0A1930]">Call Distribution</CardTitle>
                    <CardDescription className="text-gray-600">Today's call statistics</CardDescription>
                  </div>
                  <PhoneCall className="h-6 w-6 text-[#E53935]" />
                </div>
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

            <Card className="bg-white border border-gray-100 rounded-lg shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl text-[#0A1930]">Message Type Distribution</CardTitle>
                    <CardDescription className="text-gray-600">Last 30 days</CardDescription>
                  </div>
                  <MessageSquare className="h-6 w-6 text-[#0A1930]" />
                </div>
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
                        <Cell fill="#0A1930" />
                        <Cell fill="#32a852" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0A1930]" />
                    <span className="text-sm">SMS: 65%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#32a852]" />
                    <span className="text-sm">WhatsApp: 35%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


          <Card className="mt-6 bg-white border border-gray-100 rounded-lg shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-[#0A1930]">Active Routing Rules</CardTitle>
                  <CardDescription className="text-gray-600">
                    Currently applied routing configurations
                  </CardDescription>
                </div>
                <MapPin className="h-6 w-6 text-[#E53935]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules?.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#E53935]" />
                      <span className="text-[#0A1930] font-medium">
                        Location #{rule.locationId}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
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