import { Listing } from '@/types';
import { ListingCard } from './ListingCard';

interface ListingGridProps {
  listings: Listing[];
  emptyMessage?: string;
}

export function ListingGrid({ listings, emptyMessage = 'No listings found' }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-muted-foreground text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 p-4">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id} listing={listing} index={index} />
      ))}
    </div>
  );
}
