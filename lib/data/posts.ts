import { SupabaseClient } from "@supabase/supabase-js";

// Types for post data
export interface Post {
  id: string;
  title?: string;
  content: string;
  images?: string[];
  pet_id: string;
  created_at: string;
}

export interface PostWithExtras extends Post {
  title: string;
  author_name: string;
  tags: string[];
}

export interface PostCreateData {
  content: string;
  images?: string[];
  pet_id: string;
}

export interface PostUpdateData {
  content?: string;
  images?: string[];
}

/**
 * Data access layer for pet posts
 * All database operations related to pet posts should go through these functions
 */
export class PostsDataAccess {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all posts for a specific pet
   */
  async getPostsByPetId(petId: string): Promise<{ posts: PostWithExtras[]; error: string | null }> {
    try {
      const { data: posts, error: postsError } = await this.supabase
        .from("pet_posts")
        .select(`
          id,
          title,
          content,
          images,
          created_at
        `)
        .eq("pet_id", petId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Posts fetch error:", postsError);
        
        // Return empty array if no posts found, rather than error
        if (postsError.code === 'PGRST116') {
          return { posts: [], error: null };
        }
        
        return { posts: [], error: postsError.message };
      }

      // Format posts to match expected structure
      const formattedPosts: PostWithExtras[] = posts?.map(post => ({
        ...post,
        pet_id: petId, // Add pet_id for compatibility
        title: (post as { title?: string }).title ?? "Untitled Post",
        author_name: "Pet Owner",
        tags: []
      })) || [];

      return { posts: formattedPosts, error: null };
    } catch (error) {
      console.error("Posts fetch error:", error);
      return { posts: [], error: "Failed to fetch posts" };
    }
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: string): Promise<{ post: Post | null; error: string | null }> {
    try {
      const { data: post, error } = await this.supabase
        .from("pet_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Post fetch error:", error);
        return { post: null, error: error.message };
      }

      return { post, error: null };
    } catch (error) {
      console.error("Post fetch error:", error);
      return { post: null, error: "Failed to fetch post" };
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: PostCreateData): Promise<{ post: Post | null; error: string | null }> {
    try {
      const { data: post, error } = await this.supabase
        .from("pet_posts")
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error("Post creation error:", error);
        return { post: null, error: error.message };
      }

      return { post, error: null };
    } catch (error) {
      console.error("Post creation error:", error);
      return { post: null, error: "Failed to create post" };
    }
  }

  /**
   * Update a post
   */
  async updatePost(id: string, postData: PostUpdateData): Promise<{ post: Post | null; error: string | null }> {
    try {
      const { data: post, error } = await this.supabase
        .from("pet_posts")
        .update(postData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Post update error:", error);
        return { post: null, error: error.message };
      }

      return { post, error: null };
    } catch (error) {
      console.error("Post update error:", error);
      return { post: null, error: "Failed to update post" };
    }
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("pet_posts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Post deletion error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Post deletion error:", error);
      return { success: false, error: "Failed to delete post" };
    }
  }

  /**
   * Get recent posts across all pets (for admin or general viewing)
   */
  async getRecentPosts(limit = 10): Promise<{ posts: Post[]; error: string | null }> {
    try {
      const { data: posts, error } = await this.supabase
        .from("pet_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Recent posts fetch error:", error);
        return { posts: [], error: error.message };
      }

      return { posts: posts || [], error: null };
    } catch (error) {
      console.error("Recent posts fetch error:", error);
      return { posts: [], error: "Failed to fetch recent posts" };
    }
  }
}
