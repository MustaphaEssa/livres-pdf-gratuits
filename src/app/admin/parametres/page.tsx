"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";

interface Settings {
  siteName: string;
  siteDescription: string | null;
  logo: string | null;
  email: string | null;
  telephone: string | null;
  address: string | null;
  googleAnalyticsId: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  featuredBooksCount: number;
}

type Field = keyof Settings;

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/parametres");
        if (res.ok) setSettings((await res.json()).settings);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = (field: Field, value: string | number) =>
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/parametres", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMessage(res.ok ? "Paramètres enregistrés." : "Échec de l'enregistrement.");
    setSaving(false);
  };

  // Rendu d'un champ texte (fonction appelée inline, pas un composant,
  // pour éviter la perte de focus à chaque frappe)
  const textField = (label: string, field: Field, placeholder?: string) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input
        value={(settings?.[field] as string) ?? ""}
        onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <AdminShell active="parametres">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Paramètres du site
      </h1>

      {loading || !settings ? (
        <div className="flex items-center gap-2 text-slate-500 p-6">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-3xl space-y-6">
          {/* Général */}
          <Card>
            <CardHeader><CardTitle className="text-base">Général</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {textField("Nom du site", "siteName", "Livre PDF Gratuit")}
              <div>
                <label className="block text-sm font-medium mb-1">Description du site</label>
                <textarea
                  value={settings.siteDescription ?? ""}
                  onChange={(e) => update("siteDescription", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              {textField("URL du logo", "logo", "https://…")}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {textField("Email", "email", "contact@exemple.com")}
              {textField("Téléphone", "telephone")}
              {textField("Adresse", "address")}
            </CardContent>
          </Card>

          {/* Réseaux sociaux */}
          <Card>
            <CardHeader><CardTitle className="text-base">Réseaux sociaux</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {textField("Facebook", "facebook", "https://facebook.com/…")}
              {textField("Twitter / X", "twitter", "https://x.com/…")}
              {textField("Instagram", "instagram", "https://instagram.com/…")}
              {textField("YouTube", "youtube", "https://youtube.com/…")}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {textField("ID Google Analytics", "googleAnalyticsId", "G-XXXXXXX")}
            </CardContent>
          </Card>

          {/* Accueil */}
          <Card>
            <CardHeader><CardTitle className="text-base">Page d&apos;accueil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {textField("Titre du hero", "heroTitle")}
              {textField("Sous-titre du hero", "heroSubtitle")}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre de livres en vedette
                </label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  value={settings.featuredBooksCount}
                  onChange={(e) => update("featuredBooksCount", Number(e.target.value))}
                  className="max-w-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {message && <span className="text-sm text-slate-600 dark:text-slate-400">{message}</span>}
          </div>
        </form>
      )}
    </AdminShell>
  );
}
