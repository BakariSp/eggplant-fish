import { NextResponse, NextRequest } from "next/server";
import { ZodError, ZodIssue } from "zod";
import { logger, AppMetrics } from "../logging";

// Standard error types
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS"
}

// Standard error response interface
export interface ApiError {
  error: string;
  type: ErrorType;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path?: string;
}

// Custom error class for API errors
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Predefined error creators
export const createValidationError = (message: string, details?: Record<string, unknown>) =>
  new AppError(ErrorType.VALIDATION_ERROR, message, 400, details);

export const createNotFoundError = (message: string = "Resource not found") =>
  new AppError(ErrorType.NOT_FOUND, message, 404);

export const createUnauthorizedError = (message: string = "Unauthorized access") =>
  new AppError(ErrorType.UNAUTHORIZED, message, 401);

export const createForbiddenError = (message: string = "Forbidden access") =>
  new AppError(ErrorType.FORBIDDEN, message, 403);

export const createConflictError = (message: string, details?: Record<string, unknown>) =>
  new AppError(ErrorType.CONFLICT, message, 409, details);

export const createInternalError = (message: string = "Internal server error", details?: Record<string, unknown>) =>
  new AppError(ErrorType.INTERNAL_ERROR, message, 500, details);

export const createBadRequestError = (message: string, details?: Record<string, unknown>) =>
  new AppError(ErrorType.BAD_REQUEST, message, 400, details);

export const createTooManyRequestsError = (message: string = "Too many requests") =>
  new AppError(ErrorType.TOO_MANY_REQUESTS, message, 429);

// Format Zod validation errors
export function formatZodError(error: ZodError): { message: string; details: Record<string, unknown> } {
  const fieldErrors: Record<string, string[]> = {};
  
  error.issues.forEach((issue: ZodIssue) => {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  });

  const firstError = error.issues[0];
  const mainMessage = firstError ? 
    `${firstError.path.join(".") || "Input"}: ${firstError.message}` : 
    "Validation failed";

  return {
    message: mainMessage,
    details: {
      fieldErrors,
      issues: error.issues
    }
  };
}

// Create standardized error response
export function createErrorResponse(
  error: AppError | Error,
  path?: string
): NextResponse<ApiError> {
  let apiError: ApiError;

  if (error instanceof AppError) {
    // Log application errors
    logger.error(`Application Error: ${error.message}`, {
      type: error.type,
      statusCode: error.statusCode,
      path,
      details: error.details ? JSON.stringify(error.details) : undefined,
    }, error);

    // Record error metrics
    AppMetrics.recordError(error.type, path);

    apiError = {
      error: error.type,
      type: error.type,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      path
    };
    return NextResponse.json(apiError, { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const { message, details } = formatZodError(error);
    
    // Log validation errors
    logger.warn(`Validation Error: ${message}`, {
      path,
      details: JSON.stringify(details),
      issues: JSON.stringify(error.issues),
    });

    // Record validation error metrics
    error.issues.forEach(issue => {
      AppMetrics.recordValidationError(issue.path.join('.') || 'unknown');
    });

    apiError = {
      error: ErrorType.VALIDATION_ERROR,
      type: ErrorType.VALIDATION_ERROR,
      message,
      details,
      timestamp: new Date().toISOString(),
      path
    };
    return NextResponse.json(apiError, { status: 400 });
  }

  // Handle unknown errors
  logger.error("Unexpected error occurred", {
    path,
    errorName: error.name,
    errorMessage: error.message,
  }, error);

  // Record unknown error metrics
  AppMetrics.recordError('UNKNOWN_ERROR', path);

  apiError = {
    error: ErrorType.INTERNAL_ERROR,
    type: ErrorType.INTERNAL_ERROR,
    message: "An unexpected error occurred",
    timestamp: new Date().toISOString(),
    path
  };
  return NextResponse.json(apiError, { status: 500 });
}

// Success response helper
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  // Log successful operations
  if (message) {
    logger.info(`Success: ${message}`, {
      statusCode: status,
      hasData: !!data,
    });
  }

  const response: ApiSuccess<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
  return NextResponse.json(response, { status });
}

// Validation helper function
export function validateInput<T>(schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: unknown } }, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw result.error;
  }
  return result.data!;
}

// Async error handler wrapper for API routes
export function withErrorHandler<T = unknown>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      const path = req.url ? new URL(req.url).pathname : undefined;
      return createErrorResponse(error as Error, path);
    }
  };
}
