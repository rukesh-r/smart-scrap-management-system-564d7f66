import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Palette, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';

const PreferencesSettings = () => {
  const { profile } = useAuth();
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
  });

  useEffect(() => {
    // Load preferences from localStorage or user profile
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      const parsedPrefs = JSON.parse(savedPreferences);
      setPreferences(parsedPrefs);
      // Apply saved language
      if (parsedPrefs.language && parsedPrefs.language !== currentLanguage) {
        changeLanguage(parsedPrefs.language);
      }
    }
  }, [changeLanguage, currentLanguage]);

  const handlePreferenceChange = async (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Save to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));

    // If language changed, update i18n and save to database
    if (key === 'language') {
      await changeLanguage(value);
      
      if (profile) {
        try {
          await supabase
            .from('profiles')
            .update({ preferred_language: value } as any)
            .eq('user_id', profile.user_id);
        } catch (error) {
          console.error('Failed to save language preference:', error);
        }
      }
    }

    toast({
      title: t('Success'),
      description: t('Preferences updated successfully'),
    });
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleThemeChange = (theme: string) => {
    handlePreferenceChange('theme', theme);
    applyTheme(theme);
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('Appearance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('Theme')}</Label>
            <Select value={preferences.theme} onValueChange={handleThemeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('Light')}</SelectItem>
                <SelectItem value="dark">{t('Dark')}</SelectItem>
                <SelectItem value="system">{t('System')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('Choose your preferred theme for the application')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('Language & Region')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('Language')}</Label>
            <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('English')}</SelectItem>
                <SelectItem value="hi">{t('Hindi')}</SelectItem>
                <SelectItem value="mr">{t('Marathi')}</SelectItem>
                <SelectItem value="gu">{t('Gujarati')}</SelectItem>
                <SelectItem value="ta">{t('Tamil')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('Select your preferred language for the interface')}
            </p>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default PreferencesSettings;
