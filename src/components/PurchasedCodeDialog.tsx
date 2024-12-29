import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface PurchasedCodeDialogProps {
  code: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PurchasedCodeDialog({ code, isOpen, onClose }: PurchasedCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Your Game Code</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>Here's your purchased game code. Make sure to save it somewhere safe!</p>
            
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between gap-2">
              <code className="text-lg font-mono">{code}</code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="text-sm">
              <strong>Important:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>This code can only be used once</li>
                <li>Keep it secure and don't share it with others</li>
                <li>Verify the code works before closing this window</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}