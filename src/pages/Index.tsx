import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingBag, BarChart3, Package, Shield, Zap, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero px-6 py-20 md:py-32">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-primary-foreground">Modern POS for Kirana Stores</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold text-primary-foreground md:text-6xl lg:text-7xl">
              Transform Your <br />
              <span className="bg-gradient-accent bg-clip-text text-transparent">Kirana Store</span>
            </h1>
            
            <p className="mb-8 max-w-2xl text-lg text-primary-foreground/90 md:text-xl">
              Complete SaaS POS system designed for Indian retail. Manage inventory, track sales, 
              and grow your business with our modern, mobile-first platform.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow"
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
                className="border-primary-foreground/20 bg-white/10 text-primary-foreground backdrop-blur-sm hover:bg-white/20"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              Powerful features to streamline your store operations
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<ShoppingBag className="h-8 w-8" />}
              title="Fast Billing"
              description="Lightning-fast checkout with barcode scanning and quick product search"
            />
            <FeatureCard
              icon={<Package className="h-8 w-8" />}
              title="Inventory Management"
              description="Track stock levels, get low-stock alerts, and manage products effortlessly"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Sales Analytics"
              description="Real-time insights into your sales, revenue, and business performance"
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Multi-Store Support"
              description="Manage multiple store locations from a single admin dashboard"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Secure & Reliable"
              description="Bank-grade security with automated backups and data protection"
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Mobile First"
              description="Works perfectly on tablets and smartphones for on-the-go management"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary px-6 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Modernize Your Store?
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/90">
            Join hundreds of kirana stores already using our platform
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-6 py-8">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2024 KiranaPOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="rounded-xl border bg-card p-6 shadow-md transition-all hover:shadow-lg">
    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-semibold">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
