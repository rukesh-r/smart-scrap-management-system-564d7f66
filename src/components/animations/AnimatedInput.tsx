import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forwardRef } from 'react';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  delay?: number;
}

const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, delay = 0, className = '', ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay
        }}
        className="space-y-2"
      >
        {label && <Label>{label}</Label>}
        <Input
          ref={ref}
          className={`transition-shadow duration-200 focus:shadow-md ${className}`}
          {...props}
        />
      </motion.div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

export default AnimatedInput;