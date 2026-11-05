import Link from "next/link";
import Image from "next/image";
import { Download, Eye, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getServerI18n } from "@/i18n/server";

interface BookCardProps {
  book: {
    id: string;
    slug: string;
    title: string;
    author: string;
    authorSlug?: string | null;
    coverImage?: string | null;
    pdfSize?: number | null;
    downloadCount: number;
    viewCount: number;
    rating: number;
    categories?: {
      category: {
        name: string;
        slug: string;
      };
    }[];
  };
  className?: string;
}

export async function BookCard({ book, className }: BookCardProps) {
  const { t } = await getServerI18n();
  return (
    <Card className={cn("overflow-hidden group hover:shadow-lg transition-shadow", className)}>
      {/* Cover Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-4xl font-bold text-slate-300 dark:text-slate-600">
              {book.title.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        {book.categories && book.categories.length > 0 && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-800/80 text-white rounded">
              {book.categories[0].category.name}
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <Link href={`/livre/${book.slug}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-amber-500 transition-colors mb-1">
            {book.title}
          </h3>
        </Link>

        {/* Author */}
        {book.authorSlug ? (
          <Link
            href={`/auteur/${book.authorSlug}`}
            className="text-xs text-slate-500 dark:text-slate-400 mb-2 inline-block hover:text-amber-500 hover:underline"
          >
            {book.author}
          </Link>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{book.author}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {book.downloadCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {book.viewCount}
          </span>
          {book.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {book.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/livre/${book.slug}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-3 w-3 mr-1" />
              {t.book.view}
            </Button>
          </Link>
          <Link href={`/livre/${book.slug}/telecharger`} className="flex-1">
            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600">
              <Download className="h-3 w-3 mr-1" />
              {t.book.download}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
