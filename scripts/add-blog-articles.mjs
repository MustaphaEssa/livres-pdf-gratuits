/**
 * Ajoute 3 articles de blog à la base de données.
 *
 * Utilise automatiquement DATABASE_URL du fichier .env présent dans le dossier.
 * À lancer sur le serveur de PRODUCTION (là où se trouve le .env de prod) :
 *
 *   node scripts/add-blog-articles.mjs
 *
 * Idempotent : un article déjà présent (même slug) est ignoré, rien n'est écrasé.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const AUTHOR = "La rédaction";

const articles = [
  {
    slug: "meilleures-applications-lecture-pdf-2026",
    title: "Les meilleures applications pour lire vos livres PDF en 2026",
    categorySlug: "tutoriels",
    excerpt:
      "Lire un PDF confortablement ne se résume pas à l'ouvrir dans un navigateur. Tour d'horizon des meilleures applications, sur mobile comme sur ordinateur, pour profiter pleinement de vos livres.",
    metaTitle:
      "Meilleures applications pour lire un PDF en 2026 (mobile et PC)",
    metaDescription:
      "Notre sélection d'applications gratuites et pratiques pour lire vos livres PDF sur Android, iPhone, Windows et Mac, avec mode nuit, annotations et synchronisation.",
    tags: "lecture, pdf, applications, liseuse, mobile",
    content: `Télécharger un livre au format PDF, c'est facile. Le lire dans de bonnes conditions, c'est une autre histoire. Un PDF ouvert à la va-vite dans un onglet de navigateur fatigue vite les yeux : pas de mode sombre, pas de mémorisation de la page, impossible d'annoter. Pourtant, avec la bonne application, la lecture d'un livre numérique devient aussi agréable que celle d'un livre papier. Voici notre sélection, testée au quotidien, pour lire confortablement sur n'importe quel appareil.

Sur Android, l'application qui revient le plus souvent dans les recommandations est Librera Reader. Gratuite, elle gère aussi bien le PDF que l'EPUB, propose un vrai mode nuit, le défilement vertical ou page par page, et garde en mémoire l'endroit exact où vous vous êtes arrêté. Son grand atout : elle lit vos dossiers locaux sans vous forcer à créer un compte. Pour une lecture plus épurée, Moon+ Reader reste une référence, avec des réglages fins de luminosité et de marges.

Sur iPhone et iPad, l'application Livres d'Apple fait déjà très bien le travail pour les PDF : il suffit d'ouvrir le fichier et de choisir « Copier vers Livres » pour le retrouver dans votre bibliothèque, synchronisée sur tous vos appareils. Si vous cherchez plus de souplesse, PDF Expert offre des annotations précises et une navigation rapide dans les longs documents, ce qui en fait un excellent choix pour les manuels et les livres techniques.

Sur ordinateur, inutile d'installer un logiciel lourd. Sous Windows comme sous Mac, un lecteur léger comme SumatraPDF (Windows) suffit pour une lecture fluide et rapide, même sur une vieille machine. Si vous lisez beaucoup et souhaitez surligner, prendre des notes et organiser votre bibliothèque, le logiciel gratuit Calibre reste incontournable : il lit, convertit et classe tous vos ebooks au même endroit.

Quel que soit votre appareil, trois réglages changent vraiment le confort de lecture. Activez d'abord le mode sombre ou sépia le soir : il réduit nettement la fatigue oculaire. Ajustez ensuite la taille de la police ou le niveau de zoom pour éviter de plisser les yeux. Enfin, pensez à activer la reprise automatique de lecture, pour ne jamais chercher votre page.

Un dernier conseil : rangez vos PDF dans un dossier clair, synchronisé avec un service cloud (Drive, iCloud ou équivalent). Vous retrouverez ainsi votre bibliothèque sur tous vos écrans, et vous pourrez commencer un livre sur votre téléphone dans les transports pour le finir le soir sur votre tablette. La lecture numérique n'a d'intérêt que si elle s'adapte à votre rythme — et avec ces quelques applications, c'est le cas.`,
  },
  {
    slug: "domaine-public-telecharger-livres-gratuitement-legalement",
    title:
      "Domaine public : pourquoi vous pouvez télécharger ces livres gratuitement et légalement",
    categorySlug: "culture",
    excerpt:
      "Des milliers de chefs-d'œuvre sont librement téléchargeables, et c'est parfaitement légal. On vous explique ce qu'est le domaine public et comment en profiter sans crainte.",
    metaTitle: "Le domaine public expliqué : télécharger des livres gratuitement et légalement",
    metaDescription:
      "Qu'est-ce que le domaine public ? Pourquoi certains livres sont-ils gratuits et légaux à télécharger ? Comprendre les droits d'auteur pour lire l'esprit tranquille.",
    tags: "domaine public, droits d'auteur, culture, livres gratuits, légalité",
    content: `On associe souvent « livre gratuit » à « copie illégale ». C'est une confusion dommage, car une immense partie de la littérature mondiale est librement et légalement téléchargeable. Ces œuvres appartiennent au domaine public, une notion essentielle à comprendre pour lire l'esprit tranquille — et pour mesurer la richesse du patrimoine accessible à tous.

Le principe est simple. Lorsqu'un auteur écrit un livre, il en détient les droits : lui seul décide de sa diffusion, et ses héritiers en profitent après sa mort. Mais cette protection n'est pas éternelle. En France et dans la plupart des pays européens, une œuvre entre dans le domaine public soixante-dix ans après la mort de son auteur. À partir de ce moment, elle appartient à tout le monde : chacun peut la lire, la copier, la partager, la traduire ou même la rééditer, sans demander d'autorisation ni payer de droits.

Concrètement, cela représente des trésors. Les romans de Victor Hugo, de Jules Verne, d'Émile Zola ou de Flaubert sont dans le domaine public. Il en va de même pour les contes, la philosophie classique, la poésie du XIXe siècle et une grande partie de la littérature étrangère ancienne. Télécharger « Les Misérables » ou « Vingt mille lieues sous les mers » au format PDF est donc parfaitement légal : personne ne détient plus de droits exclusifs sur ces textes.

Attention toutefois à une nuance importante : si l'œuvre d'origine est libre, certaines éditions récentes ne le sont pas forcément. Une nouvelle traduction, une préface inédite, des illustrations originales ou une mise en page particulière peuvent, elles, rester protégées par le droit d'auteur du traducteur ou de l'éditeur. En pratique, pour les grands classiques, il existe presque toujours une version ancienne et libre de droits, ce qui vous met à l'abri.

Comment savoir si un livre est dans le domaine public ? La règle des soixante-dix ans après le décès de l'auteur est votre premier repère. Un auteur mort avant 1954 a donc, en règle générale, son œuvre dans le domaine public aujourd'hui. Des bibliothèques numériques de référence, nationales ou associatives, recensent par ailleurs des catalogues entiers d'ouvrages libres, vérifiés juridiquement.

Comprendre le domaine public, c'est redécouvrir une évidence : la culture classique n'a pas de prix d'entrée. Ces livres ont été écrits il y a longtemps, ils ont traversé les générations, et la loi considère qu'ils appartiennent désormais à l'humanité tout entière. En les téléchargeant gratuitement, vous ne contournez rien : vous profitez simplement d'un bien commun. C'est exactement l'esprit dans lequel nous mettons ces ouvrages à votre disposition.`,
  },
  {
    slug: "pdf-epub-mobi-quel-format-choisir-ebook",
    title: "PDF, EPUB ou MOBI : quel format choisir pour lire vos ebooks ?",
    categorySlug: "tutoriels",
    excerpt:
      "PDF, EPUB, MOBI... Les formats d'ebooks ne se valent pas selon votre appareil et votre usage. Voici comment choisir, et comment passer de l'un à l'autre en quelques clics.",
    metaTitle: "PDF, EPUB ou MOBI : quel format d'ebook choisir ? (guide 2026)",
    metaDescription:
      "Différences entre PDF, EPUB et MOBI, avantages et inconvénients de chaque format d'ebook, et comment convertir vos livres facilement selon votre liseuse ou téléphone.",
    tags: "pdf, epub, mobi, formats, conversion, ebook",
    content: `Vous avez trouvé un livre à télécharger, mais on vous propose plusieurs formats : PDF, EPUB, parfois MOBI. Lequel choisir ? La réponse dépend surtout de l'appareil sur lequel vous allez lire, et du type d'ouvrage. Prendre deux minutes pour comprendre ces différences vous évitera bien des frustrations.

Le PDF est le format le plus répandu et le plus universel. Son grand avantage : il conserve exactement la mise en page d'origine. Ce qui est pensé pour être imprimé — un manuel, une bande dessinée, un livre illustré, un document avec des tableaux ou des schémas — sera parfaitement rendu en PDF. Son défaut est l'envers de cette qualité : la page est figée. Sur un petit écran de téléphone, le texte ne se réadapte pas, et vous devez zoomer et faire glisser la page pour lire. Le PDF est donc idéal sur ordinateur, tablette et pour tout ce qui est richement mis en page.

L'EPUB, lui, est le format roi de la lecture sur mobile et liseuse. Son texte est « fluide » : il se réadapte automatiquement à la taille de votre écran et à la police que vous choisissez. Vous grossissez les caractères ? Le texte se réorganise tout seul, sans zoom. Pour un roman, un essai ou tout livre composé surtout de texte, l'EPUB offre un confort nettement supérieur au PDF sur un petit appareil. C'est le format recommandé pour la grande majorité des liseuses du marché.

Le MOBI est un format plus ancien, historiquement lié aux premières liseuses Kindle. Il fonctionne sur le même principe de texte fluide que l'EPUB. Aujourd'hui, il tend à disparaître au profit de l'EPUB et des formats récents d'Amazon, mais vous le croiserez encore sur d'anciens fichiers. Si votre appareil ne le lit pas, pas d'inquiétude : une simple conversion règle le problème.

Car la bonne nouvelle, c'est que passer d'un format à l'autre est à la fois gratuit et simple. Le logiciel Calibre, disponible sur Windows, Mac et Linux, fait cela très bien : vous importez votre livre, un clic droit, « Convertir », et vous choisissez le format de sortie. En quelques secondes, votre PDF devient un EPUB prêt à être envoyé sur votre liseuse. Des outils de conversion en ligne existent aussi pour un fichier ponctuel, sans rien installer.

Notre conseil, en résumé : choisissez le PDF pour les livres illustrés, techniques ou que vous comptez imprimer, et lisez-les de préférence sur grand écran. Préférez l'EPUB pour les romans et les essais que vous lirez sur téléphone ou liseuse. Et gardez Calibre sous la main : avec lui, le format du fichier ne sera plus jamais un obstacle. Vous téléchargez le livre qui vous intéresse, et vous le mettez au format qui vous convient.`,
  },
];

async function main() {
  for (const a of articles) {
    const existing = await prisma.post.findUnique({ where: { slug: a.slug } });
    if (existing) {
      console.log("DÉJÀ PRÉSENT, ignoré :", a.slug);
      continue;
    }
    const cat = await prisma.category.findUnique({
      where: { slug: a.categorySlug },
    });
    if (!cat) {
      console.warn(
        `Catégorie « ${a.categorySlug} » introuvable — article créé sans catégorie.`
      );
    }
    await prisma.post.create({
      data: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        author: AUTHOR,
        isPublished: true,
        publishedAt: new Date(),
        tags: a.tags,
        metaTitle: a.metaTitle,
        metaDescription: a.metaDescription,
        categories: cat ? { create: [{ categoryId: cat.id }] } : undefined,
      },
    });
    console.log("CRÉÉ :", a.slug);
  }
  console.log("Terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
