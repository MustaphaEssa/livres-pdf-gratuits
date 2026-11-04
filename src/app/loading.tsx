import { Loader2 } from "lucide-react";

// Retour visuel instantané pendant le chargement d'une page (navigation App Router)
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
    </div>
  );
}
