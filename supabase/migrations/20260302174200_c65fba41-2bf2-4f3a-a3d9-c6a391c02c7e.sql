
-- Fix 1: Restrict profiles SELECT policy (was open to everyone)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can view seller profiles (for listing pages)
CREATE POLICY "Authenticated users can view seller profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_seller = true);

-- Fix 3: Add balance constraints to wallets
ALTER TABLE public.wallets
ADD CONSTRAINT positive_available_balance CHECK (available_balance >= 0);

ALTER TABLE public.wallets
ADD CONSTRAINT positive_pending_balance CHECK (pending_balance >= 0);

-- Create server-side withdrawal function
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_wallet_id uuid,
  p_amount integer,
  p_phone text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_profile_id uuid;
  v_user_id uuid;
  v_transaction_id uuid;
BEGIN
  -- Validate amount
  IF p_amount <= 0 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Invalid withdrawal amount';
  END IF;

  -- Validate phone format
  IF p_phone IS NULL OR length(p_phone) < 9 THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;

  -- Verify wallet belongs to calling user
  SELECT w.profile_id INTO v_profile_id
  FROM wallets w WHERE w.id = p_wallet_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  SELECT p.user_id INTO v_user_id
  FROM profiles p WHERE p.id = v_profile_id;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock wallet row and check balance
  SELECT available_balance INTO v_balance
  FROM wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Update balance atomically
  UPDATE wallets
  SET available_balance = available_balance - p_amount
  WHERE id = p_wallet_id;

  -- Create transaction record
  INSERT INTO wallet_transactions (wallet_id, amount, type, status, description, reference)
  VALUES (p_wallet_id, -p_amount, 'withdrawal', 'pending',
          'Withdraw to M-Pesa ' || p_phone, 'WD-' || extract(epoch from now())::text)
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$;
