"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { CollectionForm } from "@/components/admin/collection-form";

export default function NewCollectionPage() {
  return (
    <AdminShell active="collections">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Nouvelle collection
      </h1>
      <CollectionForm mode="create" />
    </AdminShell>
  );
}
