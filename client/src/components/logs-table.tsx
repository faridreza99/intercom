import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { type InvitationLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface LogsTableProps {
  onViewLog: (log: InvitationLog) => void;
}

export default function LogsTable({ onViewLog }: LogsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: logs = [], isLoading, refetch } = useQuery<InvitationLog[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const filteredLogs = logs.filter(log => 
    statusFilter === "all" || log.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <i className="fas fa-check-circle mr-1"></i>
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <i className="fas fa-exclamation-circle mr-1"></i>
            Failed
          </Badge>
        );
      case "retrying":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <i className="fas fa-clock mr-1"></i>
            Retrying
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <i className="fas fa-hourglass mr-1"></i>
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Invitation Logs</h2>
          <div className="flex items-center space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="retrying">Retry</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm" data-testid="button-filter">
              <i className="fas fa-filter mr-1"></i>Filter
            </Button>
            <Button variant="default" size="sm" data-testid="button-export">
              <i className="fas fa-download mr-1"></i>Export
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No invitation logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-log-${log.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <i className="fas fa-user text-primary"></i>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground" data-testid={`text-customer-name-${log.id}`}>
                          {log.customerName}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-customer-email-${log.id}`}>
                          {log.customerEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground" data-testid={`text-agent-name-${log.id}`}>
                      {log.agentName}
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid={`text-conversation-id-${log.id}`}>
                      Conv #{log.conversationId.slice(-6)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`status-${log.id}`}>
                    {getStatusBadge(log.status)}
                    {(log.retryCount || 0) > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Retry {log.retryCount}/3
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`text-timestamp-${log.id}`}>
                    {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-primary hover:text-primary/80 mr-2"
                      onClick={() => onViewLog(log)}
                      data-testid={`button-view-${log.id}`}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="text-muted-foreground hover:text-foreground"
                      data-testid={`button-retry-${log.id}`}
                    >
                      <i className="fas fa-redo"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {filteredLogs.length > 0 && (
        <div className="bg-muted px-6 py-3 flex items-center justify-between border-t border-border">
          <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
            Showing {filteredLogs.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" disabled data-testid="button-previous">
              Previous
            </Button>
            <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">1</span>
            <Button variant="secondary" size="sm" data-testid="button-next">
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
