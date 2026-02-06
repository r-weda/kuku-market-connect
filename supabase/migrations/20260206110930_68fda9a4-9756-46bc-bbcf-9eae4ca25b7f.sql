
-- Create wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id),
  available_balance INTEGER NOT NULL DEFAULT 0,
  pending_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT,
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = wallets.profile_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "System can insert wallets"
  ON public.wallets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = wallets.profile_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "System can update wallets"
  ON public.wallets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = wallets.profile_id AND profiles.user_id = auth.uid()
  ));

-- Wallet transaction policies
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM wallets
    JOIN profiles ON profiles.id = wallets.profile_id
    WHERE wallets.id = wallet_transactions.wallet_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM wallets
    JOIN profiles ON profiles.id = wallets.profile_id
    WHERE wallets.id = wallet_transactions.wallet_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own transactions"
  ON public.wallet_transactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM wallets
    JOIN profiles ON profiles.id = wallets.profile_id
    WHERE wallets.id = wallet_transactions.wallet_id AND profiles.user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_wallet_transactions_updated_at
  BEFORE UPDATE ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for wallet updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
