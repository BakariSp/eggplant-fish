import { NextRequest, NextResponse } from "next/server";
import { createDataAccess } from "@/lib/data";
import { 
  petQuerySchema, 
  validateInput, 
  withErrorHandler, 
  createSuccessResponse,
  createInternalError
} from "@/lib/validation";
import { withLogging, PerformanceMonitor, AppMetrics } from "@/lib/logging";

async function handleGetPets(request: NextRequest) {
  return await PerformanceMonitor.measureAsync('get_pets_operation', async () => {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = validateInput(petQuerySchema, queryParams);
    
    const dataAccess = await createDataAccess();
    
    // Get pets using data access layer with validated parameters
    const { pets, error } = await PerformanceMonitor.measureAsync('database_get_pets', async () => {
      return await dataAccess.pets().getAllPets(validatedQuery.limit);
    });

    if (error) {
      throw createInternalError("Failed to fetch pets", { originalError: error });
    }

    // Record metrics
    AppMetrics.recordApiLatency('/api/pets', Date.now());

    return createSuccessResponse({
      pets, 
      count: pets.length,
      pagination: {
        limit: validatedQuery.limit,
        offset: validatedQuery.offset
      }
    }, pets.length > 0 ? `Found ${pets.length} pets` : "No pets found");
  });
}

export const GET = withLogging(withErrorHandler(handleGetPets));
