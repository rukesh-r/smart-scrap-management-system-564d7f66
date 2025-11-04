import { motion } from 'framer-motion';
import { Recycle, Leaf, Zap, Globe } from 'lucide-react';

const FloatingElements = () => {
  const icons = [
    { Icon: Recycle, color: 'text-green-500', size: 'h-8 w-8' },
    { Icon: Leaf, color: 'text-emerald-500', size: 'h-6 w-6' },
    { Icon: Zap, color: 'text-yellow-500', size: 'h-7 w-7' },
    { Icon: Globe, color: 'text-blue-500', size: 'h-9 w-9' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute ${item.color} ${item.size} opacity-20`}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            rotate: 0,
            scale: 0.5,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            rotate: 360,
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
            delay: index * 2,
          }}
        >
          <item.Icon />
        </motion.div>
      ))}
      
      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute w-2 h-2 bg-primary/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: -50,
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
            delay: index * 1.5,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingElements;