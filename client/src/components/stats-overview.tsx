import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { type SystemStats } from "@shared/schema";

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<SystemStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const successRate = stats ? 
    ((stats.totalInvites || 0) > 0 ? (((stats.successfulInvites || 0) / (stats.totalInvites || 1)) * 100).toFixed(1) : "0.0") : 
    "0.0";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-envelope text-blue-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Invites</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="text-total-invites">
                {stats?.totalInvites?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            <i className="fas fa-arrow-up mr-1"></i>
            <span>Active automation</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-check-circle text-green-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="text-success-rate">
                {successRate}%
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            <i className="fas fa-arrow-up mr-1"></i>
            <span>High reliability</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-clock text-amber-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="text-response-time">
                2.1s
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            <i className="fas fa-arrow-down mr-1"></i>
            <span>Fast processing</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Failed Attempts</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="text-failed-attempts">
                {stats?.failedInvites || 0}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <i className="fas fa-info-circle mr-1"></i>
            <span>Retry enabled</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
