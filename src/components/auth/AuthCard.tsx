import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <Card className={cn("w-full max-w-md p-8 glass-effect border-0 shadow-lg", className)}>
      {children}
    </Card>
  );
}