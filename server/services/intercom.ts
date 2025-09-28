export interface IntercomConfig {
  token: string;
}

export class IntercomService {
  private config: IntercomConfig;
  private baseUrl = 'https://api.intercom.io';

  constructor(config: IntercomConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Intercom connection...');
      console.log('Token length:', this.config.token.length);
      console.log('Token starts with:', this.config.token.substring(0, 10) + '...');
      
      // Test the connection by fetching the current user/admin info
      // Intercom uses Bearer Token authentication
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Intercom API response status:', response.status);
      console.log('Intercom API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Intercom API error response:', errorText);
      }

      return response.ok;
    } catch (error) {
      console.error('Intercom connection test failed:', error);
      return false;
    }
  }
}

export function createIntercomService(): IntercomService {
  const token = process.env.INTERCOM_TOKEN || '';
  
  // Intercom uses Bearer Token authentication - use the token directly
  console.log('Using Intercom token for Bearer authentication');

  const config: IntercomConfig = {
    token: token,
  };

  if (!config.token) {
    throw new Error('Missing required Intercom environment variables');
  }

  return new IntercomService(config);
}