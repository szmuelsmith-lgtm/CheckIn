"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

export function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-3 bg-red-50 rounded-full mb-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <p className="text-slate-600 text-sm mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
