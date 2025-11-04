import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Recycle, Leaf, Users, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedCard from '@/components/animations/AnimatedCard';
import AnimatedButton from '@/components/animations/AnimatedButton';
import AnimatedText from '@/components/animations/AnimatedText';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    if (userRole) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/role-selection" replace />;
    }
  }

  const features = [
    {
      icon: <Recycle className="h-8 w-8 text-primary" />,
      title: "Smart Recycling",
      description: "Upload and categorize your recyclable materials with our intelligent system"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Connect Buyers & Sellers",
      description: "Direct marketplace connecting scrap sellers with verified recycling buyers"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Fair Pricing",
      description: "Market-driven pricing ensures fair value for your recyclable materials"
    },
    {
      icon: <Leaf className="h-8 w-8 text-primary" />,
      title: "Environmental Impact",
      description: "Track your contribution to environmental sustainability and carbon reduction"
    }
  ];

  const benefits = [
    "Real-time price tracking",
    "Secure transactions",
    "Quality verification",
    "Logistics support",
    "Environmental reporting",
    "24/7 customer support"
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Simple animated gradient background */}
      <motion.div 
        className="absolute inset-0 opacity-50"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
            'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(34, 197, 94, 0.1))',
            'linear-gradient(225deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Content overlay */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              className="flex items-center justify-center mb-8"
              initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, type: "spring", stiffness: 100 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Recycle className="h-16 w-16 text-primary mr-4" />
              </motion.div>
              <motion.h1 
                className="text-5xl font-bold text-foreground"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                EcoScrap
              </motion.h1>
            </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Smart Scrap Management System
          </motion.h2>
          
          <motion.p 
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            Transform your recyclable materials into value. Connect with verified buyers, 
            get fair pricing, and contribute to a sustainable future through our intelligent marketplace.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <a href="/auth" className="inline-flex">
              <AnimatedButton delay={1.6} size="lg" className="bg-primary hover:bg-primary/90 inline-flex items-center">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </AnimatedButton>
            </a>
            <AnimatedButton delay={1.8} size="lg" variant="outline" onClick={() => setLearnMoreOpen(true)}>
              Learn More
            </AnimatedButton>
          </motion.div>
        </div>
        
        {/* Features Section */}
        <div id="features-section" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <AnimatedText delay={0.2} variant="fadeUp">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Why Choose EcoScrap?
            </h3>
          </AnimatedText>
          <AnimatedText delay={0.4} variant="fadeIn">
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform revolutionizes scrap management with cutting-edge technology 
              and sustainable practices
            </p>
          </AnimatedText>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimatedCard key={index} delay={index * 0.2}>
              <Card className="text-center bg-card/80 backdrop-blur-sm border border-border/50 h-full">
                <CardHeader>
                  <motion.div 
                    className="flex justify-center mb-4"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
        
        {/* Benefits Section */}
        <div className="bg-card/30 backdrop-blur-sm py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-6">
                  Everything You Need for Successful Scrap Trading
                </h3>
                <p className="text-muted-foreground mb-8">
                  From listing your materials to completing transactions, our platform 
                  provides all the tools you need for efficient scrap management.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-success mr-3" />
                      <span className="text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 rounded-lg backdrop-blur-sm border border-primary/20">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-foreground mb-4">
                    Ready to Start?
                  </h4>
                  <p className="text-muted-foreground mb-6">
                    Join thousands of users already trading efficiently on our platform
                  </p>
                  <a href="/auth">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="bg-card/80 backdrop-blur-sm border-t border-border/50 py-8 relative z-10">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <Recycle className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-semibold text-foreground">EcoScrap</span>
            </div>
            <p className="text-muted-foreground">
              Building a sustainable future through smart scrap management
            </p>
          </div>
        </footer>
        </div>
        </div>
      </div>
      
      <Dialog open={learnMoreOpen} onOpenChange={setLearnMoreOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">About EcoScrap - Smart Scrap Management System</DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-4 text-base">
            <p>
              <strong>EcoScrap</strong> is a comprehensive digital platform designed to revolutionize the scrap and recyclable materials trading industry. Our system connects scrap sellers with verified buyers in a secure, transparent marketplace.
            </p>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Key Features:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Smart material categorization and quality assessment</li>
                <li>Real-time market pricing for various scrap materials</li>
                <li>Secure transaction processing and payment handling</li>
                <li>Verified buyer and seller profiles</li>
                <li>Logistics and pickup coordination</li>
                <li>Environmental impact tracking</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">How It Works:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>Sellers:</strong> List your scrap materials with photos and descriptions</li>
                <li><strong>Buyers:</strong> Browse available materials and make offers</li>
                <li><strong>Transaction:</strong> Secure payment and logistics coordination</li>
                <li><strong>Impact:</strong> Track your contribution to environmental sustainability</li>
              </ol>
            </div>
            
            <p>
              Our platform promotes circular economy principles by making scrap trading efficient, transparent, and accessible to everyone. Join us in building a sustainable future while earning fair value for your recyclable materials.
            </p>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
