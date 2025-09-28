import { useState } from "react";
import StatsOverview from "@/components/stats-overview";
import LogsTable from "@/components/logs-table";
import WebhookStatus from "@/components/webhook-status";
import ConfigurationPanel from "@/components/configuration-panel";
import SystemHealth from "@/components/system-health";
import LogDetailModal from "@/components/log-detail-modal";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { type InvitationLog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [selectedLog, setSelectedLog] = useState<InvitationLog | null>(null);
  const { toast } = useToast();

  const handleTestWebhook = async () => {
    try {
      const response = await apiRequest("POST", "/api/test/webhook");
      toast({
        title: "Test Webhook Sent",
        description: "Check the logs for the test result.",
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-exchange-alt text-primary text-xl"></i>
                <h1 className="text-xl font-semibold text-foreground">
                  Intercom ↔ Trustpilot Automation
                </h1>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Active</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="default" data-testid="button-settings">
                <i className="fas fa-cog mr-2"></i>Settings
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleTestWebhook}
                data-testid="button-test-webhook"
              >
                <i className="fas fa-refresh mr-2"></i>Test Webhook
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <StatsOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Logs Table */}
          <div className="lg:col-span-2">
            <LogsTable onViewLog={setSelectedLog} />
          </div>

          {/* Sidebar - Configuration & Status */}
          <div className="space-y-6">
            <WebhookStatus />
            <ConfigurationPanel />
            <SystemHealth />
          </div>
        </div>

        {/* Log Detail Modal */}
        {selectedLog && (
          <LogDetailModal 
            log={selectedLog} 
            onClose={() => setSelectedLog(null)} 
          />
        )}
      </div>
    </div>
  );
}
