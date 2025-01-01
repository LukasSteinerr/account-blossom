import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StripeConnect } from "./StripeConnect";
import { ListingFormFields, formSchema } from "./forms/ListingFormFields";
import * as z from "zod";

export function CodeListingForm() {
  const { toast } = useToast();
  const [showStripeConnect, setShowStripeConnect] = useState(false);

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase.from("games").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Query to check if user has Stripe setup
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      price: "",
      gameId: "",
      codeValue: "",
      expirationDate: "",
      region: "",
      additionalInfo: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to list a code",
          variant: "destructive",
        });
        return;
      }

      // Check if user has Stripe setup
      if (!profile?.stripe_account_id) {
        setShowStripeConnect(true);
        toast({
          title: "Stripe Setup Required",
          description: "Please set up your payment account before listing codes.",
        });
        return;
      }

      const listing = {
        code_text: values.code,
        price: parseFloat(values.price),
        game_id: values.gameId,
        seller_id: user.id,
        code_value: parseFloat(values.codeValue),
        expiration_date: values.expirationDate ? new Date(values.expirationDate).toISOString() : null,
        region: values.region || null,
        additional_info: values.additionalInfo || null,
        status: 'available',
        payment_status: 'unpaid',
      };

      const { error } = await supabase.from("game_codes").insert(listing);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your code has been listed",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to list your code",
        variant: "destructive",
      });
    }
  }

  const handleStripeConnectComplete = () => {
    setShowStripeConnect(false);
    toast({
      title: "Success",
      description: "Your payment account has been set up. You can now list your codes!",
    });
  };

  if (gamesLoading || profileLoading) return <div>Loading...</div>;

  if (showStripeConnect) {
    return <StripeConnect onComplete={handleStripeConnectComplete} />;
  }

  // If user hasn't set up Stripe yet, show the Stripe Connect form immediately
  if (!profile?.stripe_account_id) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800">Payment Setup Required</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Before you can list game codes, you need to set up your payment account to receive payments.
          </p>
        </div>
        <StripeConnect onComplete={handleStripeConnectComplete} />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ListingFormFields form={form} games={games} />
        <Button type="submit">List Code</Button>
      </form>
    </Form>
  );
}