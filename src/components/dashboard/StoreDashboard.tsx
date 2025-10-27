import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Package, TrendingUp, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface StoreDashboardProps {
  user: User;
  onSignOut: () => void;
}

const StoreDashboard = ({ user, onSignOut }: StoreDashboardProps) => {
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    totalProducts: 0,
    lowStockItems: 0,
  });

  useEffect(() => {
    fetchStoreData();
  }, [user.id]);

  const fetchStoreData = async () => {
    try {
      // Fetch user's store
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (storeData) {
        setStore(storeData);

        // Fetch products count
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("store_id", storeData.id);

        // Fetch low stock items (items at or below min_stock_level)
        const { data: productsData } = await supabase
          .from("products")
          .select("stock_quantity, min_stock_level")
          .eq("store_id", storeData.id);
        
        const lowStockCount = productsData?.filter(p => p.stock_quantity <= p.min_stock_level).length || 0;

        // Fetch today's sales
        const today = new Date().toISOString().split("T")[0];
        const { data: salesData } = await supabase
          .from("sales")
          .select("total_amount")
          .eq("store_id", storeData.id)
          .gte("created_at", today);

        const todaySales = salesData?.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0) || 0;

        setStats({
          todaySales,
          totalProducts: productsCount || 0,
          lowStockItems: lowStockCount || 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold">No Store Assigned</h2>
          <p className="mb-4 text-muted-foreground">
            Your account is not associated with any store yet. Please contact your administrator.
          </p>
          <Button variant="outline" onClick={onSignOut}>
            Sign Out
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">{store.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <StatsCard
            title="Today's Sales"
            value={`₹${stats.todaySales.toFixed(2)}`}
            icon={<TrendingUp className="h-8 w-8" />}
            gradient="bg-gradient-accent"
          />
          <StatsCard
            title="Total Products"
            value={stats.totalProducts.toString()}
            icon={<Package className="h-8 w-8" />}
            gradient="bg-gradient-primary"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats.lowStockItems.toString()}
            icon={<Package className="h-8 w-8" />}
            gradient="bg-destructive"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <QuickActionCard
            title="Start Billing"
            description="Create new sale and process payments"
            icon={<ShoppingBag className="h-12 w-12" />}
            onClick={() => navigate("/sales")}
            gradient="bg-gradient-primary"
          />
          <QuickActionCard
            title="Manage Products"
            description="Add, edit or view inventory items"
            icon={<Package className="h-12 w-12" />}
            onClick={() => navigate("/products")}
            gradient="bg-gradient-accent"
          />
        </div>
      </main>
    </div>
  );
};

const StatsCard = ({
  title,
  value,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`rounded-lg ${gradient} p-3 text-primary-foreground`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const QuickActionCard = ({
  title,
  description,
  icon,
  onClick,
  gradient,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  gradient: string;
}) => (
  <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={onClick}>
    <CardContent className="flex items-center gap-4 pt-6">
      <div className={`rounded-lg ${gradient} p-4 text-primary-foreground`}>{icon}</div>
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default StoreDashboard;
