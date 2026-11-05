import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Normalise un nom d'auteur type Internet Archive vers un nom affichable.
// "Hugo, Victor, 1802-1885" -> "Victor Hugo"
export function formatAuthorName(raw: string): string {
  const s = raw
    .replace(/\[.*?\]/g, "")
    .replace(/\d{3,4}\s*-\s*\d{0,4}/g, "")
    .replace(/[;,]\s*$/g, "")
    .trim();
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return (parts[0] || s || raw).trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(date: Date | string, locale: string = "fr-FR"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateRandomColor(): string {
  const colors = [
    "#1e3a5f",
    "#2d5a87",
    "#d4a853",
    "#059669",
    "#7c3aed",
    "#dc2626",
    "#ea580c",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
