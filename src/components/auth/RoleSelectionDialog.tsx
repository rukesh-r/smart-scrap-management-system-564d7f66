import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserCircle, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RoleSelectionDialogProps {
  open: boolean;
  userId: string;
  onRoleSelected: () => void;
}

const RoleSelectionDialog = ({ open, userId, onRoleSelected }: RoleSelectionDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'buyer' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast({
        title: 'Please select a role',
        description: 'You must choose whether you want to be a Seller or Buyer',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Insert role into user_roles table
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: selectedRole });

      if (error) throw error;

      toast({
        title: 'Role selected successfully',
        description: `You are now registered as a ${selectedRole === 'customer' ? 'Seller' : 'Buyer'}`,
      });

      onRoleSelected();
    } catch (error: any) {
      console.error('Error setting role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to set role',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Choose Your Role</DialogTitle>
          <DialogDescription>
            Select how you want to use EcoScrap. You can only choose once.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Card
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'customer' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole('customer')}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <UserCircle className="h-12 w-12 text-primary" />
              <h3 className="font-semibold">Seller</h3>
              <p className="text-sm text-muted-foreground">
                Sell your recyclable scrap materials
              </p>
            </div>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'buyer' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole('buyer')}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <ShoppingCart className="h-12 w-12 text-primary" />
              <h3 className="font-semibold">Buyer</h3>
              <p className="text-sm text-muted-foreground">
                Purchase scrap materials for recycling
              </p>
            </div>
          </Card>
        </div>

        <Button
          onClick={handleRoleSelection}
          disabled={!selectedRole || loading}
          className="w-full"
        >
          {loading ? 'Setting up...' : 'Continue'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionDialog;
