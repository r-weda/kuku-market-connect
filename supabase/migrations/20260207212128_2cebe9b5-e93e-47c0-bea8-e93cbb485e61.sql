
-- Database function to credit seller wallet when order is paid
-- Creates wallet if needed, adds pending balance, and logs transactions
CREATE OR REPLACE FUNCTION public.credit_seller_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_profile_id uuid;
  seller_wallet_id uuid;
  fee_amount integer;
  net_amount integer;
  fee_rate numeric := 0.025;
BEGIN
  -- Only trigger when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    seller_profile_id := NEW.seller_id;

    -- Calculate fee and net
    fee_amount := CEIL(NEW.subtotal * fee_rate);
    net_amount := NEW.subtotal - fee_amount;

    -- Get or create wallet
    SELECT id INTO seller_wallet_id FROM wallets WHERE profile_id = seller_profile_id;
    IF seller_wallet_id IS NULL THEN
      INSERT INTO wallets (profile_id) VALUES (seller_profile_id) RETURNING id INTO seller_wallet_id;
    END IF;

    -- Add to pending balance
    UPDATE wallets SET pending_balance = pending_balance + net_amount WHERE id = seller_wallet_id;

    -- Create sale transaction
    INSERT INTO wallet_transactions (wallet_id, amount, type, status, description, reference, order_id)
    VALUES (seller_wallet_id, net_amount, 'sale', 'pending', 
            'Sale of ' || NEW.quantity || ' units', NEW.mpesa_ref, NEW.id);

    -- Create fee transaction (negative, completed immediately)
    INSERT INTO wallet_transactions (wallet_id, amount, type, status, description, order_id)
    VALUES (seller_wallet_id, -fee_amount, 'fee', 'completed',
            'Platform fee (2.5%)', NEW.id);
  END IF;

  -- When order is completed, move pending to available
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    seller_profile_id := NEW.seller_id;

    fee_amount := CEIL(NEW.subtotal * 0.025);
    net_amount := NEW.subtotal - fee_amount;

    SELECT id INTO seller_wallet_id FROM wallets WHERE profile_id = seller_profile_id;
    IF seller_wallet_id IS NOT NULL THEN
      UPDATE wallets SET 
        pending_balance = GREATEST(pending_balance - net_amount, 0),
        available_balance = available_balance + net_amount
      WHERE id = seller_wallet_id;

      -- Update transaction status
      UPDATE wallet_transactions SET status = 'completed' 
      WHERE order_id = NEW.id AND type = 'sale';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
CREATE TRIGGER on_order_payment
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.credit_seller_on_payment();

-- Also trigger on insert (for orders created directly as 'paid')
CREATE TRIGGER on_order_insert_payment
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.credit_seller_on_payment();
