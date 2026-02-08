import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders } = useApp();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success';
      case 'paid': return 'bg-primary/10 text-primary';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-4xl mx-auto">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">My Orders</h1>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-muted-foreground text-center">No orders yet</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Order #{order.id.slice(-6)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.createdAt), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="flex gap-3">
                <img
                  src={order.listing.images[0]}
                  alt={order.listing.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{order.listing.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.quantity} x KES {order.unitPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seller: {order.seller.name}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>KES {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span>KES {order.platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">KES {order.total.toLocaleString()}</span>
                </div>
                {order.mpesaRef && (
                  <p className="text-xs text-muted-foreground mt-2">
                    M-Pesa Ref: {order.mpesaRef}
                  </p>
                )}
              </div>

              {order.status === 'paid' && (
                <div className="mt-4">
                  <Button size="sm" className="w-full">
                    Track Order
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
