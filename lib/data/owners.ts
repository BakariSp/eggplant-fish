import { SupabaseClient } from "@supabase/supabase-js";

// Types for owner/user data
export interface Owner {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photo_url?: string;
  pet_id?: string;
}

export interface ContactPreferences {
  id: string;
  pet_id: string;
  show_email: boolean;
  show_phone: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ContactPreferencesCreateData {
  pet_id: string;
  show_email: boolean;
  show_phone: boolean;
}

export interface ContactPreferencesUpdateData {
  show_email?: boolean;
  show_phone?: boolean;
}

/**
 * Data access layer for owners and contact preferences
 * All database operations related to pet owners should go through these functions
 */
export class OwnersDataAccess {
  constructor(
    private supabase: SupabaseClient,
    private adminSupabase: SupabaseClient
  ) {}

  /**
   * Get owner information for a pet by pet ID
   * This requires admin client for accessing auth.users data
   */
  async getOwnerByPetId(petId: string): Promise<{ owner: Owner | null; error: string | null }> {
    try {
      // First get the pet to find the owner
      const { data: pet, error: petError } = await this.supabase
        .from("pets")
        .select("owner_user_id")
        .eq("id", petId)
        .single();

      if (petError || !pet) {
        return { owner: null, error: "Pet not found" };
      }

      // Get owner information from auth.users (requires admin client)
      const { data: user, error: userError } = await this.adminSupabase.auth.admin.getUserById(pet.owner_user_id);

      if (userError || !user) {
        console.error("User fetch error:", userError);
        return { owner: null, error: "Owner not found" };
      }

      // Get contact preferences for this pet
      const { data: contactPrefs } = await this.supabase
        .from("contact_prefs")
        .select("*")
        .eq("pet_id", petId)
        .single();

      // Format owner data
      const owner: Owner = {
        id: user.user.id,
        name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || "Pet Owner",
        email: contactPrefs?.show_email ? user.user.email : null,
        phone: contactPrefs?.show_phone ? user.user.phone : null,
        photo_url: user.user.user_metadata?.avatar_url || "/dog.png",
        pet_id: petId
      };

      return { owner, error: null };
    } catch (error) {
      console.error("Owner fetch error:", error);
      return { owner: null, error: "Failed to fetch owner information" };
    }
  }

  /**
   * Get contact preferences for a pet
   */
  async getContactPreferences(petId: string): Promise<{ preferences: ContactPreferences | null; error: string | null }> {
    try {
      const { data: preferences, error } = await this.supabase
        .from("contact_prefs")
        .select("*")
        .eq("pet_id", petId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found - this is okay
          return { preferences: null, error: null };
        }
        console.error("Contact preferences fetch error:", error);
        return { preferences: null, error: error.message };
      }

      return { preferences, error: null };
    } catch (error) {
      console.error("Contact preferences fetch error:", error);
      return { preferences: null, error: "Failed to fetch contact preferences" };
    }
  }

  /**
   * Create contact preferences for a pet
   */
  async createContactPreferences(data: ContactPreferencesCreateData): Promise<{ preferences: ContactPreferences | null; error: string | null }> {
    try {
      const { data: preferences, error } = await this.supabase
        .from("contact_prefs")
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error("Contact preferences creation error:", error);
        return { preferences: null, error: error.message };
      }

      return { preferences, error: null };
    } catch (error) {
      console.error("Contact preferences creation error:", error);
      return { preferences: null, error: "Failed to create contact preferences" };
    }
  }

  /**
   * Update contact preferences for a pet
   */
  async updateContactPreferences(petId: string, data: ContactPreferencesUpdateData): Promise<{ preferences: ContactPreferences | null; error: string | null }> {
    try {
      const { data: preferences, error } = await this.supabase
        .from("contact_prefs")
        .update(data)
        .eq("pet_id", petId)
        .select()
        .single();

      if (error) {
        console.error("Contact preferences update error:", error);
        return { preferences: null, error: error.message };
      }

      return { preferences, error: null };
    } catch (error) {
      console.error("Contact preferences update error:", error);
      return { preferences: null, error: "Failed to update contact preferences" };
    }
  }

  /**
   * Delete contact preferences for a pet
   */
  async deleteContactPreferences(petId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("contact_prefs")
        .delete()
        .eq("pet_id", petId);

      if (error) {
        console.error("Contact preferences deletion error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Contact preferences deletion error:", error);
      return { success: false, error: "Failed to delete contact preferences" };
    }
  }
}
