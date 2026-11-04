import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Home, Search } from "lucide-react";
import { getServerI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getServerI18n();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-8xl font-bold text-amber-500 mb-4">404</div>
            
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {t.notFound.title}
            </h1>

            <p className="text-slate-600 dark:text-slate-400 mb-8">
              {t.notFound.text}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button className="bg-amber-500 hover:bg-amber-600">
                  <Home className="h-4 w-4 mr-2" />
                  {t.notFound.home}
                </Button>
              </Link>
              <Link href="/catalogue">
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  {t.notFound.browse}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
