import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast.error('Please sign in to upload images');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (images.length + newImages.length >= maxImages) break;

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select image files only');
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image must be less than 5MB');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload image');
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground shrink-0 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6" />
                <span className="text-xs mt-1">Add</span>
              </>
            )}
          </button>
        )}
        
        {images.map((img, idx) => (
          <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => removeImage(idx)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        {images.length}/{maxImages} photos • Max 5MB each
      </p>
    </div>
  );
}
