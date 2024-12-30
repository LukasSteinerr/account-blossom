import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ShoppingCart } from "lucide-react";
import { CodeListingForm } from "@/components/CodeListingForm";
import { CodeListings } from "@/components/CodeListings";
import { StripeConnect } from "@/components/StripeConnect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

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
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Start Selling Game Codes</h2>
              <p className="text-muted-foreground">
                To list game codes for sale, you'll need to connect your bank account or debit card first.
                This ensures you can receive payments securely through our platform.
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