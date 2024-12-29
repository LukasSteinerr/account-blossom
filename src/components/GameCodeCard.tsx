import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface GameCodeCardProps {
  listing: {
    id: string;
    price: number;
    code_value: number;
    expiration_date: string | null;
    region: string | null;
    additional_info: string | null;
    created_at: string;
    games: {
      title: string;
    };
  };
  onBuyClick: (id: string) => void;
}

export function GameCodeCard({ listing, onBuyClick }: GameCodeCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-2">{listing.games?.title}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Listed {formatDistance(new Date(listing.created_at), new Date(), { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">${listing.price}</span>
            <span className="text-sm text-muted-foreground">
              Value: ${listing.code_value}
            </span>
          </div>
          
          {listing.region && (
            <div className="text-sm">
              <span className="font-medium">Region:</span> {listing.region}
            </div>
          )}
          
          {listing.expiration_date && (
            <div className="text-sm">
              <span className="font-medium">Expires:</span>{" "}
              {new Date(listing.expiration_date).toLocaleDateString()}
            </div>
          )}
          
          {listing.additional_info && (
            <div className="text-sm mt-2">
              <span className="font-medium">Additional Info:</span>
              <p className="text-muted-foreground mt-1">{listing.additional_info}</p>
            </div>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full mt-4">
              Buy Now
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to purchase a game code for {listing.games?.title} at ${listing.price}.
                <br /><br />
                After payment, you will receive the code immediately. Please note that game codes are non-refundable once revealed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onBuyClick(listing.id)}>
                Proceed to Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}