import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type InvitationLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface LogDetailModalProps {
  log: InvitationLog;
  onClose: () => void;
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-log-detail">
        <DialogHeader>
          <DialogTitle>Invitation Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Customer</label>
              <p className="text-sm text-muted-foreground" data-testid="detail-customer-name">
                {log.customerName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <p className="text-sm text-muted-foreground" data-testid="detail-customer-email">
                {log.customerEmail}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Agent</label>
              <p className="text-sm text-muted-foreground" data-testid="detail-agent-name">
                {log.agentName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Conversation ID</label>
              <p className="text-sm text-muted-foreground font-mono" data-testid="detail-conversation-id">
                {log.conversationId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <p className="text-sm text-muted-foreground" data-testid="detail-status">
                {log.status}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Timestamp</label>
              <p className="text-sm text-muted-foreground" data-testid="detail-timestamp">
                {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : 'N/A'}
              </p>
            </div>
            {(log.retryCount || 0) > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground">Retry Count</label>
                <p className="text-sm text-muted-foreground" data-testid="detail-retry-count">
                  {log.retryCount}/3
                </p>
              </div>
            )}
            {log.trustpilotInvitationId && (
              <div>
                <label className="text-sm font-medium text-foreground">Trustpilot ID</label>
                <p className="text-sm text-muted-foreground font-mono" data-testid="detail-trustpilot-id">
                  {log.trustpilotInvitationId}
                </p>
              </div>
            )}
          </div>
          
          {log.errorMessage && (
            <div>
              <label className="text-sm font-medium text-foreground">Error Message</label>
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded" data-testid="detail-error-message">
                {log.errorMessage}
              </p>
            </div>
          )}
          
          {log.responseLog ? (
            <div>
              <label className="text-sm font-medium text-foreground">Response Log</label>
              <pre className="bg-muted p-3 rounded-md text-xs font-mono text-muted-foreground mt-2 overflow-x-auto" data-testid="detail-response-log">
                {(typeof log.responseLog === 'object' ? JSON.stringify(log.responseLog || {}, null, 2) : String(log.responseLog || '')) as string}
              </pre>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
