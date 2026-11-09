"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";

function ResetForm() {
  const router = useRouter();
  const { t } = useI18n();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.auth.passwordsMismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec");
      setDone(true);
      setTimeout(() => router.push("/auth/connexion"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="text-center text-sm text-red-500">{t.auth.invalidLink}</p>
    );
  }

  if (done) {
    return (
      <p className="text-center text-sm text-green-600 dark:text-green-400">
        {t.auth.resetDone}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t.auth.newPassword}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t.auth.confirm}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600"
      >
        {loading ? t.compte.saving : t.auth.resetButton}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageInner />;
}

function ResetPasswordPageInner() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <BookOpen className="h-10 w-10 text-amber-500" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              Livre PDF<span className="text-amber-500">Gratuit</span>
            </span>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t.auth.resetTitle}</CardTitle>
            <CardDescription>{t.auth.resetSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-center text-slate-500">…</p>}>
              <ResetForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
