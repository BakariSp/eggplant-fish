import { logger } from "./logger";

// Metric types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer'
}

// Metric interface
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

// Metrics collector class
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, Metric> = new Map();
  private counters: Map<string, number> = new Map();

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // Increment a counter
  increment(name: string, value: number = 1, tags?: Record<string, string>) {
    const key = this.getMetricKey(name, tags);
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + value;
    
    this.counters.set(key, newValue);
    this.recordMetric(name, MetricType.COUNTER, newValue, tags);
    
    logger.debug(`Counter incremented: ${name} = ${newValue}`, {
      metric: name,
      value: newValue,
      increment: value,
      tags: tags ? JSON.stringify(tags) : undefined,
      type: 'metric',
    });
  }

  // Decrement a counter
  decrement(name: string, value: number = 1, tags?: Record<string, string>) {
    this.increment(name, -value, tags);
  }

  // Set a gauge value
  gauge(name: string, value: number, tags?: Record<string, string>) {
    this.recordMetric(name, MetricType.GAUGE, value, tags);
    
    logger.debug(`Gauge set: ${name} = ${value}`, {
      metric: name,
      value,
      tags: tags ? JSON.stringify(tags) : undefined,
      type: 'metric',
    });
  }

  // Record a histogram value (for measuring distributions)
  histogram(name: string, value: number, tags?: Record<string, string>) {
    this.recordMetric(name, MetricType.HISTOGRAM, value, tags);
    
    logger.debug(`Histogram recorded: ${name} = ${value}`, {
      metric: name,
      value,
      tags: tags ? JSON.stringify(tags) : undefined,
      type: 'metric',
    });
  }

  // Record a timer value (convenience method for histograms with time values)
  timer(name: string, duration: number, tags?: Record<string, string>) {
    this.recordMetric(name, MetricType.TIMER, duration, tags);
    
    logger.debug(`Timer recorded: ${name} = ${duration}ms`, {
      metric: name,
      duration,
      tags: tags ? JSON.stringify(tags) : undefined,
      type: 'metric',
    });
  }

  // Time an operation
  time<T>(name: string, operation: () => T, tags?: Record<string, string>): T {
    const startTime = Date.now();
    try {
      const result = operation();
      const duration = Date.now() - startTime;
      this.timer(name, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.timer(name, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  // Time an async operation
  async timeAsync<T>(
    name: string, 
    operation: () => Promise<T>, 
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      this.timer(name, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.timer(name, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  // Get current metric value
  getMetric(name: string, tags?: Record<string, string>): Metric | undefined {
    const key = this.getMetricKey(name, tags);
    return this.metrics.get(key);
  }

  // Get all metrics
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
    this.counters.clear();
  }

  // Private methods
  private recordMetric(
    name: string, 
    type: MetricType, 
    value: number, 
    tags?: Record<string, string>
  ) {
    const metric: Metric = {
      name,
      type,
      value,
      timestamp: Date.now(),
      tags,
    };

    const key = this.getMetricKey(name, tags);
    this.metrics.set(key, metric);
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    return `${name}[${tagString}]`;
  }
}

// Singleton instance
export const metrics = MetricsCollector.getInstance();

// Pre-defined application metrics
export class AppMetrics {
  // HTTP metrics
  static recordHttpRequest(method: string, endpoint: string, statusCode: number, duration: number) {
    metrics.increment('http_requests_total', 1, {
      method,
      endpoint,
      status: statusCode.toString(),
    });

    metrics.timer('http_request_duration', duration, {
      method,
      endpoint,
      status: statusCode.toString(),
    });
  }

  // Database metrics
  static recordDatabaseOperation(operation: string, table: string, duration: number, success: boolean) {
    metrics.increment('database_operations_total', 1, {
      operation,
      table,
      success: success.toString(),
    });

    metrics.timer('database_operation_duration', duration, {
      operation,
      table,
      success: success.toString(),
    });
  }

  // Business metrics
  static recordPetCreated() {
    metrics.increment('pets_created_total');
  }

  static recordPostCreated() {
    metrics.increment('posts_created_total');
  }

  static recordUserRegistration() {
    metrics.increment('user_registrations_total');
  }

  static recordLostModeToggle(enabled: boolean) {
    metrics.increment('lost_mode_toggles_total', 1, {
      enabled: enabled.toString(),
    });
  }

  // Error metrics
  static recordError(type: string, endpoint?: string) {
    metrics.increment('errors_total', 1, {
      type,
      ...(endpoint && { endpoint }),
    });
  }

  static recordValidationError(field: string) {
    metrics.increment('validation_errors_total', 1, {
      field,
    });
  }

  // Performance metrics
  static recordApiLatency(endpoint: string, duration: number) {
    metrics.histogram('api_latency_ms', duration, {
      endpoint,
    });
  }

  static recordMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      metrics.gauge('memory_usage_bytes', memUsage.heapUsed, { type: 'heap_used' });
      metrics.gauge('memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });
      metrics.gauge('memory_usage_bytes', memUsage.rss, { type: 'rss' });
    }
  }

  // Health metrics
  static recordHealthCheck(service: string, healthy: boolean, duration: number) {
    metrics.increment('health_checks_total', 1, {
      service,
      status: healthy ? 'healthy' : 'unhealthy',
    });

    metrics.timer('health_check_duration', duration, {
      service,
      status: healthy ? 'healthy' : 'unhealthy',
    });
  }
}

// Metrics reporting utilities
export class MetricsReporter {
  // Log metrics summary
  static async logMetricsSummary() {
    const allMetrics = metrics.getAllMetrics();
    const summary = allMetrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = [];
      }
      acc[metric.type].push({
        name: metric.name,
        value: metric.value,
        tags: metric.tags,
      });
      return acc;
    }, {} as Record<string, unknown[]>);

    await logger.info('Metrics Summary', {
      summary: JSON.stringify(summary),
      totalMetrics: allMetrics.length,
      type: 'metrics_summary',
    });
  }

  // Export metrics in Prometheus format (for future integration)
  static exportPrometheusFormat(): string {
    const allMetrics = metrics.getAllMetrics();
    const lines: string[] = [];

    for (const metric of allMetrics) {
      const name = metric.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const tags = metric.tags ? 
        Object.entries(metric.tags)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',') : '';
      
      const tagString = tags ? `{${tags}}` : '';
      lines.push(`${name}${tagString} ${metric.value} ${metric.timestamp}`);
    }

    return lines.join('\n');
  }
}
