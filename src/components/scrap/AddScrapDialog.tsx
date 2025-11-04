import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client'; // cspell:ignore supabase
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MapPin, Loader2, Upload, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AddScrapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddScrapDialog = ({ open, onOpenChange, onSuccess }: AddScrapDialogProps) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const categories = [
    'Metal', 'Plastic', 'Paper', 'Glass', 'Electronics', 'Textile', 'Wood', 'Other'
  ];

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      toast({
        title: t('Error'),
        description: t('Geolocation is not supported by this browser.'),
        variant: 'destructive',
      });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use reverse geocoding to get readable address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'EcoScrap-App',
                'Accept-Language': 'en'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error('Geocoding failed');
          }
          
          const data = await response.json();
          
          // Build a readable address from the response
          const addressParts = [];
          if (data.address) {
            const addr = data.address;
            if (addr.road || addr.street) addressParts.push(addr.road || addr.street);
            if (addr.suburb || addr.neighbourhood) addressParts.push(addr.suburb || addr.neighbourhood); // cspell:ignore neighbourhood
            if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
            if (addr.state) addressParts.push(addr.state);
            if (addr.postcode) addressParts.push(addr.postcode);
          }
          
          const address = addressParts.length > 0 
            ? addressParts.join(', ') 
            : data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          setLocation(address);
          setGpsCoords({ lat: latitude, lng: longitude });
          toast({
            title: t('Location detected'),
            description: t('Your current location has been set.'),
          });
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Fallback to coordinates if reverse geocoding fails
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setGpsCoords({ lat: latitude, lng: longitude });
          toast({
            title: t('Location detected'),
            description: t('Coordinates set. You can edit the address manually.'),
          });
        }
        setLocationLoading(false);
      },
      (error) => {
        toast({
          title: t('Error'),
          description: t('Unable to retrieve your location. Please try again.'),
          variant: 'destructive',
        });
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('Invalid file'),
          description: t('Please select an image file.'),
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: t('File too large'),
          description: t('Image must be less than 5MB.'),
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setLocation('');
      setImageFile(null);
      setImagePreview('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    if (!imageFile) {
      toast({
        title: t('Image required'),
        description: t('Please upload an image of the scrap item.'),
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get('phone') as string;
    
    if (!phoneNumber || phoneNumber.length !== 10 || !/^[0-9]{10}$/.test(phoneNumber)) {
      toast({
        title: t('Error'),
        description: t('Phone number must be exactly 10 digits'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const upiId = formData.get('upi_id') as string;

    try {
      // Update profile with UPI ID if provided
      if (upiId && upiId.trim()) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ upi_id: upiId.trim() })
          .eq('user_id', profile.user_id);

        if (profileError) {
          console.error('Error updating UPI ID:', profileError);
        }
      }
      // Upload image to storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('scrap-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('scrap-images')
        .getPublicUrl(fileName);

      // Insert scrap item with image URL and GPS coordinates
      const scrapData = {
        customer_id: profile.user_id,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        weight_kg: parseFloat(formData.get('weight') as string),
        expected_price: parseFloat(formData.get('price') as string),
        location: location || formData.get('location') as string,
        location_lat: gpsCoords?.lat || null,
        location_lng: gpsCoords?.lng || null,
        image_url: publicUrl,
      };

      const { error } = await supabase
        .from('scrap_items')
        .insert([scrapData]);

      if (error) throw error;

      toast({
        title: t('Success'),
        description: t('Scrap item added successfully!'),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding scrap item:', error);
      toast({
        title: t('Error'),
        description: t('Failed to add scrap item. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('Add New Scrap Item')}</DialogTitle>
          <DialogDescription>
            {t('List your recyclable materials to connect with buyers in the marketplace.')}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('Title')} *</Label>
              <Input
                id="title"
                name="title"
                placeholder={t('e.g., Aluminum Cans')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('Category')} *</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('Phone Number')} *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder={t('e.g., 9876543210')}
                pattern="[0-9]{10}"
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  e.target.value = value;
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('Enter exactly 10 digits')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upi_id">{t('UPI ID (Payment)')}</Label>
              <Input
                id="upi_id"
                name="upi_id"
                type="text"
                placeholder={t('e.g., yourname@paytm')} // cspell:ignore yourname paytm
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('Description')}</Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t('Describe the condition, quantity, and any other relevant details')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">{t('Weight (kg)')} *</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.1"
                min="0.1"
                placeholder={t('e.g., 15.5')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t('Expected Price (₹)')} *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder={t('e.g., 25.00')}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t('Location')} *</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('Your location will appear here')}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Click the location icon to automatically detect your current location')}
            </p>
            {gpsCoords && (
              <a
                href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <MapPin className="h-3 w-3" />
                {t('View on Google Maps')}
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">{t('Item Image')} *</Label>
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="image" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('Click to upload image')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('PNG, JPG up to 5MB')}
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('Adding...') : t('Add Item')}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddScrapDialog;
