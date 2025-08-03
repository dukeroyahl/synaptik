// Client-side logging utility
export interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
} as const;

type LogLevelKey = keyof LogLevel;

class Logger {
  private currentLevel: number;
  private logToFile: boolean;

  constructor() {
    // Get log level from environment variables
    const envLogLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase() as LogLevelKey;
    this.currentLevel = LOG_LEVELS[envLogLevel] ?? (import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO);
    this.logToFile = import.meta.env.VITE_LOG_TO_FILE === 'true';
  }

  private shouldLog(level: number): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const argsString = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    return `${timestamp} [${level}] ${message}${argsString}`;
  }

  private writeToFile(logMessage: string): void {
    if (!this.logToFile) return;
    
    try {
      // For browser environments, we'll use localStorage as a simple log store
      const logs = JSON.parse(localStorage.getItem('synaptik_logs') || '[]');
      logs.push(logMessage);
      
      // Keep only last 1000 log entries to prevent localStorage overflow
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('synaptik_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to write log to localStorage:', error);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    const logMessage = this.formatMessage('DEBUG', message, ...args);
    console.debug(logMessage);
    this.writeToFile(logMessage);
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;
    const logMessage = this.formatMessage('INFO', message, ...args);
    console.info(logMessage);
    this.writeToFile(logMessage);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;
    const logMessage = this.formatMessage('WARN', message, ...args);
    console.warn(logMessage);
    this.writeToFile(logMessage);
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;
    const logMessage = this.formatMessage('ERROR', message, ...args);
    console.error(logMessage);
    this.writeToFile(logMessage);
  }

  // Method to export logs (useful for debugging)
  exportLogs(): string[] {
    try {
      return JSON.parse(localStorage.getItem('synaptik_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Method to clear logs
  clearLogs(): void {
    localStorage.removeItem('synaptik_logs');
  }
}

// Create a singleton logger instance
export const logger = new Logger();

// Export for use in components
export default logger;
