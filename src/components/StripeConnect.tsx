import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function StripeConnect() {
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      
      if (error) throw error;
      
      const { url } = data;
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleConnect}>
      Connect with Stripe to Sell
    </Button>
  );
}