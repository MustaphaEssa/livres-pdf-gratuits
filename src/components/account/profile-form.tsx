"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (name && name !== initialName) payload.name = name;
      if (newPassword) {
        payload.newPassword = newPassword;
        payload.currentPassword = currentPassword;
      }
      if (Object.keys(payload).length === 0) {
        setMsg({ type: "err", text: t.compte.noChange });
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec");
      setMsg({ type: "ok", text: t.compte.updated });
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Erreur",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t.compte.name}</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t.compte.currentPassword}
          </label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t.compte.currentPasswordPlaceholder}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t.compte.newPassword}
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t.compte.newPasswordPlaceholder}
          />
        </div>
      </div>
      {msg && (
        <p
          className={`text-sm ${
            msg.type === "ok" ? "text-green-600 dark:text-green-400" : "text-red-500"
          }`}
        >
          {msg.text}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-600"
      >
        {loading ? t.compte.saving : t.compte.save}
      </Button>
    </form>
  );
}
