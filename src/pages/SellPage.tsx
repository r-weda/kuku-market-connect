import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTIES, BREEDS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/listings/ImageUpload';

export default function SellPage() {
  const navigate = useNavigate();
  const { addListing } = useApp();
  const { user, profile } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [breed, setBreed] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minOrder, setMinOrder] = useState('1');
  const [location, setLocation] = useState('');
  const [county, setCounty] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile) {
      toast.error('Please sign in to create a listing');
      navigate('/auth');
      return;
    }

    if (!title || !breed || !price || !quantity || !location || !county) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    setSubmitting(true);
    const { error } = await addListing({
      title,
      description,
      breed,
      pricePerUnit: Number(price),
      quantity: Number(quantity),
      minOrder: Number(minOrder) || 1,
      images,
      location,
      county,
      isNegotiable,
    }, profile.id);

    setSubmitting(false);

    if (error) {
      toast.error('Failed to create listing. Please try again.');
      return;
    }

    toast.success('Listing created successfully!');
    navigate('/');
  };

  return (
    <AppLayout hideNav>
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Sell Your Chickens</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-6 pb-24"
      >
        {/* Photos */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Photos *</Label>
          <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Fresh Kienyeji Chickens"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Breed */}
        <div className="space-y-2">
          <Label>Breed *</Label>
          <Select value={breed} onValueChange={setBreed}>
            <SelectTrigger>
              <SelectValue placeholder="Select breed" />
            </SelectTrigger>
            <SelectContent>
              {BREEDS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            placeholder="Describe your chickens - age, weight, feed type, health status..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Price & Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price per bird (KES) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="850"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qty">Quantity *</Label>
            <Input
              id="qty"
              type="number"
              placeholder="50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>

        {/* Min Order */}
        <div className="space-y-2">
          <Label htmlFor="minOrder">Minimum Order</Label>
          <Input
            id="minOrder"
            type="number"
            placeholder="1"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>County *</Label>
          <Select value={county} onValueChange={setCounty}>
            <SelectTrigger>
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              {COUNTIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loc">Specific Location *</Label>
          <Input
            id="loc"
            placeholder="e.g., Kiambu Town"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Negotiable */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Price Negotiable</Label>
            <p className="text-xs text-muted-foreground">Allow buyers to make offers</p>
          </div>
          <Switch checked={isNegotiable} onCheckedChange={setIsNegotiable} />
        </div>

        {/* Platform Fee Notice */}
        <div className="bg-muted rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Platform Fee:</strong> 5% commission is automatically deducted from each successful sale.
          </p>
        </div>
      </motion.div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 safe-bottom">
        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating...' : 'Post Listing'}
        </Button>
      </div>
    </AppLayout>
  );
}
