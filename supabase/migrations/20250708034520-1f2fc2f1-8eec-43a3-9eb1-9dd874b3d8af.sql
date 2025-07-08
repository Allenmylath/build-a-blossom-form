
-- Update the RLS policy to allow anonymous users to submit to public forms
-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can submit to any form" ON public.form_submissions;

-- Keep the existing policy for public forms (this one is correct)
-- "Anyone can submit to public forms" already exists and should work

-- Let's also ensure we have the right policy for public form access
-- Update the policy to be more explicit about public form submissions
DROP POLICY IF EXISTS "Anyone can submit to public forms" ON public.form_submissions;

-- Create a new policy that explicitly allows both authenticated and anonymous users to submit to public forms
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

-- Also allow authenticated users to submit to any form (including their own private forms)
CREATE POLICY "Authenticated users can submit to any form" 
ON public.form_submissions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
