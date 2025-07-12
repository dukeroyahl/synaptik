interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

interface GoogleCalendarService {
  isAuthenticated: boolean;
  authenticate: () => Promise<boolean>;
  getEvents: (timeMin?: string, timeMax?: string) => Promise<GoogleCalendarEvent[]>;
  createEvent: (event: Partial<GoogleCalendarEvent>) => Promise<GoogleCalendarEvent>;
  updateEvent: (eventId: string, event: Partial<GoogleCalendarEvent>) => Promise<GoogleCalendarEvent>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  signOut: () => void;
}

class GoogleCalendarServiceImpl implements GoogleCalendarService {
  private accessToken: string | null = null;
  private tokenClient: any = null;
  
  public get isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Google Identity Services
      if (typeof window !== 'undefined' && !window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          this.initializeGIS();
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else if (window.google) {
        this.initializeGIS();
        resolve();
      }
    });
  }

  private initializeGIS(): void {
    const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    
    if (!CLIENT_ID) {
      throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable.');
    }

    // Initialize the token client
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar',
      callback: (response: any) => {
        if (response.access_token) {
          this.accessToken = response.access_token;
        }
      },
    });
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.tokenClient) {
        await this.initialize();
      }

      return new Promise((resolve) => {
        // Update callback to resolve the promise
        this.tokenClient.callback = (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            resolve(true);
          } else {
            resolve(false);
          }
        };
        
        // Request access token
        this.tokenClient.requestAccessToken();
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Authentication failed:', error);
      }
      return false;
    }
  }

  private async makeCalendarRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      if (timeMax) {
        params.append('timeMax', timeMax);
      }

      const result = await this.makeCalendarRequest(`calendars/primary/events?${params}`);
      return result.items || [];
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch events:', error);
      }
      throw error;
    }
  }

  async createEvent(event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    try {
      const result = await this.makeCalendarRequest('calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      return result;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to create event:', error);
      }
      throw error;
    }
  }

  async updateEvent(eventId: string, event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    try {
      const result = await this.makeCalendarRequest(`calendars/primary/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });

      return result;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to update event:', error);
      }
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await this.makeCalendarRequest(`calendars/primary/events/${eventId}`, {
        method: 'DELETE',
      });

      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete event:', error);
      }
      return false;
    }
  }

  signOut(): void {
    this.accessToken = null;
    if (window.google?.accounts?.oauth2) {
      // Revoke the token
      if (this.accessToken) {
        window.google.accounts.oauth2.revoke(this.accessToken);
      }
    }
  }
}

// Singleton instance
export const googleCalendarService = new GoogleCalendarServiceImpl();
export default googleCalendarService;
