import { motion } from 'framer-motion';
import { MapPin, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Listing } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ListingCardProps {
  listing: Listing;
  index?: number;
}

export function ListingCard({ listing, index = 0 }: ListingCardProps) {
  const timeAgo = formatDistanceToNow(new Date(listing.postedAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/listing/${listing.id}`} className="block">
        <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow active:scale-[0.98]">
          <div className="aspect-[4/3] relative bg-muted">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            {listing.isNegotiable && (
              <span className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs font-medium px-2 py-1 rounded-full">
                Negotiable
              </span>
            )}
          </div>
          
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {listing.title}
              </h3>
            </div>
            
            <p className="text-lg font-bold text-primary mt-1">
              KES {listing.pricePerUnit.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground">/bird</span>
            </p>
            
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{listing.location}</span>
            </div>
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-secondary text-secondary" />
                <span>{listing.seller.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
