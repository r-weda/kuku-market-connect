
-- Drop the security definer view - use RPC instead
DROP VIEW IF EXISTS public.seller_public_profiles;

-- Create a safe function to get seller public info (no phone)
CREATE OR REPLACE FUNCTION public.get_seller_public_info(seller_ids uuid[])
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  location text,
  county text,
  avatar_url text,
  rating numeric,
  total_sales integer,
  is_seller boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.full_name, p.location, p.county, p.avatar_url, p.rating, p.total_sales, p.is_seller, p.created_at
  FROM profiles p
  WHERE p.id = ANY(seller_ids) AND p.is_seller = true;
$$;
