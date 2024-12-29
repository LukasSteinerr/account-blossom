import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ShoppingCart } from "lucide-react";
import { CodeListingForm } from "@/components/CodeListingForm";
import { CodeListings } from "@/components/CodeListings";
import { StripeConnect } from "@/components/StripeConnect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Game Code Marketplace</h1>
      
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="buy">
            <ShoppingCart className="mr-2" />
            Buy Codes
          </TabsTrigger>
          <TabsTrigger value="sell">
            <Upload className="mr-2" />
            Sell Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy">
          <CodeListings />
        </TabsContent>

        <TabsContent value="sell">
          {!profile?.stripe_account_id ? (
            <div className="text-center py-8">
              <h2 className="text-2xl font-semibold mb-4">Start Selling Game Codes</h2>
              <p className="text-muted-foreground mb-6">
                Connect your Stripe account to receive payments for your game codes
              </p>
              <StripeConnect />
            </div>
          ) : (
            <CodeListingForm />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;