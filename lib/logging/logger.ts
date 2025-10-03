// Logging levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// Log context interface
export interface LogContext {
  userId?: string;
  petId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: string | number | boolean | undefined;
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  service: string;
  environment: string;
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  service: string;
  environment: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  service: 'pet-nfc-app',
  environment: process.env.NODE_ENV || 'development',
  enableConsole: true,
  enableFile: false, // Can be enabled for production
  enableRemote: false, // Can be enabled with services like Datadog, Sentry, etc.
};

class Logger {
  private config: LoggerConfig;
  private requestId: string | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Set request ID for request tracking
  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  // Clear request ID
  clearRequestId() {
    this.requestId = null;
  }

  // Create log entry
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      message,
      service: this.config.service,
      environment: this.config.environment,
    };

    // Add context
    if (context || this.requestId) {
      entry.context = {
        ...context,
        ...(this.requestId && { requestId: this.requestId }),
      };
    }

    // Add error details
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  // Log to console with colors
  private logToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return;

    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level] || reset;

    const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : '';
    const errorStr = entry.error ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}` : '';

    console.log(
      `${color}[${entry.timestamp}] ${entry.levelName}: ${entry.message}${reset}`,
      contextStr ? `\nContext: ${contextStr}` : '',
      errorStr
    );
  }

  // Log to file (placeholder for file logging implementation)
  private async logToFile(entry: LogEntry) {
    if (!this.config.enableFile) return;
    
    // In a real implementation, you would write to a file
    // For now, we'll just prepare the JSON format
    const logLine = JSON.stringify(entry) + '\n';
    
    // TODO: Implement file writing logic
    // fs.appendFileSync('./logs/app.log', logLine);
  }

  // Log to remote service (placeholder for remote logging)
  private async logToRemote(entry: LogEntry) {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      // In a real implementation, you would send to services like:
      // - Datadog
      // - New Relic
      // - Sentry
      // - CloudWatch
      // - Custom logging service
      
      // Example implementation:
      // await fetch(this.config.remoteEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote service:', error);
    }
  }

  // Main logging method
  private async log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ) {
    // Check if log level meets threshold
    if (level < this.config.level) return;

    const entry = this.createLogEntry(level, message, context, error);

    // Send to all enabled outputs
    this.logToConsole(entry);
    await this.logToFile(entry);
    await this.logToRemote(entry);
  }

  // Convenience methods
  debug(message: string, context?: LogContext) {
    return this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    return this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext, error?: Error) {
    return this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error) {
    return this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, context?: LogContext, error?: Error) {
    return this.log(LogLevel.FATAL, message, context, error);
  }

  // HTTP request logging
  async logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ) {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;

    const message = `${method} ${url} ${statusCode} - ${duration}ms`;

    await this.log(level, message, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      type: 'http_request',
    });
  }

  // Database operation logging
  async logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    context?: LogContext,
    error?: Error
  ) {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    const message = `DB ${operation} on ${table} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`;

    await this.log(level, message, {
      ...context,
      operation,
      table,
      duration,
      success,
      type: 'database_operation',
    }, error);
  }

  // Business logic logging
  async logBusinessEvent(
    event: string,
    details: Record<string, unknown>,
    context?: LogContext
  ) {
    const message = `Business Event: ${event}`;

    await this.log(LogLevel.INFO, message, {
      ...context,
      event,
      details: JSON.stringify(details),
      type: 'business_event',
    });
  }

  // Security event logging
  async logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ) {
    const level = severity === 'critical' ? LogLevel.FATAL :
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN :
                  LogLevel.INFO;

    const message = `Security Event: ${event} (${severity})`;

    await this.log(level, message, {
      ...context,
      event,
      severity,
      type: 'security_event',
    });
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Export types and classes
export { Logger };
export type { LoggerConfig };
