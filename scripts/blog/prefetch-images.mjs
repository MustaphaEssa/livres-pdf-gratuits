/**
 * Prépare TOUTES les images du blog depuis un poste qui a accès à Wikimedia Commons
 * (le serveur de production est bloqué par Commons) :
 *   - télécharge les vignettes dans <dossier courant>/public/uploads/blog/
 *   - écrit leurs métadonnées (auteur, licence, lien) dans .commons-manifest.json
 * Ensuite : copier ce dossier dans public/uploads/blog/ du serveur, puis y lancer
 * set-blog-covers.mjs --apply et add-blog-articles.mjs (aucun appel réseau à Commons).
 *
 *   cd <dossier de travail> && node <projet>/scripts/blog/prefetch-images.mjs
 *
 * Les noms de fichiers suivent exactement ceux des scripts serveur :
 *   <slug>-cover, <slug>-in-<n> (set-blog-covers), <slug>-<n> (images d'un nouvel article).
 */
import { commonsImage } from "./commons.mjs";
import { PLAN } from "./image-plan.mjs";
import { articles as adaptations } from "./articles-2026-11-adaptations.mjs";
import { articles as quasimodo } from "./articles-2026-11-quasimodo.mjs";

// Arguments optionnels : préfixes de slug à traiter (sinon tout)
const only = process.argv.slice(2);

const jobs = [];
for (const [slug, plan] of Object.entries(PLAN)) {
  if (plan.cover) jobs.push([plan.cover, `${slug}-cover`]);
  (plan.inline ?? []).forEach((it, i) => jobs.push([it.file, `${slug}-in-${i + 1}`]));
}
for (const a of [...adaptations, ...quasimodo]) {
  if (a.cover) jobs.push([a.cover, `${a.slug}-cover`]);
  [...a.content.matchAll(/^!\[[^\]]*\]\(commons:(.+?)(?:\s+"[^"]*")?\)$/gm)].forEach((m, i) =>
    jobs.push([m[1].trim(), `${a.slug}-${i + 1}`])
  );
}

let ok = 0;
const todo = only.length ? jobs.filter(([, base]) => only.some((p) => base.startsWith(p))) : jobs;
for (const [file, base] of todo) {
  const r = await commonsImage(file, base, "fr");
  if (r) ok++;
  console.log(`${r ? "✓" : "✗"} ${base}`);
}
console.log(`\n${ok}/${jobs.length} image(s) prêtes.`);
