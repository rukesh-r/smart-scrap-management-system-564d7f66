import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Package, ShoppingCart, AlertTriangle, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const NotificationSettings = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState({
    newScrapAlerts: true,
    purchaseConfirmations: true,
    saleConfirmations: true,
    systemUpdates: true,
    promotionalEmails: false,
  });

  useEffect(() => {
    // Load notification preferences from localStorage
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);

    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(newNotifications));

    toast({
      title: t('Success'),
      description: t('Notification preferences updated'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Scrap Item Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('Scrap Item Alerts')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('New Scrap Item Alerts')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('Get notified when new scrap items are listed in your area')}
              </p>
            </div>
            <Switch
              checked={notifications.newScrapAlerts}
              onCheckedChange={(checked) => handleNotificationChange('newScrapAlerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transaction Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('Transaction Alerts')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('Purchase Confirmations')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('Receive notifications when you successfully purchase scrap items')}
              </p>
            </div>
            <Switch
              checked={notifications.purchaseConfirmations}
              onCheckedChange={(checked) => handleNotificationChange('purchaseConfirmations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('Sale Confirmations')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('Get notified when your scrap items are sold')}
              </p>
            </div>
            <Switch
              checked={notifications.saleConfirmations}
              onCheckedChange={(checked) => handleNotificationChange('saleConfirmations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('System Notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('System Updates & Announcements')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('Important updates about platform changes and new features')}
              </p>
            </div>
            <Switch
              checked={notifications.systemUpdates}
              onCheckedChange={(checked) => handleNotificationChange('systemUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('Promotional Emails')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('Receive emails about special offers and promotions')}
              </p>
            </div>
            <Switch
              checked={notifications.promotionalEmails}
              onCheckedChange={(checked) => handleNotificationChange('promotionalEmails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {t('Notification Summary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>{t('You will receive notifications for:')}</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {notifications.newScrapAlerts && <li>{t('New scrap items in your area')}</li>}
              {notifications.purchaseConfirmations && <li>{t('Purchase confirmations')}</li>}
              {notifications.saleConfirmations && <li>{t('Sale confirmations')}</li>}
              {notifications.systemUpdates && <li>{t('System updates and announcements')}</li>}
              {notifications.promotionalEmails && <li>{t('Promotional offers')}</li>}
            </ul>
            {!Object.values(notifications).some(v => v) && (
              <p className="text-muted-foreground italic">{t('No notifications enabled')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
