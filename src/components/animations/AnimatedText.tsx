import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedTextProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'typewriter';
}

const AnimatedText = ({ 
  children, 
  delay = 0, 
  className = '', 
  variant = 'fadeUp' 
}: AnimatedTextProps) => {
  const variants = {
    fadeUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    slideLeft: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
    },
    slideRight: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
    },
    typewriter: {
      initial: { width: 0 },
      animate: { width: 'auto' },
    },
  };

  return (
    <motion.div
      initial={variants[variant].initial}
      animate={variants[variant].animate}
      transition={{
        duration: 0.8,
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedText;