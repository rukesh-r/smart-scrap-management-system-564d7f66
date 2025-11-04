import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const ProfileCompletionDialog = () => {
  const { profile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (profile) {
      const isIncomplete = !profile.phone || !profile.address;
      setOpen(isIncomplete);
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone.trim() || !formData.address.trim()) {
      toast({
        title: t('Error'),
        description: t('Please fill all required fields'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.phone.length !== 10 || !/^[0-9]{10}$/.test(formData.phone)) {
      toast({
        title: t('Error'),
        description: t('Phone number must be exactly 10 digits'),
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
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      await refreshProfile();
      setOpen(false);
      toast({
        title: t('Success'),
        description: t('Profile completed successfully'),
      });
    } catch (error) {
      toast({
        title: t('Error'),
        description: t('Failed to update profile'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('Complete Your Profile')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">{t('Full Name')} *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">{t('Phone Number')} *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setFormData({ ...formData, phone: value });
                }
              }}
              placeholder={t('Enter exactly 10 digits')}
              pattern="[0-9]{10}"
              maxLength={10}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('Enter exactly 10 digits')}
            </p>
          </div>

          <div>
            <Label htmlFor="address">{t('Address')} *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('Saving...') : t('Complete Profile')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionDialog;
