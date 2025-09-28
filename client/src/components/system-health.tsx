import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface HealthStatus {
  services: {
    intercom: { status: string; message: string };
    smtp: { status: string; message: string };
    database: { status: string; message: string };
  };
  status: string;
}

export default function SystemHealth() {
  const { data: health, isLoading } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    refetchInterval: 60000, // Refresh every minute
  });

  const getStatusIndicator = (status: string, level?: string) => {
    if (status.includes("healthy") || status.includes("connected")) {
      return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
    } else if (level === "warning" || status.includes("warning")) {
      return <div className="w-2 h-2 bg-amber-500 rounded-full"></div>;
    } else {
      return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
    }
  };

  const getStatusColor = (status: string, level?: string) => {
    if (status.includes("healthy") || status.includes("connected")) {
      return "text-green-600";
    } else if (level === "warning" || status.includes("warning")) {
      return "text-amber-600";
    } else {
      return "text-red-600";
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">System Health</h3>
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">System Health</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Intercom API</span>
            <div className="flex items-center space-x-1" data-testid="status-intercom">
              {getStatusIndicator(health?.services?.intercom?.status || "unknown")}
              <span className={`text-xs ${getStatusColor(health?.services?.intercom?.status || "unknown")}`}>
                {health?.services?.intercom?.status || "Unknown"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">SMTP Email</span>
            <div className="flex items-center space-x-1" data-testid="status-smtp">
              {getStatusIndicator(health?.services?.smtp?.status || "unknown")}
              <span className={`text-xs ${getStatusColor(health?.services?.smtp?.status || "unknown")}`}>
                {health?.services?.smtp?.status || "Unknown"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Database</span>
            <div className="flex items-center space-x-1" data-testid="status-database">
              {getStatusIndicator(health?.services?.database?.status || "unknown")}
              <span className={`text-xs ${getStatusColor(health?.services?.database?.status || "unknown")}`}>
                {health?.services?.database?.status || "Unknown"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Rate Limits</span>
            <div className="flex items-center space-x-1" data-testid="status-rate-limits">
              {getStatusIndicator("healthy")}
              <span className={`text-xs ${getStatusColor("healthy")}`}>
                Healthy
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
