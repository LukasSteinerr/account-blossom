import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";

export function GoogleButton() {
  return (
    <Button variant="outline" className="w-full bg-white hover:bg-gray-50" onClick={() => console.log("Google sign in")}>
      <Chrome className="w-5 h-5 mr-2" />
      Continue with Google
    </Button>
  );
}