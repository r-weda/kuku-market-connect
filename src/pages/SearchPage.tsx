import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { useApp } from '@/contexts/AppContext';
import { COUNTIES, BREEDS } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function SearchPage() {
  const { listings } = useApp();
  const [query, setQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string>('All');
  const [selectedBreed, setSelectedBreed] = useState<string>('All');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const searchMatch = 
        listing.title.toLowerCase().includes(query.toLowerCase()) ||
        listing.breed.toLowerCase().includes(query.toLowerCase()) ||
        listing.location.toLowerCase().includes(query.toLowerCase());
      const countyMatch = selectedCounty === 'All' || listing.county === selectedCounty;
      const breedMatch = selectedBreed === 'All' || listing.breed === selectedBreed;
      const priceMatch = 
        listing.pricePerUnit >= priceRange[0] && listing.pricePerUnit <= priceRange[1];
      return searchMatch && countyMatch && breedMatch && priceMatch && listing.status === 'active';
    });
  }, [listings, query, selectedCounty, selectedBreed, priceRange]);

  const clearFilters = () => {
    setSelectedCounty('All');
    setSelectedBreed('All');
    setPriceRange([0, 2000]);
  };

  const hasFilters = selectedCounty !== 'All' || selectedBreed !== 'All' || priceRange[0] > 0 || priceRange[1] < 2000;

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search chickens, breeds, locations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-muted border-0"
            />
          </div>
          
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
                {hasFilters && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle>Filters</SheetTitle>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>
              </SheetHeader>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Location</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCounty === 'All' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCounty('All')}
                    >
                      All
                    </Button>
                    {COUNTIES.map((county) => (
                      <Button
                        key={county}
                        variant={selectedCounty === county ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCounty(county)}
                      >
                        {county}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Breed</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedBreed === 'All' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBreed('All')}
                    >
                      All
                    </Button>
                    {BREEDS.map((breed) => (
                      <Button
                        key={breed}
                        variant={selectedBreed === breed ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedBreed(breed)}
                      >
                        {breed}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Price Range: KES {priceRange[0]} - {priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={2000}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setFiltersOpen(false)}
                >
                  Show {filteredListings.length} results
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ListingGrid
          listings={filteredListings}
          emptyMessage="No listings match your search"
        />
      </motion.div>
    </AppLayout>
  );
}
