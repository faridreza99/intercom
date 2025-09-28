import axios from 'axios';

export interface TrustpilotConfig {
  apiKey: string;
  secretKey: string;
  businessUnitId: string;
  templateId: string;
}

export interface ReviewInvitationRequest {
  email: string;
  name: string;
  referenceId: string;
  templateId: string;
  tags?: string[];
  locale?: string;
}

export interface ReviewInvitationResponse {
  id: string;
  status: string;
  businessUnitId: string;
  email: string;
  name: string;
  referenceId: string;
  createdAt: string;
}

export class TrustpilotService {
  private config: TrustpilotConfig;
  private baseUrl = 'https://api.trustpilot.com/v1';

  constructor(config: TrustpilotConfig) {
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    try {
      console.log('Getting Trustpilot access token...');
      console.log('API Key:', this.config.apiKey.substring(0, 10) + '...');
      console.log('Secret Key length:', this.config.secretKey.length);
      console.log('Secret Key starts with:', this.config.secretKey.substring(0, 4) + '...');
      
      const response = await axios.post(
        `${this.baseUrl}/oauth/oauth-business-users-for-applications/accesstoken`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.apiKey,
          client_secret: this.config.secretKey,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('Trustpilot OAuth successful');
      return response.data.access_token;
    } catch (error: any) {
      console.error('Failed to get Trustpilot access token:');
      console.error('Status:', error.response?.status);
      console.error('Response:', error.response?.data);
      console.error('Headers:', error.response?.headers);
      throw new Error('Failed to authenticate with Trustpilot API');
    }
  }

  async sendReviewInvitation(request: ReviewInvitationRequest): Promise<ReviewInvitationResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseUrl}/private/business-units/${this.config.businessUnitId}/email-invitations`,
        {
          email: request.email,
          name: request.name,
          referenceId: request.referenceId,
          templateId: request.templateId,
          tags: request.tags || [],
          locale: request.locale || 'en-US',
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to send Trustpilot review invitation:', error);
      
      if (error.response) {
        throw new Error(`Trustpilot API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      }
      
      throw new Error('Failed to send review invitation');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Test the connection by fetching business unit info
      await axios.get(
        `${this.baseUrl}/business-units/${this.config.businessUnitId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Trustpilot connection test failed:', error);
      return false;
    }
  }
}

export function createTrustpilotService(): TrustpilotService {
  const config: TrustpilotConfig = {
    apiKey: process.env.TRUSTPILOT_API_KEY || '',
    secretKey: process.env.TRUSTPILOT_SECRET_KEY || '',
    businessUnitId: process.env.TRUSTPILOT_BUSINESS_UNIT_ID || '',
    templateId: process.env.TEMPLATE_ID || '',
  };

  if (!config.apiKey || !config.secretKey || !config.businessUnitId || !config.templateId) {
    throw new Error('Missing required Trustpilot environment variables');
  }

  return new TrustpilotService(config);
}
