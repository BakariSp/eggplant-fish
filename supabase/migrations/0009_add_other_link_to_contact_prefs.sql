-- Add other_link field to contact_prefs table
ALTER TABLE public.contact_prefs 
ADD COLUMN other_link text;

-- Add comment to explain the field
COMMENT ON COLUMN public.contact_prefs.other_link IS 'Emergency doctor or other contact information';
