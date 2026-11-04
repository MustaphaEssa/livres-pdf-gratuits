"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useSiteSettings } from "@/components/settings-provider";

export default function ContactPage() {
  const { t } = useI18n();
  const settings = useSiteSettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send the data to an API
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-16">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t.contact.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t.contact.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <div>
              <Card>
                <CardContent className="p-6">
                  {submitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        {t.contact.sentTitle}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {t.contact.sentText}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.contact.name}
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={t.contact.namePlaceholder}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.contact.email}
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="votre@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.contact.subject}
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder={t.contact.subjectPlaceholder}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.contact.message}
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder={t.contact.messagePlaceholder}
                          rows={5}
                          className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-amber-500 hover:bg-amber-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {t.contact.send}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t.contact.infoTitle}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{t.contact.email}</p>
                        <p className="text-slate-600 dark:text-slate-400">{settings?.email || "contact@livre-pdf-gratuit.com"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{t.contact.phone}</p>
                        <p className="text-slate-600 dark:text-slate-400">{settings?.telephone || "+212 6XX XXXXXX"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{t.contact.address}</p>
                        <p className="text-slate-600 dark:text-slate-400">{settings?.address || t.contact.addressValue}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t.contact.hoursTitle}
                  </h3>
                  <div className="space-y-2 text-slate-600 dark:text-slate-400">
                    <p>{t.contact.hoursWeek}</p>
                    <p>{t.contact.hoursSat}</p>
                    <p>{t.contact.hoursSun}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t.contact.otherTitle}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {t.contact.otherText}
                  </p>
                  <div className="flex gap-4">
                    <a href="#" className="text-slate-400 hover:text-amber-500 transition-colors">
                      Facebook
                    </a>
                    <a href="#" className="text-slate-400 hover:text-amber-500 transition-colors">
                      Twitter
                    </a>
                    <a href="#" className="text-slate-400 hover:text-amber-500 transition-colors">
                      Instagram
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
