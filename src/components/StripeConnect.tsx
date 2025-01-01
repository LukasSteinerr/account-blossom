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

  const handleStripeConnect = async () => {
    try {
      setIsLoading(true);
      
      // Create Connect account and get onboarding URL
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { returnUrl: window.location.origin + '/dashboard' }
      });

      if (error) throw error;
      
      // Redirect to Stripe Connect onboarding
      window.location.href = data.url;
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
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-lg font-medium">Set Up Your Payment Account</h3>
        <p className="text-sm text-gray-600">
          To start selling game codes, you'll need to set up your payment account with Stripe.
          This will allow you to receive payments securely.
        </p>
        <Button 
          onClick={handleStripeConnect} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Set Up Stripe Account
        </Button>
      </div>
    </div>
  );
}