import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  price: z.string().min(1, "Price is required"),
  gameId: z.string().min(1, "Game is required"),
  codeValue: z.string().min(1, "Code value is required"),
  expirationDate: z.string().optional(),
  region: z.string().optional(),
  additionalInfo: z.string().optional(),
});

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

      const { error } = await supabase.from("game_codes").insert({
        code_text: values.code,
        price: parseFloat(values.price),
        game_id: values.gameId,
        seller_id: user.id,
        code_value: parseFloat(values.codeValue),
        expiration_date: values.expirationDate ? new Date(values.expirationDate).toISOString() : null,
        region: values.region || null,
        additional_info: values.additionalInfo || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your code has been listed",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to list your code",
        variant: "destructive",
      });
    }
  }

  if (gamesLoading) return <div>Loading...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="gameId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a game</option>
                  {games?.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter your unused game code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter selling price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codeValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Value ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter code value" {...field} />
                </FormControl>
                <FormDescription>The actual monetary value of the code</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expirationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration Date</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormDescription>Leave empty if the code doesn't expire</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region</FormLabel>
              <FormControl>
                <Input placeholder="e.g., NA, EU, Global" {...field} />
              </FormControl>
              <FormDescription>Enter the region where this code can be used</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Information</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter any additional details about the code"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Include any relevant details about restrictions, usage instructions, etc.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">List Code</Button>
      </form>
    </Form>
  );
}