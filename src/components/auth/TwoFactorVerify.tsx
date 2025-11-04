import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader2, Shield } from 'lucide-react';

interface TwoFactorVerifyProps {
  factorId: string;
  challengeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TwoFactorVerify = ({ factorId, challengeId, onSuccess, onCancel }: TwoFactorVerifyProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast({
        title: t('Error'),
        description: t('Please enter a valid 6-digit code'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) throw error;

      toast({
        title: t('Success'),
        description: t('Authentication successful'),
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Invalid verification code'),
        variant: 'destructive',
      });
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-light via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>{t('Two-Factor Authentication')}</CardTitle>
          <CardDescription>
            {t('Enter the 6-digit code from your authenticator app')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('Verification Code')}</Label>
              <Input
                id="code"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('Verifying...')}
                  </>
                ) : (
                  t('Verify')
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                {t('Cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorVerify;
