import { z } from "zod";

// Common validation patterns
export const uuidSchema = z.string().uuid("Invalid UUID format");

export const slugSchema = z.string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be less than 50 characters")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

export const emailSchema = z.string().email("Invalid email format");

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional();

// Pet-related schemas
export const petCreateSchema = z.object({
  name: z.string()
    .min(1, "Pet name is required")
    .max(50, "Pet name must be less than 50 characters")
    .trim(),
  
  breed: z.string()
    .max(50, "Breed must be less than 50 characters")
    .trim()
    .optional(),
  
  birthdate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be in YYYY-MM-DD format")
    .refine((date) => {
      const parsedDate = new Date(date);
      const now = new Date();
      return parsedDate <= now;
    }, "Birthdate cannot be in the future")
    .optional(),
  
  avatar_url: z.string()
    .url("Invalid avatar URL")
    .optional(),
  
  vaccinated: z.boolean().default(false),
  
  allergy_note: z.string()
    .max(500, "Allergy note must be less than 500 characters")
    .trim()
    .optional(),
  
  slug: slugSchema,
  
  owner_user_id: uuidSchema
});

export const petUpdateSchema = z.object({
  name: z.string()
    .min(1, "Pet name is required")
    .max(50, "Pet name must be less than 50 characters")
    .trim()
    .optional(),
  
  breed: z.string()
    .max(50, "Breed must be less than 50 characters")
    .trim()
    .optional(),
  
  birthdate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be in YYYY-MM-DD format")
    .refine((date) => {
      const parsedDate = new Date(date);
      const now = new Date();
      return parsedDate <= now;
    }, "Birthdate cannot be in the future")
    .optional(),
  
  avatar_url: z.string()
    .url("Invalid avatar URL")
    .optional(),
  
  vaccinated: z.boolean().optional(),
  
  allergy_note: z.string()
    .max(500, "Allergy note must be less than 500 characters")
    .trim()
    .optional(),
  
  lost_mode: z.boolean().optional()
});

// Post-related schemas
export const postCreateSchema = z.object({
  content: z.string()
    .min(1, "Post content is required")
    .max(2000, "Post content must be less than 2000 characters")
    .trim(),
  
  images: z.array(z.string().url("Invalid image URL"))
    .max(10, "Maximum 10 images allowed")
    .optional(),
  
  pet_id: uuidSchema
});

export const postUpdateSchema = z.object({
  content: z.string()
    .min(1, "Post content is required")
    .max(2000, "Post content must be less than 2000 characters")
    .trim()
    .optional(),
  
  images: z.array(z.string().url("Invalid image URL"))
    .max(10, "Maximum 10 images allowed")
    .optional()
});

// Contact preferences schemas
export const contactPreferencesCreateSchema = z.object({
  pet_id: uuidSchema,
  show_email: z.boolean().default(false),
  show_phone: z.boolean().default(false)
});

export const contactPreferencesUpdateSchema = z.object({
  show_email: z.boolean().optional(),
  show_phone: z.boolean().optional()
});

// Query parameter schemas
export const paginationSchema = z.object({
  limit: z.string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform(Number)
    .refine((n) => n > 0 && n <= 100, "Limit must be between 1 and 100")
    .default("10"),
  
  offset: z.string()
    .regex(/^\d+$/, "Offset must be a number")
    .transform(Number)
    .refine((n) => n >= 0, "Offset must be 0 or greater")
    .default("0")
});

export const petQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string()
    .max(100, "Search term must be less than 100 characters")
    .trim()
    .optional(),
  
  lost_only: z.string()
    .regex(/^(true|false)$/, "lost_only must be true or false")
    .transform((val) => val === "true")
    .optional()
});

// Verification code schema
export const verificationCodeSchema = z.object({
  code: z.string()
    .min(1, "Verification code is required")
    .max(20, "Verification code must be less than 20 characters"),
  
  session: z.any().optional() // Allow any session data structure for flexibility
});

// Lost mode toggle schema
export const lostModeToggleSchema = z.object({
  lost_mode: z.boolean(),
  pet_id: uuidSchema
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: "File is required" })
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine((file) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      return allowedTypes.includes(file.type);
    }, "File must be an image (JPEG, PNG, WebP, or GIF)"),
  
  pet_id: uuidSchema.optional()
});

// Export type inference helpers
export type PetCreateInput = z.infer<typeof petCreateSchema>;
export type PetUpdateInput = z.infer<typeof petUpdateSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
export type ContactPreferencesCreateInput = z.infer<typeof contactPreferencesCreateSchema>;
export type ContactPreferencesUpdateInput = z.infer<typeof contactPreferencesUpdateSchema>;
export type PetQueryInput = z.infer<typeof petQuerySchema>;
export type VerificationCodeInput = z.infer<typeof verificationCodeSchema>;
export type LostModeToggleInput = z.infer<typeof lostModeToggleSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
