-- Add title column to pet_posts table
ALTER TABLE public.pet_posts ADD COLUMN title text;

-- Add comment to document the field
COMMENT ON COLUMN public.pet_posts.title IS 'Optional title for the post';
