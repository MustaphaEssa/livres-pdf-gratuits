// Squelette de la fiche livre affiché instantanément pendant le chargement serveur
export default function BookLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 py-8">
        <div className="h-4 w-80 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-6" />
            <div className="space-y-3">
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
