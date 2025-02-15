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
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const data = [
  { name: "Answered", value: 85 },
  { name: "Missed", value: 15 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-3))"];

export default function Dashboard() {
  const { data: locations } = useQuery<Location[]>({ 
    queryKey: ["/api/locations"] 
  });
  const { data: templates } = useQuery<Template[]>({ 
    queryKey: ["/api/templates"] 
  });
  const { data: rules } = useQuery<RoutingRule[]>({ 
    queryKey: ["/api/routing-rules"] 
  });

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

          {/* Stats Overview */}
          <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
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

            <Card>
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

            <Card>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Response Time
                </CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18s</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500 inline-flex items-center">
                    <ArrowDownRight className="h-3 w-3" />
                    3s
                  </span>{" "}
                  vs last week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Call Distribution</CardTitle>
                <CardDescription>Today's call statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.map((_, index) => (
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
                  {data.map((entry, index) => (
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

            <Card>
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
          </div>
        </main>
      </div>
    </div>
  );
}
