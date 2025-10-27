import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";

const quickProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  category: z.string().min(1, "Category is required"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be greater than 0",
  }),
  stock_quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Stock must be a valid number",
  }),
});

type QuickProductFormValues = z.infer<typeof quickProductSchema>;

interface QuickAddProductProps {
  storeId: string;
  onSuccess: () => void;
  lastProduct?: any;
}

const CATEGORIES = ["Food", "Beverages", "Kitchen", "Household", "Personal Care", "Electronics", "Stationery", "Others"];

const QUICK_TEMPLATES = [
  { name: "Rice (1kg)", category: "Food", unit: "kg", tax_rate: 0 },
  { name: "Dal (1kg)", category: "Food", unit: "kg", tax_rate: 0 },
  { name: "Cooking Oil (1L)", category: "Food", unit: "liter", tax_rate: 5 },
  { name: "Milk (1L)", category: "Beverages", unit: "liter", tax_rate: 0 },
  { name: "Biscuits (Pack)", category: "Food", unit: "pack", tax_rate: 12 },
  { name: "Bread (Pack)", category: "Food", unit: "pack", tax_rate: 0 },
];

const QuickAddProduct = ({ storeId, onSuccess, lastProduct }: QuickAddProductProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const form = useForm<QuickProductFormValues>({
    resolver: zodResolver(quickProductSchema),
    defaultValues: {
      name: "",
      category: lastProduct?.category || "",
      price: "",
      stock_quantity: "",
    },
  });

  const onSubmit = async (values: QuickProductFormValues, addAnother: boolean = false) => {
    setLoading(true);
    try {
      // Get default values from last product or templates
      const template = QUICK_TEMPLATES.find(t => 
        values.name.toLowerCase().includes(t.name.toLowerCase().split(' ')[0])
      );

      const productData = {
        store_id: storeId,
        name: values.name,
        category: values.category,
        price: parseFloat(values.price),
        cost_price: parseFloat(values.price) * 0.85, // Default 15% margin
        stock_quantity: parseInt(values.stock_quantity),
        min_stock_level: 5, // Default minimum stock
        unit: template?.unit || lastProduct?.unit || "piece",
        tax_rate: template?.tax_rate || lastProduct?.tax_rate || 5,
        sku: `SKU-${Date.now()}`,
      };

      const { error } = await supabase.from("products").insert(productData);

      if (error) throw error;
      toast.success("Product added successfully!");

      if (addAnother) {
        form.reset({
          name: "",
          category: values.category, // Keep category
          price: "",
          stock_quantity: "",
        });
        // Focus on name field for next entry
        setTimeout(() => {
          const nameInput = document.querySelector<HTMLInputElement>('[name="name"]');
          nameInput?.focus();
        }, 100);
      } else {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    form.setValue("name", template.name);
    form.setValue("category", template.category);
    setSelectedCategory(template.category);
  };

  const duplicateLast = () => {
    if (lastProduct) {
      form.setValue("name", lastProduct.name);
      form.setValue("category", lastProduct.category);
      form.setValue("price", lastProduct.price.toString());
      setSelectedCategory(lastProduct.category);
      toast.success("Duplicated last product - update name and quantity");
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Templates */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Quick Templates</h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map((template, idx) => (
            <Button
              key={idx}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => useTemplate(template)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              {template.name}
            </Button>
          ))}
          {lastProduct && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={duplicateLast}
              className="text-xs border-primary"
            >
              <Copy className="h-3 w-3 mr-1" />
              Duplicate Last
            </Button>
          )}
        </div>
      </Card>

      <Form {...form}>
        <form className="space-y-4">
          {/* Category Quick Select */}
          <div>
            <FormLabel>Category *</FormLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(cat);
                    form.setValue("category", cat);
                  }}
                >
                  {cat}
                </Button>
              ))}
            </div>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Product Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Basmati Rice 1kg" 
                    {...field}
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock */}
            <FormField
              control={form.control}
              name="stock_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              onClick={form.handleSubmit((values) => onSubmit(values, true))}
              disabled={loading}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Save & Add Another
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit((values) => onSubmit(values, false))}
              disabled={loading}
              variant="outline"
            >
              Save & Close
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
        <p><strong>Smart Defaults:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Cost price: 85% of selling price (15% margin)</li>
          <li>Tax rate: 5% GST (auto-adjusted for food items)</li>
          <li>Minimum stock: 5 units</li>
          <li>Unit: Based on product name or last entry</li>
        </ul>
        <p className="mt-2"><strong>Tip:</strong> Use templates or "Duplicate Last" for faster entry!</p>
      </div>
    </div>
  );
};

export default QuickAddProduct;
