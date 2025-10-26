-- Add expiry_date column to products table
ALTER TABLE public.products 
ADD COLUMN expiry_date DATE;

-- Add index for querying expired products efficiently
CREATE INDEX idx_products_expiry_date ON public.products(expiry_date) WHERE expiry_date IS NOT NULL;