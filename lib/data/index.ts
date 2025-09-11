import { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabaseClient, getAdminSupabaseClient } from "../supabase";
import { PetsDataAccess } from "./pets";
import { PostsDataAccess } from "./posts";
import { OwnersDataAccess } from "./owners";

/**
 * Data access factory
 * Creates instances of data access classes with the appropriate Supabase clients
 */
export class DataAccessFactory {
  private userSupabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor(userSupabase: SupabaseClient, adminSupabase?: SupabaseClient) {
    this.userSupabase = userSupabase;
    this.adminSupabase = adminSupabase || getAdminSupabaseClient();
  }

  /**
   * Get pets data access instance
   */
  pets(): PetsDataAccess {
    return new PetsDataAccess(this.userSupabase);
  }

  /**
   * Get posts data access instance
   */
  posts(): PostsDataAccess {
    return new PostsDataAccess(this.userSupabase);
  }

  /**
   * Get owners data access instance
   * Note: This requires both user and admin clients
   */
  owners(): OwnersDataAccess {
    return new OwnersDataAccess(this.userSupabase, this.adminSupabase);
  }
}

/**
 * Convenience function to create a data access factory with server-side clients
 */
export async function createDataAccess(): Promise<DataAccessFactory> {
  const userSupabase = await getServerSupabaseClient();
  const adminSupabase = getAdminSupabaseClient();
  return new DataAccessFactory(userSupabase, adminSupabase);
}

// Re-export types and classes for convenience
export * from "./pets";
export * from "./posts";
export * from "./owners";
