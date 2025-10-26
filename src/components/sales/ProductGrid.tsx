import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string | null;
  unit: string | null;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductGrid = ({ products, onAddToCart }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card
          key={product.id}
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onAddToCart(product)}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
              {product.category && (
                <p className="text-xs text-muted-foreground mb-2">
                  {product.category}
                </p>
              )}
              <p className="text-2xl font-bold text-primary">
                ₹{product.price.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Stock: {product.stock_quantity} {product.unit || "units"}
              </p>
            </div>
            <Button
              className="mt-4 w-full"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
