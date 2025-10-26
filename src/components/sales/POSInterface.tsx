import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart } from "lucide-react";
import ProductGrid from "./ProductGrid";
import SalesCart from "./SalesCart";
import Invoice from "./Invoice";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  tax_rate: number;
  category: string | null;
  unit: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

interface POSInterfaceProps {
  storeId: string;
}

const POSInterface = ({ storeId }: POSInterfaceProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, [storeId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading products",
        description: error.message,
      });
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({
          variant: "destructive",
          title: "Insufficient stock",
          description: `Only ${product.stock_quantity} units available`,
        });
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity > product.stock_quantity) {
      toast({
        variant: "destructive",
        title: "Insufficient stock",
        description: `Only ${product.stock_quantity} units available`,
      });
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const completeSale = async (
    customerName: string,
    customerPhone: string,
    paymentMethod: string,
    discountAmount: number
  ) => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty cart",
        description: "Please add items to cart before completing sale",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate totals
      const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const taxAmount = cart.reduce(
        (sum, item) => sum + item.price * item.quantity * (item.tax_rate / 100),
        0
      );
      const totalAmount = subtotal + taxAmount - discountAmount;

      // Generate sale number
      const saleNumber = `SALE-${Date.now()}`;

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          store_id: storeId,
          cashier_id: user.id,
          sale_number: saleNumber,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          payment_method: paymentMethod,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          status: "completed",
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        tax_rate: item.tax_rate,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock_quantity: item.stock_quantity - item.quantity,
          })
          .eq("id", item.id);

        if (stockError) throw stockError;
      }

      setLastSaleId(sale.id);
      setShowInvoice(true);
      clearCart();
      loadProducts();

      toast({
        title: "Sale completed",
        description: `Sale ${saleNumber} completed successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error completing sale",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (showInvoice && lastSaleId) {
    return (
      <Invoice
        saleId={lastSaleId}
        onClose={() => {
          setShowInvoice(false);
          setLastSaleId(null);
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="p-6 sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Cart</h2>
            <span className="ml-auto text-sm text-muted-foreground">
              {cart.length} items
            </span>
          </div>

          <SalesCart
            cart={cart}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onCompleteSale={completeSale}
            loading={loading}
          />
        </Card>
      </div>
    </div>
  );
};

export default POSInterface;
