import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle, Loader2, Phone } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface WalletData {
  id: string;
  available_balance: number;
  pending_balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string | null;
  description: string | null;
  created_at: string;
}

const PLATFORM_FEE_RATE = 0.025;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
};

const typeLabels: Record<string, string> = {
  sale: 'Sale',
  withdrawal: 'Withdrawal',
  refund: 'Refund',
  fee: 'Platform Fee',
};

export default function WalletPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    fetchWalletData();

    // Realtime subscription
    const channel = supabase
      .channel('wallet-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `profile_id=eq.${profile.id}` }, () => {
        fetchWalletData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, () => {
        fetchWalletData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, profile]);

  const fetchWalletData = async () => {
    if (!profile) return;

    // Get or create wallet
    let { data: walletData, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!walletData && !error) {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ profile_id: profile.id })
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        setLoading(false);
        return;
      }
      walletData = newWallet;
    }

    if (walletData) {
      setWallet(walletData);

      // Fetch transactions
      const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(txns || []);
    }

    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!wallet || !withdrawPhone || !withdrawAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (amount > wallet.available_balance) {
      toast.error('Insufficient balance');
      return;
    }

    setWithdrawing(true);
    try {
      // Use server-side function for atomic withdrawal with validation
      const { data, error: rpcError } = await supabase.rpc('process_withdrawal', {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_phone: withdrawPhone,
      });

      if (rpcError) throw rpcError;

      toast.success('Withdrawal initiated. You will receive M-Pesa shortly.');
      setWithdrawOpen(false);
      setWithdrawPhone('');
      setWithdrawAmount('');
      await fetchWalletData();
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error('Withdrawal failed. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sign in to access your wallet</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Wallet</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-2xl p-6 text-primary-foreground"
        >
          <p className="text-sm opacity-80">Available Balance</p>
          <p className="text-3xl font-bold mt-1">
            KES {(wallet?.available_balance ?? 0).toLocaleString()}
          </p>

          <div className="flex items-center justify-between mt-6">
            <div>
              <p className="text-xs opacity-70">Pending</p>
              <p className="text-lg font-semibold">
                KES {(wallet?.pending_balance ?? 0).toLocaleString()}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWithdrawOpen(true)}
              disabled={!wallet || wallet.available_balance <= 0}
            >
              Withdraw to M-Pesa
            </Button>
          </div>
        </motion.div>

        {/* Platform Fee Info */}
        <div className="bg-muted rounded-xl p-3">
          <p className="text-xs text-muted-foreground">
            A {PLATFORM_FEE_RATE * 100}% platform fee is automatically deducted from each sale.
          </p>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Transaction History</h2>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn, index) => {
                const config = statusConfig[txn.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const isCredit = txn.amount > 0;

                return (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-card rounded-xl p-4 border border-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">
                            {typeLabels[txn.type] || txn.type}
                          </p>
                          {txn.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {txn.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(txn.created_at), 'MMM d, yyyy · h:mm a')}
                          </p>
                          {txn.reference && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Ref: {txn.reference}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : ''}KES {Math.abs(txn.amount).toLocaleString()}
                        </p>
                        <Badge variant={config.variant} className="mt-1 text-[10px]">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Withdraw to M-Pesa</DialogTitle>
            <DialogDescription>
              Enter your M-Pesa number and amount to withdraw.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="withdraw-phone">M-Pesa Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="withdraw-phone"
                  type="tel"
                  placeholder="0712345678"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="withdraw-amount">Amount (KES)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={wallet?.available_balance ?? 0}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: KES {(wallet?.available_balance ?? 0).toLocaleString()}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
