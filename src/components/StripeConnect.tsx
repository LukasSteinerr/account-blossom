import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function StripeConnect() {
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const response = await fetch('/functions/v1/create-connect-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);

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