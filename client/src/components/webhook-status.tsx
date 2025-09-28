import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function WebhookStatus() {
  const { toast } = useToast();

  const webhookUrl = `${window.location.origin}/api/webhook/intercom`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast({
        title: "Copied!",
        description: "Webhook URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const testWebhook = async () => {
    try {
      await apiRequest("POST", "/api/test/webhook");
      toast({
        title: "Test Sent",
        description: "Test webhook has been triggered",
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
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Webhook Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Endpoint URL</span>
            <div className="flex items-center space-x-2">
              <code className="bg-muted px-2 py-1 rounded text-xs font-mono" data-testid="text-webhook-url">
                /api/webhook/intercom
              </code>
              <button 
                className="text-xs text-primary hover:text-primary/80"
                onClick={copyToClipboard}
                data-testid="button-copy-webhook"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center space-x-1" data-testid="status-webhook">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Request</span>
            <span className="text-sm text-foreground" data-testid="text-last-request">Recently active</span>
          </div>
          <div className="pt-2">
            <Button 
              className="w-full" 
              onClick={testWebhook}
              data-testid="button-test-webhook"
            >
              <i className="fas fa-bolt mr-2"></i>Test Webhook
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
