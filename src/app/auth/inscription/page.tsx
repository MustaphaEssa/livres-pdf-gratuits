"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.passwordsMismatch);
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(t.auth.passwordTooShort);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (res.ok) {
        // Compte créé + connexion automatique (cookie httpOnly)
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t.auth.genericError);
        setLoading(false);
      }
    } catch {
      setError(t.auth.genericError);
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { met: formData.password.length >= 6, text: "Au moins 6 caractères" },
    { met: /[A-Z]/.test(formData.password), text: "Une lettre majuscule" },
    { met: /[0-9]/.test(formData.password), text: "Un chiffre" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
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
            <CardTitle className="text-2xl">{t.auth.registerTitle}</CardTitle>
            <CardDescription>{t.auth.registerSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.auth.fullName}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Votre nom"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="votre@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <Check className={`h-3 w-3 ${req.met ? "text-green-500" : "text-slate-400"}`} />
                        <span className={req.met ? "text-green-600 dark:text-green-400" : "text-slate-500"}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.auth.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" id="terms" className="mt-1 rounded border-slate-300" required />
                <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                  {t.auth.acceptTerms}{" "}
                  <Link href="/conditions-utilisation" className="text-amber-500 hover:underline">
                    {t.auth.terms}
                  </Link>{" "}
                  {t.auth.and}{" "}
                  <Link href="/politique-confidentialite" className="text-amber-500 hover:underline">
                    {t.auth.privacy}
                  </Link>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600"
                disabled={loading}
              >
                {loading ? t.auth.creating : t.auth.signUp}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <p className="text-center text-sm text-slate-500">
                {t.auth.hasAccount}{" "}
                <Link href="/auth/connexion" className="text-amber-500 hover:underline">
                  {t.auth.signInLink}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-amber-500">
            {t.auth.backHome}
          </Link>
        </p>
      </div>
    </div>
  );
}
