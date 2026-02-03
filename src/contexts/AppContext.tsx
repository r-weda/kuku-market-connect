import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Listing, Order, Conversation } from '@/types';
import { mockListings, mockConversations, mockOrders, currentUser } from '@/data/mockData';

interface AppContextType {
  listings: Listing[];
  cart: CartItem[];
  orders: Order[];
  conversations: Conversation[];
  addToCart: (listing: Listing, quantity: number) => void;
  removeFromCart: (listingId: string) => void;
  updateCartQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  createOrder: (cartItems: CartItem[]) => Order;
  addListing: (listing: Omit<Listing, 'id' | 'sellerId' | 'seller' | 'postedAt' | 'status'>) => void;
  getCartTotal: () => { subtotal: number; platformFee: number; total: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [conversations] = useState<Conversation[]>(mockConversations);

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
    const platformFee = Math.round(subtotal * 0.05);
    return { subtotal, platformFee, total: subtotal + platformFee };
  };

  const createOrder = (cartItems: CartItem[]): Order => {
    const item = cartItems[0];
    const subtotal = item.listing.pricePerUnit * item.quantity;
    const platformFee = Math.round(subtotal * 0.05);
    
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

  const addListing = (listingData: Omit<Listing, 'id' | 'sellerId' | 'seller' | 'postedAt' | 'status'>) => {
    const newListing: Listing = {
      ...listingData,
      id: `listing-${Date.now()}`,
      sellerId: currentUser.id,
      seller: currentUser,
      postedAt: new Date().toISOString(),
      status: 'active',
    };
    setListings((prev) => [newListing, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        listings,
        cart,
        orders,
        conversations,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        createOrder,
        addListing,
        getCartTotal,
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
