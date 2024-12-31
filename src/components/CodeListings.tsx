import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { GameCodeCard } from "./GameCodeCard";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentForm } from "./PaymentForm";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function CodeListings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGameCode, setSelectedGameCode] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["game-codes", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("game_codes")
        .select(`
          *,
          games (
            title
          )
        `)
        .eq("status", "available")
        .eq("payment_status", "unpaid");

      if (searchTerm) {
        query = query.textSearch("games.title", searchTerm);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleBuyClick = async (gameCodeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Please log in to make a purchase",
          variant: "destructive",
        });
        return;
      }

      // Verify the game code is still available
      const { data: gameCode } = await supabase
        .from("game_codes")
        .select("*")
        .eq("id", gameCodeId)
        .eq("status", "available")
        .eq("payment_status", "unpaid")
        .single();

      if (!gameCode) {
        toast({
          title: "Error",
          description: "This game code is no longer available",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { gameCodeId },
      });

      if (error) {
        console.error('Payment creation error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create payment",
          variant: "destructive",
        });
        return;
      }

      setSelectedGameCode(gameCodeId);
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error in handleBuyClick:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Loading listings...</p>
        ) : listings?.length === 0 ? (
          <p>No game codes found</p>
        ) : (
          listings?.map((listing) => (
            <GameCodeCard
              key={listing.id}
              listing={listing}
              onBuyClick={handleBuyClick}
            />
          ))
        )}
      </div>

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm 
            onSuccess={() => {
              setClientSecret("");
              setSelectedGameCode(null);
            }}
          />
        </Elements>
      )}
    </div>
  );
}