import { useEffect } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "./ui/dialog";
import { Loader2 } from "lucide-react";

interface PaymentFormProps {
  onSuccess: () => void;
  clientSecret: string;
}

export function PaymentForm({ onSuccess, clientSecret }: PaymentFormProps) {
  const stripe = useStripe();
  const { toast } = useToast();

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    // Redirect to Stripe Checkout
    stripe.redirectToCheckout({
      sessionId: clientSecret
    }).then((result) => {
      if (result.error) {
        toast({
          title: "Payment failed",
          description: result.error.message,
          variant: "destructive",
        });
        onSuccess(); // Close the dialog
      }
    });
  }, [stripe, clientSecret, toast, onSuccess]);

  return (
    <Dialog open={true} onOpenChange={() => onSuccess()}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Redirecting to payment...</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}