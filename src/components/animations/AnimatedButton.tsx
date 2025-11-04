import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  delay?: number;
}

const AnimatedButton = ({ 
  children, 
  delay = 0, 
  className = '',
  ...props 
}: AnimatedButtonProps) => {
  return (
    <Button
      className={`flex items-center ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AnimatedButton;