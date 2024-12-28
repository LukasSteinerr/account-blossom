import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full bg-white hover:bg-gray-50"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      <Chrome className="w-5 h-5 mr-2" />
      {loading ? "Loading..." : "Continue with Google"}
    </Button>
  );
}