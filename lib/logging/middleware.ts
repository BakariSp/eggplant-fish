import { NextRequest, NextResponse } from "next/server";
import { logger, LogContext } from "./logger";
import { v4 as uuidv4 } from "uuid";

// Request context interface
export interface RequestContext extends LogContext {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  startTime: number;
}

// Extract request context
export function extractRequestContext(request: NextRequest): RequestContext {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  // Extract IP address
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown';

  // Extract user agent
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return {
    requestId,
    method: request.method,
    url: request.url,
    userAgent,
    ip,
    startTime,
  };
}

// Log request start
export async function logRequestStart(context: RequestContext) {
  logger.setRequestId(context.requestId);
  
  await logger.info(`Incoming ${context.method} request`, {
    method: context.method,
    url: context.url,
    userAgent: context.userAgent,
    ip: context.ip,
    requestId: context.requestId,
  });
}

// Log request completion
export async function logRequestComplete(
  context: RequestContext,
  response: NextResponse,
  error?: Error
) {
  const duration = Date.now() - context.startTime;
  const statusCode = response.status;

  await logger.logRequest(
    context.method,
    context.url,
    statusCode,
    duration,
    {
      ...context,
      statusCode,
      duration,
      success: statusCode < 400,
    }
  );

  if (error) {
    await logger.error(`Request failed: ${context.method} ${context.url}`, {
      ...context,
      statusCode,
      duration,
    }, error);
  }

  logger.clearRequestId();
}

// Middleware wrapper for API routes
export function withLogging<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = extractRequestContext(request);
    
    try {
      await logRequestStart(context);
      const response = await handler(request, ...args);
      await logRequestComplete(context, response);
      return response;
    } catch (error) {
      // Create error response if handler throws
      const errorResponse = NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
      await logRequestComplete(context, errorResponse, error as Error);
      throw error; // Re-throw to let error handler deal with it
    }
  };
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Timer '${label}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);
    return duration;
  }

  static async measureAsync<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.startTimer(label);
    try {
      const result = await operation();
      const duration = this.endTimer(label);
      
      await logger.debug(`Operation '${label}' completed`, {
        operation: label,
        duration,
        success: true,
        type: 'performance',
      });

      return result;
    } catch (error) {
      const duration = this.endTimer(label);
      
      await logger.error(`Operation '${label}' failed`, {
        operation: label,
        duration,
        success: false,
        type: 'performance',
      }, error as Error);

      throw error;
    }
  }

  static measure<T>(label: string, operation: () => T): T {
    this.startTimer(label);
    try {
      const result = operation();
      const duration = this.endTimer(label);
      
      logger.debug(`Operation '${label}' completed`, {
        operation: label,
        duration,
        success: true,
        type: 'performance',
      });

      return result;
    } catch (error) {
      const duration = this.endTimer(label);
      
      logger.error(`Operation '${label}' failed`, {
        operation: label,
        duration,
        success: false,
        type: 'performance',
      }, error as Error);

      throw error;
    }
  }
}

// Database operation logging decorator
export function withDatabaseLogging<T extends any[], R>(
  operation: string,
  table: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      await logger.logDatabaseOperation(
        operation,
        table,
        duration,
        true
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await logger.logDatabaseOperation(
        operation,
        table,
        duration,
        false,
        {},
        error as Error
      );

      throw error;
    }
  };
}

// Health check logging
export async function logHealthCheck(
  service: string,
  status: 'healthy' | 'unhealthy' | 'degraded',
  details?: Record<string, any>
) {
  const level = status === 'healthy' ? 'info' : 
               status === 'degraded' ? 'warn' : 'error';

  await logger[level](`Health Check: ${service} - ${status}`, {
    service,
    status,
    details,
    type: 'health_check',
  });
}

// User activity logging
export async function logUserActivity(
  userId: string,
  activity: string,
  details?: Record<string, any>,
  context?: LogContext
) {
  await logger.logBusinessEvent(`User Activity: ${activity}`, {
    userId,
    activity,
    ...details,
  }, context);
}

// API usage analytics
export async function logApiUsage(
  endpoint: string,
  method: string,
  userId?: string,
  context?: LogContext
) {
  await logger.info(`API Usage: ${method} ${endpoint}`, {
    ...context,
    endpoint,
    method,
    userId,
    type: 'api_usage',
  });
}
