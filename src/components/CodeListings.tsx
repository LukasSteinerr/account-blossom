import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function CodeListings() {
  const [searchTerm, setSearchTerm] = useState("");

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
            <Card key={listing.id}>
              <CardHeader>
                <CardTitle>{listing.games?.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-4">${listing.price}</p>
                <Button className="w-full">Buy Now</Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}