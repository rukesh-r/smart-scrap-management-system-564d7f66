import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquare, HelpCircle, Send, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const FeedbackSettings = () => {
  const { t } = useTranslation();
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackType || !feedbackMessage.trim()) {
      toast({
        title: t('Error'),
        description: t('Please select a feedback type and enter your message'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would send to a backend service
      console.log('Feedback submitted:', { type: feedbackType, message: feedbackMessage });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: t('Success'),
        description: t('Thank you for your feedback! We appreciate your input.'),
      });

      setFeedbackType('');
      setFeedbackMessage('');
    } catch (error) {
      toast({
        title: t('Error'),
        description: t('Failed to submit feedback. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    // In a real app, this would open a support chat or email
    toast({
      title: t('Support'),
      description: t('Support contact feature not yet implemented'),
    });
  };

  const handleOpenHelpCenter = () => {
    // In a real app, this would open the help center
    toast({
      title: t('Help Center'),
      description: t('Help center not yet implemented'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Submit Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('Submit Feedback')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('Feedback Type')}</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select feedback type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">{t('Bug Report')}</SelectItem>
                <SelectItem value="feature">{t('Feature Request')}</SelectItem>
                <SelectItem value="improvement">{t('Improvement Suggestion')}</SelectItem>
                <SelectItem value="general">{t('General Feedback')}</SelectItem>
                <SelectItem value="complaint">{t('Complaint')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('Message')}</Label>
            <Textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder={t('Tell us what\'s on your mind...')}
              rows={5}
            />
          </div>

          <Button onClick={handleSubmitFeedback} disabled={loading} className="w-full md:w-auto">
            <Send className="h-4 w-4 mr-2" />
            {loading ? t('Submitting...') : t('Submit Feedback')}
          </Button>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('Contact Support')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('Need help with your account or have questions about our services? Our support team is here to assist you.')}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" onClick={handleContactSupport}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('Start Chat')}
            </Button>
            <Button variant="outline" onClick={() => window.open('mailto:support@ecoscrap.com')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('Email Support')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('Help Center & FAQs')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('Find answers to common questions and learn more about using EcoScrap.')}
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">{t('Popular Topics:')}</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• {t('How to list scrap items for sale')}</li>
              <li>• {t('Payment and transaction process')}</li>
              <li>• {t('Account verification and security')}</li>
              <li>• {t('Delivery and pickup policies')}</li>
              <li>• {t('Troubleshooting common issues')}</li>
            </ul>
          </div>

          <Button variant="outline" onClick={handleOpenHelpCenter} className="w-full md:w-auto">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('Visit Help Center')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackSettings;
