import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "./ui/dialog";

interface PaymentFormProps {
  onSuccess: () => void;
}

export function PaymentForm({ onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required"
    });

    if (error) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (paymentIntent.status === "succeeded") {
      toast({
        title: "Payment successful",
        description: "Your game code will be revealed shortly",
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <Dialog open={true} onOpenChange={() => !isProcessing && onSuccess()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button 
            type="submit" 
            disabled={isProcessing || !stripe || !elements}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Pay now"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}