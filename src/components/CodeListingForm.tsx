import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ListingFormFields, formSchema } from "./forms/ListingFormFields";
import * as z from "zod";

export function CodeListingForm() {
  const { toast } = useToast();

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

  if (gamesLoading) return <div>Loading...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ListingFormFields form={form} games={games} />
        <Button type="submit">List Code</Button>
      </form>
    </Form>
  );
}