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
  const [draftListing, setDraftListing] = useState<any>(null);

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase.from("games").select("*");
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

      // First check if the user has a Stripe account
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      const listing = {
        code_text: values.code,
        price: parseFloat(values.price),
        game_id: values.gameId,
        seller_id: user.id,
        code_value: parseFloat(values.codeValue),
        expiration_date: values.expirationDate ? new Date(values.expirationDate).toISOString() : null,
        region: values.region || null,
        additional_info: values.additionalInfo || null,
        status: profile?.stripe_account_id ? 'available' : 'pending_payment_setup',
      };

      const { error } = await supabase.from("game_codes").insert(listing);

      if (error) throw error;

      if (!profile?.stripe_account_id) {
        setDraftListing(listing);
        setShowStripeConnect(true);
        toast({
          title: "Almost there!",
          description: "Please set up your payment account to complete your listing.",
        });
      } else {
        toast({
          title: "Success",
          description: "Your code has been listed",
        });
        form.reset();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to list your code",
        variant: "destructive",
      });
    }
  }

  const handleStripeConnectComplete = () => {
    setShowStripeConnect(false);
    toast({
      title: "Success",
      description: "Your payment account has been set up and your listing is now public!",
    });
    form.reset();
  };

  if (gamesLoading) return <div>Loading...</div>;

  if (showStripeConnect) {
    return <StripeConnect onComplete={handleStripeConnectComplete} />;
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