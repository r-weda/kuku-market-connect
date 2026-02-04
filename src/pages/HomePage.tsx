import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Bell, ChevronDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { useApp } from '@/contexts/AppContext';
import { COUNTIES, BREEDS } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function HomePage() {
  const { listings, cart, loadingListings } = useApp();
  const [selectedCounty, setSelectedCounty] = useState<string>('All');
  const [selectedBreed, setSelectedBreed] = useState<string>('All');

  const filteredListings = listings.filter((listing) => {
    const countyMatch = selectedCounty === 'All' || listing.county === selectedCounty;
    const breedMatch = selectedBreed === 'All' || listing.breed === selectedBreed;
    return countyMatch && breedMatch && listing.status === 'active';
  });

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-primary">Kuku Market</h1>
            <p className="text-xs text-muted-foreground">Live Poultry Marketplace</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                    {cart.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                {selectedCounty === 'All' ? 'Location' : selectedCounty}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSelectedCounty('All')}>
                All Counties
              </DropdownMenuItem>
              {COUNTIES.map((county) => (
                <DropdownMenuItem key={county} onClick={() => setSelectedCounty(county)}>
                  {county}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                {selectedBreed === 'All' ? 'Breed' : selectedBreed}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSelectedBreed('All')}>
                All Breeds
              </DropdownMenuItem>
              {BREEDS.map((breed) => (
                <DropdownMenuItem key={breed} onClick={() => setSelectedBreed(breed)}>
                  {breed}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Listings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {loadingListings ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ListingGrid
            listings={filteredListings}
            emptyMessage="No chickens available in this area"
          />
        )}
      </motion.div>
    </AppLayout>
  );
}
