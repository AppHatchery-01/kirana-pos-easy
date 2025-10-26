import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Invoice from "./Invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Sale {
  id: string;
  sale_number: string;
  customer_name: string | null;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

interface SalesHistoryProps {
  storeId: string;
}

const SalesHistory = ({ storeId }: SalesHistoryProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSales();
  }, [storeId]);

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading sales",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedSaleId) {
    return (
      <Invoice
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading sales history...</div>;
  }

  if (sales.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          No sales records found
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Sales History</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sale Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.sale_number}</TableCell>
              <TableCell>{sale.customer_name || "Walk-in"}</TableCell>
              <TableCell>
                {new Date(sale.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="capitalize">{sale.payment_method}</TableCell>
              <TableCell className="text-right">
                ₹{sale.total_amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSaleId(sale.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default SalesHistory;
