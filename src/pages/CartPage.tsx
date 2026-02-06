import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Minus, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity, getCartTotal } = useApp();
  const { subtotal, platformFee, total } = getCartTotal();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Cart</h1>
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-muted-foreground">Your cart is empty</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Browse Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-48">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Cart ({cart.length})</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {cart.map((item, index) => (
          <motion.div
            key={item.listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex gap-3">
              <img
                src={item.listing.images[0]}
                alt={item.listing.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{item.listing.title}</h3>
                <p className="text-sm text-muted-foreground">{item.listing.breed}</p>
                <p className="text-primary font-bold mt-1">
                  KES {item.listing.pricePerUnit.toLocaleString()}/bird
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive shrink-0"
                onClick={() => removeFromCart(item.listing.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateCartQuantity(
                    item.listing.id, 
                    Math.max(item.listing.minOrder, item.quantity - 1)
                  )}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateCartQuantity(
                    item.listing.id, 
                    Math.min(item.listing.quantity, item.quantity + 1)
                  )}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="font-bold">
                KES {(item.listing.pricePerUnit * item.quantity).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary & Checkout */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom">
        <div className="p-4 space-y-3">
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
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
