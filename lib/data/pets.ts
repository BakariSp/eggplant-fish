import { SupabaseClient } from "@supabase/supabase-js";

// Types for pet data
export interface Pet {
  id: string;
  name: string;
  breed?: string;
  birthdate?: string;
  avatar_url?: string;
  vaccinated?: boolean;
  allergy_note?: string;
  lost_mode?: boolean;
  slug: string;
  owner_user_id: string;
  created_at: string;
}

export interface PetCreateData {
  name: string;
  breed?: string;
  birthdate?: string;
  avatar_url?: string;
  vaccinated?: boolean;
  allergy_note?: string;
  slug: string;
  owner_user_id: string;
}

export interface PetUpdateData {
  name?: string;
  breed?: string;
  birthdate?: string;
  avatar_url?: string;
  vaccinated?: boolean;
  allergy_note?: string;
  lost_mode?: boolean;
}

export interface PetWithDetails extends Pet {
  pet_id: string; // For compatibility with existing components
  vaccinations: string[];
  allergies: string[];
  microchip_id: string;
  neuter_status: boolean;
  gender: string;
  traits: string[];
  contact_prefs?: any;
}

/**
 * Data access layer for pets
 * All database operations related to pets should go through these functions
 */
export class PetsDataAccess {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all pets (respects RLS policies)
   */
  async getAllPets(limit = 10): Promise<{ pets: Pet[]; error: string | null }> {
    try {
      const { data: pets, error } = await this.supabase
        .from("pets")
        .select("id, name, slug, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Pets fetch error:", error);
        return { pets: [], error: error.message };
      }

      return { pets: pets || [], error: null };
    } catch (error) {
      console.error("Pets fetch error:", error);
      return { pets: [], error: "Failed to fetch pets" };
    }
  }

  /**
   * Get the first pet (for easy access)
   */
  async getFirstPet(): Promise<{ pet: Pet | null; error: string | null }> {
    try {
      const { data: pet, error } = await this.supabase
        .from("pets")
        .select("id, name, slug")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return { pet: null, error: error.message };
      }

      return { pet, error: null };
    } catch (error) {
      console.error("First pet fetch error:", error);
      return { pet: null, error: "Failed to fetch first pet" };
    }
  }

  /**
   * Get a pet by ID with full details including vaccinations and contact preferences
   */
  async getPetById(id: string): Promise<{ pet: PetWithDetails | null; error: string | null }> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return { pet: null, error: "Invalid pet ID format" };
      }

      // Get pet data
      const { data: pet, error: petError } = await this.supabase
        .from("pets")
        .select(`
          id,
          name,
          breed,
          birthdate,
          avatar_url,
          vaccinated,
          allergy_note,
          lost_mode,
          slug,
          owner_user_id,
          created_at
        `)
        .eq("id", id)
        .single();

      if (petError) {
        console.error("Pet fetch error:", petError);
        return { pet: null, error: "Pet not found" };
      }

      // Get vaccinations
      const { data: vaccinations } = await this.supabase
        .from("pet_vaccinations")
        .select("vaccine_name")
        .eq("pet_id", id);

      // Get contact preferences
      const { data: contactPrefs } = await this.supabase
        .from("contact_prefs")
        .select("*")
        .eq("pet_id", id)
        .single();

      // Format the response to match the expected structure
      const formattedPet: PetWithDetails = {
        ...pet,
        pet_id: id, // Add pet_id for compatibility with existing components
        vaccinations: vaccinations?.map(v => v.vaccine_name) || [],
        allergies: pet.allergy_note ? [pet.allergy_note] : [], // Convert allergy_note to array
        microchip_id: "", // TODO: Add microchip_id field to pets table
        neuter_status: false, // TODO: Add proper neuter status field
        gender: "male", // TODO: Add gender field to pets table  
        traits: [], // TODO: Add traits field or separate table
        contact_prefs: contactPrefs
      };

      return { pet: formattedPet, error: null };
    } catch (error) {
      console.error("Pet fetch error:", error);
      return { pet: null, error: "Failed to fetch pet" };
    }
  }

  /**
   * Create a new pet
   */
  async createPet(petData: PetCreateData): Promise<{ pet: Pet | null; error: string | null }> {
    try {
      const { data: pet, error } = await this.supabase
        .from("pets")
        .insert(petData)
        .select()
        .single();

      if (error) {
        console.error("Pet creation error:", error);
        return { pet: null, error: error.message };
      }

      return { pet, error: null };
    } catch (error) {
      console.error("Pet creation error:", error);
      return { pet: null, error: "Failed to create pet" };
    }
  }

  /**
   * Update a pet
   */
  async updatePet(id: string, petData: PetUpdateData): Promise<{ pet: Pet | null; error: string | null }> {
    try {
      const { data: pet, error } = await this.supabase
        .from("pets")
        .update(petData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Pet update error:", error);
        return { pet: null, error: error.message };
      }

      return { pet, error: null };
    } catch (error) {
      console.error("Pet update error:", error);
      return { pet: null, error: "Failed to update pet" };
    }
  }

  /**
   * Delete a pet
   */
  async deletePet(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("pets")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Pet deletion error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Pet deletion error:", error);
      return { success: false, error: "Failed to delete pet" };
    }
  }

  /**
   * Toggle lost mode for a pet
   */
  async toggleLostMode(id: string, lostMode: boolean): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("pets")
        .update({ lost_mode: lostMode })
        .eq("id", id);

      if (error) {
        console.error("Lost mode toggle error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Lost mode toggle error:", error);
      return { success: false, error: "Failed to toggle lost mode" };
    }
  }
}
