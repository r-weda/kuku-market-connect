import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  Package, 
  Settings, 
  HelpCircle, 
  LogOut,
  Star,
  MapPin,
  LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { orders } = useApp();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Show login prompt if not authenticated
  if (!loading && !user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sign in to continue</h2>
          <p className="text-muted-foreground text-center mb-6">
            Create an account to buy & sell chickens on Kuku Market
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Sign In / Sign Up
          </Button>
        </div>
      </AppLayout>
    );
  }

  const menuItems = [
    { icon: Package, label: 'My Orders', count: orders.length, action: () => navigate('/orders') },
    { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/help') },
  ];

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{profile?.full_name || 'User'}</h1>
              {profile?.location && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                <span>{profile?.rating || 0} rating</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{profile?.total_sales || 0}</p>
              <p className="text-xs text-muted-foreground">Total Sales</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
          </div>
        </motion.div>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/50 active:bg-muted transition-colors border-b border-border last:border-0"
              onClick={item.action}
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="w-6 h-6 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                  {item.count}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Recent Orders Preview */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Recent Orders</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                View all
              </Button>
            </div>
            
            <div className="space-y-3">
              {orders.slice(0, 2).map((order) => (
                <div
                  key={order.id}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={order.listing.images[0]}
                      alt={order.listing.title}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.listing.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.quantity} birds • {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          order.status === 'completed' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="font-bold text-sm">
                          KES {order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Logout */}
        <Button variant="outline" className="w-full" size="lg" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
