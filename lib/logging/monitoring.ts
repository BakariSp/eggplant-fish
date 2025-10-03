import { logger } from "./logger";
import { AppMetrics } from "./metrics";

// Error monitoring service interface
export interface ErrorMonitoringService {
  captureException(error: Error, context?: Record<string, unknown>): void;
  captureMessage(message: string, level: 'info' | 'warning' | 'error', context?: Record<string, unknown>): void;
  setUser(user: { id: string; email?: string }): void;
  setTag(key: string, value: string): void;
  setContext(name: string, context: Record<string, unknown>): void;
}

// Sentry service implementation (placeholder)
class SentryService implements ErrorMonitoringService {
  private enabled = false;

  constructor() {
    // Initialize Sentry if DSN is provided
    if (process.env.SENTRY_DSN) {
      this.enabled = true;
      // TODO: Initialize Sentry SDK
      // Sentry.init({ dsn: process.env.SENTRY_DSN });
      logger.info('Sentry error monitoring initialized');
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.enabled) return;
    
    // TODO: Implement actual Sentry error capture
    // Sentry.captureException(error, { extra: context });
    
    const safeContext: import('./logger').LogContext | undefined = context
      ? (Object.fromEntries(
          Object.entries(context).map(([k, v]) => [
            k,
            typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
              ? v
              : JSON.stringify(v),
          ])
        ) as import('./logger').LogContext)
      : undefined;

    logger.error('Error captured by monitoring service', safeContext, error);
    AppMetrics.recordError('monitored_exception');
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error', context?: Record<string, unknown>): void {
    if (!this.enabled) return;
    
    // TODO: Implement actual Sentry message capture
    // Sentry.captureMessage(message, level, { extra: context });
    
    const logLevel = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info';
    const safeContext: import('./logger').LogContext | undefined = context
      ? (Object.fromEntries(
          Object.entries(context).map(([k, v]) => [
            k,
            typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
              ? v
              : JSON.stringify(v),
          ])
        ) as import('./logger').LogContext)
      : undefined;
    logger[logLevel](`Monitored message: ${message}`, safeContext);
  }

  setUser(user: { id: string; email?: string }): void {
    if (!this.enabled) return;
    
    // TODO: Implement actual Sentry user context
    // Sentry.setUser(user);
    
    logger.debug('User context set in monitoring service', { userId: user.id });
  }

  setTag(key: string, value: string): void {
    if (!this.enabled) return;
    
    // TODO: Implement actual Sentry tags
    // Sentry.setTag(key, value);
    
    logger.debug('Tag set in monitoring service', { key, value });
  }

  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.enabled) return;
    
    // TODO: Implement actual Sentry context
    // Sentry.setContext(name, context);
    
    logger.debug('Context set in monitoring service', { name, context: JSON.stringify(context) });
  }
}

// DataDog service implementation (placeholder)
class DataDogService implements ErrorMonitoringService {
  private enabled = false;

  constructor() {
    if (process.env.DATADOG_API_KEY) {
      this.enabled = true;
      // TODO: Initialize DataDog SDK
      logger.info('DataDog error monitoring initialized');
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.enabled) return;
    
    // TODO: Implement actual DataDog error tracking
    const safeContext: import('./logger').LogContext | undefined = context
      ? (Object.fromEntries(
          Object.entries(context).map(([k, v]) => [
            k,
            typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
              ? v
              : JSON.stringify(v),
          ])
        ) as import('./logger').LogContext)
      : undefined;
    logger.error('Error captured by DataDog service', safeContext, error);
    AppMetrics.recordError('datadog_exception');
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error', context?: Record<string, unknown>): void {
    if (!this.enabled) return;
    
    const logLevel = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info';
    const safeContext2: import('./logger').LogContext | undefined = context
      ? (Object.fromEntries(
          Object.entries(context).map(([k, v]) => [
            k,
            typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
              ? v
              : JSON.stringify(v),
          ])
        ) as import('./logger').LogContext)
      : undefined;
    logger[logLevel](`DataDog message: ${message}`, safeContext2);
  }

  setUser(user: { id: string; email?: string }): void {
    if (!this.enabled) return;
    logger.debug('User context set in DataDog service', { userId: user.id });
  }

  setTag(key: string, value: string): void {
    if (!this.enabled) return;
    logger.debug('Tag set in DataDog service', { key, value });
  }

  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.enabled) return;
    logger.debug('Context set in DataDog service', { name, context: JSON.stringify(context) });
  }
}

