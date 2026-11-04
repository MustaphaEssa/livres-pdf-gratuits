import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookOpen, Users, Globe, Heart } from "lucide-react";
import { getServerI18n } from "@/i18n/server";

export default async function AboutPage() {
  const { t } = await getServerI18n();

  const values = [
    { icon: BookOpen, title: t.about.value1Title, description: t.about.value1Desc },
    { icon: Globe, title: t.about.value2Title, description: t.about.value2Desc },
    { icon: Users, title: t.about.value3Title, description: t.about.value3Desc },
    { icon: Heart, title: t.about.value4Title, description: t.about.value4Desc },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              {t.about.heroTitle}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              {t.about.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                {t.about.missionTitle}
              </h2>
              <div className="prose prose-lg dark:prose-invert mx-auto">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.about.missionP1}
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                  {t.about.missionP2}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">
              {t.about.valuesTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
                >
                  <value.icon className="h-10 w-10 text-amber-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-500 mb-2">1,250+</div>
                <div className="text-slate-600 dark:text-slate-400">{t.about.statsBooks}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-500 mb-2">50,000+</div>
                <div className="text-slate-600 dark:text-slate-400">{t.about.statsDownloads}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-500 mb-2">10,000+</div>
                <div className="text-slate-600 dark:text-slate-400">{t.about.statsUsers}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-500 mb-2">8</div>
                <div className="text-slate-600 dark:text-slate-400">{t.about.statsCategories}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">
              {t.about.teamTitle}
            </h2>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                {t.about.teamP1}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {t.about.teamP2}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
