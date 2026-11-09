"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";

export function SortSelect({
  value,
  basePath = "/catalogue",
}: {
  value: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const sortOptions = [
    { name: t.catalogue.sortPopular, value: "popular" },
    { name: t.catalogue.sortNewest, value: "newest" },
    { name: t.catalogue.sortTitleAsc, value: "title-asc" },
    { name: t.catalogue.sortTitleDesc, value: "title-desc" },
  ];

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value && e.target.value !== "popular") {
      params.set("sort", e.target.value);
    } else {
      params.delete("sort");
    }
    // On revient à la première page quand on change le tri
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  return (
    <select
      className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
      value={value}
      onChange={onChange}
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
  );
}
