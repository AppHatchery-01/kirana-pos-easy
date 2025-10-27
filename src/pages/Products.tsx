import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Search, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ProductForm from "@/components/products/ProductForm";
import ProductList from "@/components/products/ProductList";
import QuickAddProduct from "@/components/products/QuickAddProduct";
import { User } from "@supabase/supabase-js";

const Products = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [lastProduct, setLastProduct] = useState<any>(null);
  const [addMode, setAddMode] = useState<"quick" | "detailed">("quick");

  useEffect(() => {
    checkAuthAndStore();
  }, []);

  const checkAuthAndStore = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Get user's store
    const { data: storeData, error } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    if (error || !storeData) {
      toast.error("No store found for your account");
      navigate("/dashboard");
      return;
    }

    setStoreId(storeData.id);
    setLoading(false);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = async () => {
    setShowForm(false);
    setEditingProduct(null);
    
    // Fetch the last added product for quick duplication
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data) setLastProduct(data);
    } catch (error) {
      // Ignore error
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Product Management</h1>
              <p className="text-xs text-muted-foreground">Add and manage inventory</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setAddMode("quick");
                handleAddProduct();
              }}
              variant="default"
            >
              <Zap className="mr-2 h-4 w-4" />
              Quick Add
            </Button>
            <Button 
              onClick={() => {
                setAddMode("detailed");
                handleAddProduct();
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Detailed
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingProduct 
                  ? "Edit Product" 
                  : addMode === "quick" 
                    ? "⚡ Quick Add Product" 
                    : "Add New Product"
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingProduct || addMode === "detailed" ? (
                <ProductForm
                  storeId={storeId!}
                  product={editingProduct}
                  onSuccess={handleFormClose}
                  onCancel={handleFormClose}
                />
              ) : (
                <QuickAddProduct
                  storeId={storeId!}
                  onSuccess={handleFormClose}
                  lastProduct={lastProduct}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Product List */}
            <ProductList
              storeId={storeId!}
              searchQuery={searchQuery}
              onEdit={handleEditProduct}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Products;
