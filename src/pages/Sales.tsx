import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import POSInterface from "@/components/sales/POSInterface";
import SalesHistory from "@/components/sales/SalesHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Sales = () => {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stores, error } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setStoreId(stores?.id || null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!storeId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please register a store first to start selling.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Sales Management</h1>
      
      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pos">Point of Sale</TabsTrigger>
          <TabsTrigger value="history">Sales History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pos" className="mt-6">
          <POSInterface storeId={storeId} />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <SalesHistory storeId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sales;
