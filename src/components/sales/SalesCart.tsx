import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tax_rate: number;
}

interface SalesCartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (
    customerName: string,
    customerPhone: string,
    paymentMethod: string,
    discountAmount: number
  ) => void;
  loading: boolean;
}

const SalesCart = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteSale,
  loading,
}: SalesCartProps) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountAmount, setDiscountAmount] = useState(0);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const taxAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity * (item.tax_rate / 100),
    0
  );

  const total = subtotal + taxAmount - discountAmount;

  const handleCompleteSale = () => {
    onCompleteSale(customerName, customerPhone, paymentMethod, discountAmount);
    setCustomerName("");
    setCustomerPhone("");
    setDiscountAmount(0);
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cart is empty. Add products to start a sale.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto max-h-64 mb-4 space-y-2">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                ₹{item.price.toFixed(2)} × {item.quantity}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax:</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Discount:</span>
          <Input
            type="number"
            min="0"
            max={subtotal + taxAmount}
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            className="w-24 h-6 text-right"
          />
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="customerName" className="text-xs">
            Customer Name (Optional)
          </Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            className="h-8"
          />
        </div>

        <div>
          <Label htmlFor="customerPhone" className="text-xs">
            Phone (Optional)
          </Label>
          <Input
            id="customerPhone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Enter phone number"
            className="h-8"
          />
        </div>

        <div>
          <Label htmlFor="paymentMethod" className="text-xs">
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          onClick={onClearCart}
          disabled={loading}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          onClick={handleCompleteSale}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Processing..." : "Complete Sale"}
        </Button>
      </div>
    </div>
  );
};

export default SalesCart;
