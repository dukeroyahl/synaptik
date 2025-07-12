// Global type declarations for Google Identity Services API
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
          }) => {
            requestAccessToken: () => void;
            callback: (response: any) => void;
          };
          revoke: (token: string) => void;
        };
      };
    };
  }
}

export {};
