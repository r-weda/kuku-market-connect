import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useApp();
  const { user } = useAuth();
  const { subtotal, platformFee, total } = getCartTotal();
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating_orders' | 'stk_sent' | 'confirming'>('idle');

  if (cart.length === 0 && !success) {
    navigate('/cart');
    return null;
  }

  const handlePayment = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!user) {
      toast.error('Please login to complete your purchase');
      navigate('/auth');
      return;
    }

    setProcessing(true);
    setPaymentStatus('creating_orders');

    try {
      // 1. Create orders server-side with validated pricing
      const orderIds: string[] = [];
      let serverTotal = 0;

      for (const item of cart) {
        const { data, error } = await supabase.rpc('create_pending_order', {
          p_listing_id: item.listing.id,
          p_quantity: item.quantity,
        });

        if (error) {
          throw new Error(error.message);
        }

        const result = data as unknown as { order_id: string; amount_due: number };
        orderIds.push(result.order_id);
        serverTotal += result.amount_due;
      }

      // 2. Initiate M-Pesa STK Push
      setPaymentStatus('stk_sent');
      const { data: stkData, error: stkError } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone,
          amount: serverTotal,
          orderIds,
          accountReference: 'KukuMarket',
        },
      });

      if (stkError) {
        throw new Error(stkError.message);
      }

      if (!stkData?.success) {
        throw new Error(stkData?.error || 'Payment initiation failed');
      }

      setPaymentStatus('confirming');
      toast.info(stkData.demo ? 'Check your phone for M-Pesa prompt (demo mode)' : 'Check your phone for M-Pesa prompt');

      // 3. Poll for payment confirmation
      const maxAttempts = stkData.demo ? 3 : 30;
      const pollInterval = stkData.demo ? 1500 : 2000;
      let paid = false;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const { data: orders } = await supabase
          .from('orders')
          .select('status')
          .in('id', orderIds);

        if (orders && orders.every((o) => o.status === 'paid')) {
          paid = true;
          break;
        }
      }

      if (!paid && stkData.demo) {
        // In demo mode, simulate payment confirmation via edge function
        // The demo STK push already handles this
        paid = true;
      }

      if (paid) {
        clearCart();
        setSuccess(true);
        toast.success('Payment successful!');
      } else {
        toast.info('Payment is still processing. Check your orders page for updates.');
        clearCart();
        navigate('/profile');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast.error(errorMessage);
      setPaymentStatus('idle');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentButtonText = () => {
    if (paymentStatus === 'creating_orders') return 'Creating order...';
    if (paymentStatus === 'stk_sent') return 'Sending STK Push...';
    if (paymentStatus === 'confirming') return 'Waiting for confirmation...';
    return `Pay KES ${total.toLocaleString()}`;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-success" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-center"
        >
          Payment Successful!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-center mt-2"
        >
          Your order has been placed. The seller will contact you shortly.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 mt-8"
        >
          <Button variant="outline" onClick={() => navigate('/profile')}>
            View Orders
          </Button>
          <Button onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 max-w-4xl mx-auto">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Checkout</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Order Summary */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-semibold mb-3">Order Summary</h2>
          {cart.map((item) => (
            <div key={item.listing.id} className="flex justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-sm">{item.listing.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} x KES {item.listing.pricePerUnit.toLocaleString()}
                </p>
              </div>
              <p className="font-medium">
                KES {(item.quantity * item.listing.pricePerUnit).toLocaleString()}
              </p>
            </div>
          ))}
          
          <div className="mt-4 pt-3 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee (2.5%)</span>
              <span>KES {platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">KES {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* M-Pesa Payment */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#4CAF50] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h2 className="font-semibold">Pay with M-Pesa</h2>
              <p className="text-xs text-muted-foreground">Enter your Safaricom number</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You will receive an STK push to complete the payment
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            By completing this purchase, you agree to our terms of service. 
            The 2.5% platform fee helps us maintain the marketplace and protect both buyers and sellers.
          </p>
        </div>
      </div>

      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 safe-bottom">
        <div className="max-w-4xl mx-auto">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {getPaymentButtonText()}
              </>
            ) : (
              getPaymentButtonText()
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
