import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, User, Mail, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const ProfileSettings = () => {
  const { profile, user, userRole, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;

    if (formData.phone && (formData.phone.length !== 10 || !/^[0-9]{10}$/.test(formData.phone))) {
      toast({
        title: t('Error'),
        description: t('Phone number must be exactly 10 digits'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.email && !formData.email.endsWith('@gmail.com')) {
      toast({
        title: t('Error'),
        description: t('Only Gmail addresses are allowed'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (emailError) throw emailError;
      }

      await refreshProfile();

      toast({
        title: t('Success'),
        description: t('Profile updated successfully'),
      });
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to update profile'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('user_id', profile.user_id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: t('Success'),
        description: t('Profile picture updated successfully'),
      });
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to upload profile picture'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'buyer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'customer') return t('Seller');
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (!profile) {
    return <div>{t('Loading...')}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('Profile Information')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-48 w-48">
                <AvatarImage src={profile.avatar_url || user?.user_metadata?.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-5xl">
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-3 cursor-pointer hover:bg-primary/90">
                <Camera className="h-6 w-6" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{profile.full_name}</h3>
              <Badge className={getRoleColor(userRole?.role || 'customer')}>
                {getRoleLabel(userRole?.role || 'customer')}
              </Badge>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('Full Name')}</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder={t('Enter your full name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('Gmail Address')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('your.email@gmail.com')}
                pattern=".*@gmail\.com$"
              />
              <p className="text-xs text-muted-foreground">
                {t('Only Gmail addresses are accepted')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('Phone Number')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    handleInputChange('phone', value);
                  }
                }}
                placeholder={t('Enter exactly 10 digits')}
                pattern="[0-9]{10}"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                {t('Enter exactly 10 digits')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('Address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('Enter your address')}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
            {loading ? t('Saving...') : t('Save Changes')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
