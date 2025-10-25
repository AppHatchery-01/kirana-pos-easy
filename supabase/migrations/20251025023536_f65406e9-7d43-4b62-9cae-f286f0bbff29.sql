-- Fix RLS policy for stores table to allow admin inserts
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;

CREATE POLICY "Admins can manage all stores" 
ON public.stores 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));