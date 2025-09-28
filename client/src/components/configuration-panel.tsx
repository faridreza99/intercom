import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ConfigData {
  intercom: {
    hasToken: boolean;
    tokenMasked: string;
  };
  smtp: {
    hasUser: boolean;
    hasPassword: boolean;
    host: string;
    port: string;
    fromEmail: string;
    fromName: string;
    userMasked: string;
  };
  business: {
    businessName: string;
    trustpilotDomain: string;
  };
}

export default function ConfigurationPanel() {
  const [showTokens, setShowTokens] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [trustpilotDomain, setTrustpilotDomain] = useState("");
  const { toast } = useToast();

  const { data: config, isLoading, refetch } = useQuery<ConfigData>({
    queryKey: ["/api/config", "v2"],
    refetchInterval: 30000,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (config?.business) {
      setBusinessName(config.business.businessName);
      setTrustpilotDomain(config.business.trustpilotDomain);
    }
  }, [config]);

  const testSMTPConnection = async () => {
    try {
      const response = await apiRequest("POST", "/api/test/smtp");
      const result = await response.json();
      
      toast({
        title: result.connected ? "SMTP Connected" : "SMTP Failed",
        description: result.message,
        variant: result.connected ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testIntercomConnection = async () => {
    try {
      const response = await apiRequest("POST", "/api/test/intercom");
      const result = await response.json();
      
      toast({
        title: result.connected ? "Intercom Connected" : "Intercom Failed",
        description: result.message,
        variant: result.connected ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveConfiguration = () => {
    // Configuration is managed through environment variables in production
    // This would typically update a configuration service or database
    toast({
      title: "Configuration Noted",
      description: "Configuration values are managed through environment variables",
    });
    refetch(); // Refresh the configuration display
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Configuration</h3>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Configuration</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="intercom-token" className="text-sm font-medium text-foreground mb-2 block">
              Intercom Token
            </Label>
            <div className="relative">
              <Input
                id="intercom-token"
                type={showTokens ? "text" : "password"}
                value={showTokens ? (config?.intercom.tokenMasked || "Not configured") : "••••••••••••••••"}
                readOnly
                className="pr-8"
                data-testid="input-intercom-token"
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowTokens(!showTokens)}
                data-testid="button-toggle-tokens"
              >
                <i className={`fas ${showTokens ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="smtp-user" className="text-sm font-medium text-foreground mb-2 block">
              SMTP Email
            </Label>
            <div className="relative">
              <Input
                id="smtp-user"
                type={showTokens ? "text" : "password"}
                value={showTokens ? (config?.smtp.userMasked || "Not configured") : "••••••••••••••••"}
                readOnly
                className="pr-8"
                data-testid="input-smtp-user"
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowTokens(!showTokens)}
              >
                <i className={`fas ${showTokens ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="business-name" className="text-sm font-medium text-foreground mb-2 block">
              Business Name
            </Label>
            <Input
              id="business-name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Business Name"
              data-testid="input-business-name"
            />
          </div>

          <div>
            <Label htmlFor="trustpilot-domain" className="text-sm font-medium text-foreground mb-2 block">
              Trustpilot Domain
            </Label>
            <Input
              id="trustpilot-domain"
              type="text"
              value={trustpilotDomain}
              onChange={(e) => setTrustpilotDomain(e.target.value)}
              placeholder="your-business.trustpilot.com"
              data-testid="input-trustpilot-domain"
            />
          </div>

          <div className="pt-2 space-y-2">
            <Button 
              className="w-full" 
              onClick={saveConfiguration}
              data-testid="button-save-config"
            >
              <i className="fas fa-save mr-2"></i>Refresh Configuration
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="secondary" 
                className="w-full" 
                onClick={testIntercomConnection}
                data-testid="button-test-intercom"
              >
                <i className="fas fa-check-circle mr-2"></i>Test Intercom
              </Button>
              <Button 
                variant="secondary" 
                className="w-full" 
                onClick={testSMTPConnection}
                data-testid="button-test-smtp"
              >
                <i className="fas fa-check-circle mr-2"></i>Test SMTP
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
