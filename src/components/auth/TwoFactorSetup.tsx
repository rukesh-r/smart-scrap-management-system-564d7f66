import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader2, Copy, Check } from 'lucide-react';

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TwoFactorSetup = ({ open, onOpenChange, onSuccess }: TwoFactorSetupProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'enroll' | 'verify'>('enroll');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('verify');
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to setup 2FA'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast({
        title: t('Error'),
        description: t('Please enter a valid 6-digit code'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });

      if (error) throw error;

      toast({
        title: t('Success'),
        description: t('Two-factor authentication enabled successfully'),
      });
      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Invalid verification code'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t('Copied'),
      description: t('Secret key copied to clipboard'),
    });
  };

  const resetState = () => {
    setStep('enroll');
    setQrCode('');
    setSecret('');
    setFactorId('');
    setVerifyCode('');
    setCopied(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('Setup Two-Factor Authentication')}</DialogTitle>
          <DialogDescription>
            {step === 'enroll' 
              ? t('Secure your account with an authenticator app')
              : t('Scan the QR code with your authenticator app')}
          </DialogDescription>
        </DialogHeader>

        {step === 'enroll' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('You will need an authenticator app like:')}
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>Authy</li>
              </ul>
            </div>
            <Button onClick={handleEnroll} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('Setting up...')}
                </>
              ) : (
                t('Continue')
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              
              <div className="w-full space-y-2">
                <Label>{t('Or enter this code manually:')}</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="w-full space-y-2">
                <Label htmlFor="verify-code">{t('Enter 6-digit code from app:')}</Label>
                <Input
                  id="verify-code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('Verifying...')}
                  </>
                ) : (
                  t('Verify and Enable')
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorSetup;
