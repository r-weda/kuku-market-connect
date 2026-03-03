import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Listing, Order } from '@/types';
import { mockOrders, currentUser } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';

interface AppContextType {
  listings: Listing[];
  cart: CartItem[];
  orders: Order[];
  loadingListings: boolean;
  addToCart: (listing: Listing, quantity: number) => void;
  removeFromCart: (listingId: string) => void;
  updateCartQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  createOrder: (cartItems: CartItem[]) => Order;
  addListing: (listing: Omit<Listing, 'id' | 'sellerId' | 'seller' | 'postedAt' | 'status'>, sellerId: string) => Promise<{ error: Error | null }>;
  getCartTotal: () => { subtotal: number; platformFee: number; total: number };
  refreshListings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kuku-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  

  const fetchListings = async () => {
    setLoadingListings(true);
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        seller:profiles!listings_seller_id_fkey (
          id,
          user_id,
          full_name,
          phone,
          location,
          county,
          avatar_url,
          rating,
          total_sales,
          is_seller,
          created_at
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      setLoadingListings(false);
      return;
    }

    // Transform database format to app format
    const transformedListings: Listing[] = (data || []).map((item) => ({
      id: item.id,
      sellerId: item.seller_id,
      seller: item.seller ? {
        id: item.seller.id,
        name: item.seller.full_name,
        phone: item.seller.phone,
        location: item.seller.location || '',
        avatar: item.seller.avatar_url || '/placeholder.svg',
        rating: Number(item.seller.rating) || 0,
        totalSales: item.seller.total_sales || 0,
        joinedDate: item.seller.created_at || new Date().toISOString(),
      } : currentUser,
      title: item.title,
      description: item.description || '',
      breed: item.breed,
      pricePerUnit: item.price_per_unit,
      quantity: item.quantity,
      minOrder: item.min_order || 1,
      images: item.images || ['/placeholder.svg'],
      location: item.location,
      county: item.county,
      postedAt: item.created_at,
      status: item.status as 'active' | 'sold' | 'expired',
      isNegotiable: item.is_negotiable || false,
    }));

    setListings(transformedListings);
    setLoadingListings(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    localStorage.setItem('kuku-cart', JSON.stringify(cart));
  }, [cart]);

  const refreshListings = async () => {
    await fetchListings();
  };

  const addToCart = (listing: Listing, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.listing.id === listing.id);
      if (existing) {
        return prev.map((item) =>
          item.listing.id === listing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { listing, quantity }];
    });
  };

  const removeFromCart = (listingId: string) => {
    setCart((prev) => prev.filter((item) => item.listing.id !== listingId));
  };

  const updateCartQuantity = (listingId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.listing.id === listingId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.listing.pricePerUnit * item.quantity,
      0
    );
    const platformFee = Math.round(subtotal * 0.025);
    return { subtotal, platformFee, total: subtotal + platformFee };
  };

  const createOrder = (cartItems: CartItem[]): Order => {
    const item = cartItems[0];
    const subtotal = item.listing.pricePerUnit * item.quantity;
    const platformFee = Math.round(subtotal * 0.025);
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      listing: item.listing,
      buyer: currentUser,
      seller: item.listing.seller,
      quantity: item.quantity,
      unitPrice: item.listing.pricePerUnit,
      subtotal,
      platformFee,
      total: subtotal + platformFee,
      status: 'pending',
      paymentMethod: 'mpesa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const addListing = async (
    listingData: Omit<Listing, 'id' | 'sellerId' | 'seller' | 'postedAt' | 'status'>,
    sellerId: string
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from('listings')
      .insert({
        seller_id: sellerId,
        title: listingData.title,
        description: listingData.description || null,
        breed: listingData.breed,
        price_per_unit: listingData.pricePerUnit,
        quantity: listingData.quantity,
        min_order: listingData.minOrder || 1,
        images: listingData.images.length > 0 ? listingData.images : null,
        location: listingData.location,
        county: listingData.county,
        is_negotiable: listingData.isNegotiable,
        status: 'active',
      });

    if (error) {
      console.error('Error creating listing:', error);
      return { error };
    }

    // Refresh listings to include the new one
    await fetchListings();
    return { error: null };
  };

  return (
    <AppContext.Provider
      value={{
        listings,
        cart,
        orders,
        loadingListings,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        createOrder,
        addListing,
        getCartTotal,
        refreshListings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
