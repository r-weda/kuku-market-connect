
-- 1. Force orders to be created with 'pending' status (prevents client setting 'paid')
CREATE OR REPLACE FUNCTION public.enforce_order_pending_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.status := 'pending';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_pending_status
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_pending_status();

-- 2. Server-side order creation with validated pricing
CREATE OR REPLACE FUNCTION public.create_pending_order(
  p_listing_id uuid,
  p_quantity integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing listings%ROWTYPE;
  v_buyer_profile_id uuid;
  v_subtotal integer;
  v_fee integer;
  v_total integer;
  v_order_id uuid;
BEGIN
  -- Get buyer profile
  SELECT id INTO v_buyer_profile_id FROM profiles WHERE user_id = auth.uid();
  IF v_buyer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Get listing with current price from DB
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or inactive';
  END IF;

  -- Prevent buying own listing
  IF v_listing.seller_id = v_buyer_profile_id THEN
    RAISE EXCEPTION 'Cannot buy your own listing';
  END IF;

  -- Validate quantity
  IF p_quantity < COALESCE(v_listing.min_order, 1) THEN
    RAISE EXCEPTION 'Quantity below minimum order';
  END IF;

  IF p_quantity > v_listing.quantity THEN
    RAISE EXCEPTION 'Insufficient inventory';
  END IF;

  -- Server calculates pricing
  v_subtotal := v_listing.price_per_unit * p_quantity;
  v_fee := CEIL(v_subtotal * 0.025);
  v_total := v_subtotal + v_fee;

  -- Create order as pending (trigger also enforces this)
  INSERT INTO orders (
    listing_id, buyer_id, seller_id, quantity,
    unit_price, subtotal, platform_fee, total,
    status, payment_method
  ) VALUES (
    p_listing_id, v_buyer_profile_id, v_listing.seller_id, p_quantity,
    v_listing.price_per_unit, v_subtotal, v_fee, v_total,
    'pending', 'mpesa'
  ) RETURNING id INTO v_order_id;

  RETURN json_build_object(
    'order_id', v_order_id,
    'amount_due', v_total
  );
END;
$$;

-- 3. Replay protection table for M-Pesa callbacks
CREATE TABLE public.mpesa_callbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id text UNIQUE NOT NULL,
  merchant_request_id text,
  result_code integer,
  raw_payload jsonb,
  processed_at timestamptz DEFAULT now()
);

ALTER TABLE public.mpesa_callbacks ENABLE ROW LEVEL SECURITY;

-- 4. Remove broad seller profile exposure, create restricted view
DROP POLICY IF EXISTS "Authenticated users can view seller profiles" ON public.profiles;

CREATE OR REPLACE VIEW public.seller_public_profiles WITH (security_barrier = true) AS
SELECT id, user_id, full_name, location, county, avatar_url, rating, total_sales, is_seller, created_at, updated_at
FROM public.profiles
WHERE is_seller = true;

GRANT SELECT ON public.seller_public_profiles TO anon, authenticated;