// Monitoring service manager
class MonitoringServiceManager {
  private services: ErrorMonitoringService[] = [];

  constructor() {
    // Initialize available services based on environment variables
    this.services.push(new SentryService());
    this.services.push(new DataDogService());
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    this.services.forEach(service => {
      try {
        service.captureException(error, context);
      } catch (serviceError) {
        logger.error('Error monitoring service failed', {
          service: service.constructor.name,
          originalError: error.message,
        }, serviceError as Error);
      }
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error', context?: Record<string, unknown>): void {
    this.services.forEach(service => {
      try {
        service.captureMessage(message, level, context);
      } catch (serviceError) {
        logger.error('Error monitoring service failed', {
          service: service.constructor.name,
          message,
        }, serviceError as Error);
      }
    });
  }

  setUser(user: { id: string; email?: string }): void {
    this.services.forEach(service => {
      try {
        service.setUser(user);
      } catch (serviceError) {
        logger.error('Error monitoring service failed to set user', {
          service: service.constructor.name,
          userId: user.id,
        }, serviceError as Error);
      }
    });
  }

  setTag(key: string, value: string): void {
    this.services.forEach(service => {
      try {
        service.setTag(key, value);
      } catch (serviceError) {
        logger.error('Error monitoring service failed to set tag', {
          service: service.constructor.name,
          key,
          value,
        }, serviceError as Error);
      }
    });
  }

  setContext(name: string, context: Record<string, unknown>): void {
    this.services.forEach(service => {
      try {
        service.setContext(name, context);
      } catch (serviceError) {
        logger.error('Error monitoring service failed to set context', {
          service: service.constructor.name,
          name,
        }, serviceError as Error);
      }
    });
  }
}

// Singleton instance
export const errorMonitoring = new MonitoringServiceManager();

// Health monitoring utilities
export class HealthMonitor {
  private static checks: Map<string, () => Promise<boolean>> = new Map();

  // Register a health check
  static registerCheck(name: string, check: () => Promise<boolean>) {
    this.checks.set(name, check);
    logger.info(`Health check registered: ${name}`);
  }

  // Run all health checks
  static async runHealthChecks(): Promise<Record<string, { status: string; duration: number }>> {
    const results: Record<string, { status: string; duration: number }> = {};

    for (const [name, check] of this.checks.entries()) {
      const startTime = Date.now();
      
      try {
        const healthy = await check();
        const duration = Date.now() - startTime;
        
        results[name] = {
          status: healthy ? 'healthy' : 'unhealthy',
          duration,
        };

        AppMetrics.recordHealthCheck(name, healthy, duration);
        
        await logger.info(`Health check completed: ${name}`, {
          service: name,
          status: healthy ? 'healthy' : 'unhealthy',
          duration,
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        
        results[name] = {
          status: 'error',
          duration,
        };

        AppMetrics.recordHealthCheck(name, false, duration);
        
        await logger.error(`Health check failed: ${name}`, {
          service: name,
          status: 'error',
          duration,
        }, error as Error);
      }
    }

    return results;
  }

  // Run a single health check
  static async runCheck(name: string): Promise<{ status: string; duration: number } | null> {
    const check = this.checks.get(name);
    if (!check) {
      logger.warn(`Health check not found: ${name}`);
      return null;
    }

    const startTime = Date.now();
    
    try {
      const healthy = await check();
      const duration = Date.now() - startTime;
      
      AppMetrics.recordHealthCheck(name, healthy, duration);
      
      return {
        status: healthy ? 'healthy' : 'unhealthy',
        duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      AppMetrics.recordHealthCheck(name, false, duration);
      
      await logger.error(`Health check failed: ${name}`, {
        service: name,
        duration,
      }, error as Error);

      return {
        status: 'error',
        duration,
      };
    }
  }
}

// Initialize default health checks
HealthMonitor.registerCheck('database', async () => {
  try {
    // TODO: Add actual database health check
    // const { createDataAccess } = await import('../data');
    // const dataAccess = await createDataAccess();
    // await dataAccess.pets().getAllPets(1);
    return true;
  } catch {
    return false;
  }
});

HealthMonitor.registerCheck('memory', async () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage();
    const memoryThreshold = 1024 * 1024 * 1024; // 1GB
    return memUsage.heapUsed < memoryThreshold;
  }
  return true;
});

