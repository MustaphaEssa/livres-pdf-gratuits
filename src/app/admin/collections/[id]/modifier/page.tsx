"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { CollectionForm } from "@/components/admin/collection-form";

export default function EditCollectionPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [initial, setInitial] = useState<Parameters<typeof CollectionForm>[0]["initial"] | null>(
    null
  );
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/collections/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setInitial(d.collection))
      .catch(() => setNotFound(true));
  }, [id]);

  return (
    <AdminShell active="collections">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Modifier la collection
      </h1>
      {notFound ? (
        <p className="text-slate-500">Collection introuvable.</p>
      ) : !initial ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : (
        <CollectionForm mode="edit" initial={initial} />
      )}
    </AdminShell>
  );
}
