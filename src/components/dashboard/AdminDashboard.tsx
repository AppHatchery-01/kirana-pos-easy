import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, LogOut, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StoreRegistrationDialog from "./StoreRegistrationDialog";

interface AdminDashboardProps {
  user: User;
  onSignOut: () => void;
}

const AdminDashboard = ({ user, onSignOut }: AdminDashboardProps) => {
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
  });
  const [stores, setStores] = useState<any[]>([]);
  const [showStoreDialog, setShowStoreDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch stores
    const { data: storesData } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });

    setStores(storesData || []);

    // Calculate stats
    const totalStores = storesData?.length || 0;
    const activeStores = storesData?.filter((s) => s.is_active).length || 0;

    setStats({
      totalStores,
      activeStores,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <StatsCard
            title="Total Stores"
            value={stats.totalStores.toString()}
            icon={<Store className="h-8 w-8" />}
            gradient="bg-gradient-primary"
          />
          <StatsCard
            title="Active Stores"
            value={stats.activeStores.toString()}
            icon={<Users className="h-8 w-8" />}
            gradient="bg-gradient-accent"
          />
        </div>

        {/* Stores List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registered Stores</CardTitle>
                <CardDescription>Manage all kirana stores in the system</CardDescription>
              </div>
              <Button onClick={() => setShowStoreDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Register Store
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stores.length === 0 ? (
                <p className="text-center text-muted-foreground">No stores registered yet</p>
              ) : (
                stores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/5"
                  >
                    <div>
                      <h3 className="font-semibold">{store.name}</h3>
                      <p className="text-sm text-muted-foreground">{store.address || "No address"}</p>
                      <p className="text-xs text-muted-foreground">Phone: {store.phone || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          store.is_active
                            ? "bg-accent/10 text-accent"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {store.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <StoreRegistrationDialog
        open={showStoreDialog}
        onOpenChange={setShowStoreDialog}
        onSuccess={fetchDashboardData}
      />
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

export default AdminDashboard;
