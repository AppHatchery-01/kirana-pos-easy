import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvoiceProps {
  saleId: string;
  onClose: () => void;
}

interface SaleData {
  id: string;
  sale_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  store: {
    name: string;
    address: string | null;
    phone: string | null;
    gst_number: string | null;
  };
  sale_items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    total_price: number;
  }[];
}

const Invoice = ({ saleId, onClose }: InvoiceProps) => {
  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSaleData();
  }, [saleId]);

  const loadSaleData = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          store:stores(name, address, phone, gst_number),
          sale_items(*)
        `)
        .eq("id", saleId)
        .single();

      if (error) throw error;
      setSaleData(data as any);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading invoice",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">Loading invoice...</div>
      </Card>
    );
  }

  if (!saleData) {
    return (
      <Card className="p-8">
        <div className="text-center text-destructive">Invoice not found</div>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button onClick={onClose} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      <Card className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{saleData.store.name}</h1>
          {saleData.store.address && (
            <p className="text-sm text-muted-foreground">{saleData.store.address}</p>
          )}
          {saleData.store.phone && (
            <p className="text-sm text-muted-foreground">Phone: {saleData.store.phone}</p>
          )}
          {saleData.store.gst_number && (
            <p className="text-sm text-muted-foreground">GST: {saleData.store.gst_number}</p>
          )}
        </div>

        <Separator className="my-6" />

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Number</p>
            <p className="font-semibold">{saleData.sale_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-semibold">
              {new Date(saleData.created_at).toLocaleDateString()}
            </p>
          </div>
          {saleData.customer_name && (
            <div>
              <p className="text-sm text-muted-foreground">Customer Name</p>
              <p className="font-semibold">{saleData.customer_name}</p>
            </div>
          )}
          {saleData.customer_phone && (
            <div>
              <p className="text-sm text-muted-foreground">Customer Phone</p>
              <p className="font-semibold">{saleData.customer_phone}</p>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Tax</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {saleData.sale_items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{item.product_name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">₹{item.unit_price.toFixed(2)}</td>
                  <td className="text-right">{item.tax_rate}%</td>
                  <td className="text-right">₹{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>₹{saleData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax:</span>
              <span>₹{saleData.tax_amount.toFixed(2)}</span>
            </div>
            {saleData.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span>-₹{saleData.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{saleData.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="capitalize">{saleData.payment_method}</span>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Thank you for your business!</p>
        </div>
      </Card>
    </div>
  );
};

export default Invoice;
