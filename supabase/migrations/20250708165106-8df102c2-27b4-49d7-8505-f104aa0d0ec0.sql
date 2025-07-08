-- Fix RLS policies for anonymous form submissions to public forms

-- First, drop existing policies to start clean
DROP POLICY IF EXISTS "Anyone can submit to public forms" ON public.form_submissions;
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Authenticated users can submit to any form" ON public.form_submissions;

-- Create a comprehensive policy that allows anonymous users to submit to public forms
-- This policy applies to all roles (authenticated and anon)
CREATE POLICY "Anyone can submit to public forms" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.forms 
    WHERE forms.id = form_submissions.form_id 
    AND forms.is_public = true
  )
);

-- Create a separate policy for authenticated users to submit to any form
-- This allows authenticated users to submit to both public and private forms
CREATE POLICY "Authenticated users can submit to any form" 
ON public.form_submissions 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow if user owns the form OR if form is public
  EXISTS (
    SELECT 1 
    FROM public.forms 
    WHERE forms.id = form_submissions.form_id 
    AND (forms.user_id = auth.uid() OR forms.is_public = true)
  )
);

-- Ensure the anon role has INSERT permissions on form_submissions
GRANT INSERT ON public.form_submissions TO anon;