import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  MessageCircle, 
  Share2, 
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Phone,
  Calendar
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);

  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Listing not found</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (quantity < listing.minOrder) {
      toast.error(`Minimum order is ${listing.minOrder} birds`);
      return;
    }
    addToCart(listing, quantity);
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    if (quantity < listing.minOrder) {
      toast.error(`Minimum order is ${listing.minOrder} birds`);
      return;
    }
    addToCart(listing, quantity);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-background pb-32 max-w-4xl mx-auto">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/80 backdrop-blur-sm rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm rounded-full"
            onClick={() => {
              navigator.share?.({ url: window.location.href, title: listing.title });
            }}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`bg-background/80 backdrop-blur-sm rounded-full ${liked ? 'text-destructive' : ''}`}
            onClick={() => setLiked(!liked)}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="aspect-square md:aspect-video bg-muted"
      >
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-5 space-y-4"
      >
        {/* Title & Price */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {listing.breed}
            </span>
            {listing.isNegotiable && (
              <span className="text-xs font-medium px-2 py-0.5 bg-secondary/20 text-secondary-foreground rounded-full">
                Negotiable
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">{listing.title}</h1>
          <p className="text-2xl font-bold text-primary mt-1">
            KES {listing.pricePerUnit.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground"> /bird</span>
          </p>
        </div>

        {/* Location & Stock */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{listing.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">{listing.quantity}</span>
            <span>available</span>
          </div>
        </div>

        {/* Description */}
        <div className="py-4 border-y border-border">
          <h2 className="font-semibold mb-2">Description</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Seller Info */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {listing.seller.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{listing.seller.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                  <span>{listing.seller.rating}</span>
                </div>
                <span>•</span>
                <span>{listing.seller.totalSales} sales</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Joined {format(new Date(listing.seller.joinedDate), 'MMM yyyy')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/chat/${listing.id}`)}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button variant="outline" className="flex-1">
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
          </div>
        </div>

        {/* Order Info */}
        <div className="text-sm text-muted-foreground">
          <p>Minimum order: <span className="font-medium text-foreground">{listing.minOrder} birds</span></p>
          <p className="mt-1">Posted {format(new Date(listing.postedAt), 'MMM d, yyyy')}</p>
        </div>
      </motion.div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 safe-bottom">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          {/* Quantity Selector */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add
          </Button>
          <Button
            className="flex-1"
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}
