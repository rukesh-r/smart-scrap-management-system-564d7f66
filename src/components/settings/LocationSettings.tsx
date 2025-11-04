import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Trash2, Navigation } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface Address {
  id: string;
  type: 'pickup' | 'delivery';
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const LocationSettings = () => {
  const { profile, userRole } = useAuth();
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'pickup' as 'pickup' | 'delivery',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;

      const savedAddresses = localStorage.getItem('userAddresses');
      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses));
      }

      const savedGps = localStorage.getItem('gps_location');
      if (savedGps) {
        const gpsData = JSON.parse(savedGps);
        if (gpsData.userId === profile.user_id) {
          setGpsEnabled(gpsData.enabled);
          setCurrentLocation({ lat: gpsData.lat, lng: gpsData.lng });
        }
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('gps_enabled, gps_latitude, gps_longitude')
          .eq('user_id', profile.user_id)
          .single();

        if (data && data.gps_enabled) {
          setGpsEnabled(data.gps_enabled);
          if (data.gps_latitude && data.gps_longitude) {
            setCurrentLocation({ lat: data.gps_latitude, lng: data.gps_longitude });
          }
        }
      } catch (err) {
        console.log('GPS columns not yet available in database');
      }
    };
    loadData();
  }, [profile]);

  const handleAddAddress = () => {
    if (!newAddress.name || !newAddress.address || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast({
        title: t('Error'),
        description: t('Please fill in all fields'),
        variant: 'destructive',
      });
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      ...newAddress,
      isDefault: addresses.length === 0, // First address is default
    };

    const updatedAddresses = [...addresses, address];
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));

    setNewAddress({
      type: 'pickup',
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });
    setShowAddDialog(false);

    toast({
      title: t('Success'),
      description: t('Address added successfully'),
    });
  };

  const handleDeleteAddress = (id: string) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));

    toast({
      title: t('Success'),
      description: t('Address deleted successfully'),
    });
  };

  const handleSetDefault = (id: string) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    }));
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));

    toast({
      title: t('Success'),
      description: t('Default address updated'),
    });
  };

  const handleGpsToggle = async (enabled: boolean) => {
    if (!profile) return;

    if (enabled) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            setGpsEnabled(true);

            localStorage.setItem('gps_location', JSON.stringify({
              enabled: true,
              lat: latitude,
              lng: longitude,
              userId: profile.user_id
            }));

            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  gps_enabled: true,
                  gps_latitude: latitude,
                  gps_longitude: longitude
                })
                .eq('user_id', profile.user_id);

              if (error) {
                console.error('GPS save error:', error);
              }
            } catch (err) {
              console.error('GPS error:', err);
            }

            toast({
              title: t('Success'),
              description: t('GPS location enabled and saved'),
            });
          },
          (error) => {
            toast({
              title: t('Error'),
              description: t('Failed to get GPS location. Please enable location permissions.'),
              variant: 'destructive',
            });
          }
        );
      } else {
        toast({
          title: t('Error'),
          description: t('GPS not supported by this browser'),
          variant: 'destructive',
        });
      }
    } else {
      setGpsEnabled(false);
      setCurrentLocation(null);
      localStorage.removeItem('gps_location');

      try {
        await supabase
          .from('profiles')
          .update({ gps_enabled: false })
          .eq('user_id', profile.user_id);
      } catch (err) {
        console.error('GPS disable error:', err);
      }

      toast({
        title: t('Success'),
        description: t('GPS location disabled'),
      });
    }
  };

  const pickupAddresses = addresses.filter(addr => addr.type === 'pickup');
  const deliveryAddresses = addresses.filter(addr => addr.type === 'delivery');

  return (
    <div className="space-y-6">
      {/* GPS Settings (for sellers) */}
      {userRole?.role === 'customer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              {t('GPS Location')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>{t('Enable GPS-based Location')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('Allow buyers to find your pickup locations using GPS')}
                </p>
              </div>
              <Switch
                checked={gpsEnabled}
                onCheckedChange={handleGpsToggle}
              />
            </div>
            {gpsEnabled && currentLocation && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">{t('Current GPS Coordinates')}:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{t('Latitude')}: {currentLocation.lat.toFixed(6)}</p>
                  <p>{t('Longitude')}: {currentLocation.lng.toFixed(6)}</p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <MapPin className="h-4 w-4" />
                  {t('View on Google Maps')}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pickup Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('Pickup Addresses')}
            </span>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('Add Address')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('Add New Address')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('Type')}</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newAddress.type}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, type: e.target.value as 'pickup' | 'delivery' }))}
                    >
                      <option value="pickup">{t('Pickup Address')}</option>
                      <option value="delivery">{t('Delivery Address')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Name')}</Label>
                    <Input
                      value={newAddress.name}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('e.g., Home, Office')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Address')}</Label>
                    <Input
                      value={newAddress.address}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={t('Street address')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('City')}</Label>
                      <Input
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('State')}</Label>
                      <Input
                        value={newAddress.state}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Pincode')}</Label>
                    <Input
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddAddress} className="w-full">
                    {t('Add Address')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pickupAddresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('No pickup addresses added')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pickupAddresses.map((address) => (
                <div key={address.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{address.name}</p>
                      {address.isDefault && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          {t('Default')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.address}, {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        {t('Set Default')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('Delivery Addresses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveryAddresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('No delivery addresses added')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveryAddresses.map((address) => (
                <div key={address.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{address.name}</p>
                      {address.isDefault && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          {t('Default')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.address}, {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        {t('Set Default')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationSettings;
