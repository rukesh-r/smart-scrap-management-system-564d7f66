import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ProfileSettings from '@/components/settings/ProfileSettings';
import { useTranslation } from '@/hooks/useTranslation';

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('Loading profile...')}</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-light via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back to Dashboard')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('My Profile')}</h1>
          <p className="text-muted-foreground">
            {t('Manage your personal information')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('Profile Information')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
