import type { ReactNode } from "react";
import DesignHeader from "./header";
import DesignFooter from "./footer";
import MobileTabbar from "./mobile-tabbar";
import { getCategoriesWithCounts } from "@/lib/books";

/** Habillage commun (charte) : header + contenu + footer + barre mobile. */
export default async function DesignShell({ children }: { children: ReactNode }) {
  const categories = await getCategoriesWithCounts();
  return (
    <div className="ma">
      <DesignHeader />
      <main className="page-main">{children}</main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
