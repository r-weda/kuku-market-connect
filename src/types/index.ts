export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  location: string;
  rating: number;
  totalSales: number;
  joinedDate: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  seller: User;
  title: string;
  description: string;
  breed: string;
  pricePerUnit: number;
  quantity: number;
  minOrder: number;
  images: string[];
  location: string;
  county: string;
  isNegotiable: boolean;
  postedAt: string;
  status: 'active' | 'sold' | 'paused' | 'expired';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  listingId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  listing: Listing;
  otherUser: User;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface CartItem {
  listing: Listing;
  quantity: number;
}

export interface Order {
  id: string;
  listing: Listing;
  buyer: User;
  seller: User;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  platformFee: number;
  total: number;
  status: 'pending' | 'paid' | 'confirmed' | 'in_transit' | 'completed' | 'cancelled';
  paymentMethod: 'mpesa';
  mpesaRef?: string;
  createdAt: string;
  updatedAt: string;
}

export type County = 
  | 'Nairobi'
  | 'Kiambu'
  | 'Machakos'
  | 'Kajiado'
  | 'Nakuru'
  | 'Mombasa'
  | 'Kisumu'
  | 'Uasin Gishu'
  | 'Nyeri'
  | 'Muranga';

export const COUNTIES: County[] = [
  'Nairobi',
  'Kiambu',
  'Machakos',
  'Kajiado',
  'Nakuru',
  'Mombasa',
  'Kisumu',
  'Uasin Gishu',
  'Nyeri',
  'Muranga',
];

export const BREEDS = [
  'Kienyeji',
  'Kuroiler',
  'KARI Improved',
  'Rainbow Rooster',
  'Sasso',
  'Kenbro',
  'Layer',
  'Broiler',
];
