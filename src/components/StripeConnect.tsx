import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface StripeConnectProps {
  onComplete?: () => void;
}

export function StripeConnect({ onComplete }: StripeConnectProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // Create the Connect account
      const { data, error: connectError } = await supabase.functions.invoke('create-connect-account');
      if (connectError) throw connectError;

      const { accountId, accountLink } = data;
      
      if (!accountLink) {
        throw new Error('No account link URL received');
      }

      // Redirect to Stripe's hosted onboarding
      window.location.href = accountLink;
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Set Up Your Seller Account</h2>
        <p className="text-muted-foreground">
          We'll redirect you to Stripe to complete your account setup
        </p>
      </div>

      <Button 
        onClick={handleConnect} 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue to Stripe
      </Button>
    </div>
  );
}