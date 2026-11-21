// Images des articles déjà publiés (couverture + images dans le texte), utilisées par
// set-blog-covers.mjs et prefetch-images.mjs. Fichiers Wikimedia Commons, licences libres.

/**
 * cover : fichier Commons de la couverture.
 * inline : images insérées APRÈS le premier bloc (paragraphe ou intertitre) qui
 *          commence par `after` (ou après le bloc n° `after` si c'est un nombre).
 */
export const PLAN = {
  // ---------------------------------------------------------------- anciens articles (FR)
  "top-10-romans-classiques-a-lire": {
    cover: "File:Halki Seminary library old books Heybeliada 2024.jpg",
    inline: [
      {
        after: 0,
        file: "File:Bibliothèque nationale de France, Salle Labrouste, 14 September 2019 01.jpg",
        alt: "La salle Labrouste de la Bibliothèque nationale de France",
        caption: "La salle Labrouste, à la Bibliothèque nationale de France",
      },
    ],
  },
  "comment-telecharger-lire-livre-pdf": {
    cover: "File:Person reading an ebook.jpg",
    inline: [
      {
        after: 1,
        file: "File:Kobo H20 e-reader.jpg",
        alt: "Une liseuse électronique",
        caption: "Une liseuse : idéale pour lire le format EPUB",
      },
    ],
  },
  "histoire-du-livre-numerique": {
    cover: "File:Gutenberg Bible on display at the U.S. Library of Congress.jpg",
    inline: [
      {
        after: 0,
        file: "File:Michael S. Hart's Teletype 3.png",
        alt: "Le téléscripteur de Michael Hart, fondateur du Projet Gutenberg",
        caption: "Le téléscripteur de Michael Hart, fondateur du Projet Gutenberg",
      },
      {
        after: 1,
        file: "File:EReading devices.JPG",
        alt: "Plusieurs liseuses électroniques",
        caption: "Des liseuses à encre électronique",
      },
    ],
  },
  "meilleures-applications-lecture-pdf-2026": {
    cover: "File:Reading on an e-book reader (Unsplash).jpg",
    inline: [
      {
        after: 3,
        file: "File:Person reading an ebook.jpg",
        alt: "Lecture d'un livre numérique",
        caption: "Lire un livre numérique confortablement",
      },
    ],
  },
  "domaine-public-telecharger-livres-gratuitement-legalement": {
    cover: "File:LOC Main Reading Room Highsmith.jpg",
    inline: [
      {
        after: 2,
        file: "File:Victor Hugo by Étienne Carjat 1876 - full.jpg",
        alt: "Victor Hugo photographié par Étienne Carjat en 1876",
        caption: "Victor Hugo par Étienne Carjat (1876) : toute son œuvre est dans le domaine public",
      },
      {
        after: 4,
        file: "File:Gutenberg Bible, Library of Congress, 1944.jpg",
        alt: "La Bible de Gutenberg à la Bibliothèque du Congrès",
        caption: "La Bible de Gutenberg, l'un des premiers livres imprimés",
      },
    ],
  },
  "pdf-epub-mobi-quel-format-choisir-ebook": {
    inline: [
      {
        after: 2,
        file: "File:Kobo ereader touch black front.JPG",
        alt: "Une liseuse Kobo",
        caption: "Une liseuse Kobo, qui lit nativement l'EPUB",
      },
      {
        after: 3,
        file: "File:2023 Amazon Kindle Paperwhite (2).jpg",
        alt: "Une liseuse Kindle Paperwhite",
        caption: "Une liseuse Kindle",
      },
    ],
  },
  // ---------------------------------------------------------------- articles du 20/11 (FR)
  "par-ou-commencer-zola-rougon-macquart": {
    cover: "File:The mining village illustration from Germinal by Emile Zola（Drawing by Jules Férat）.jpg",
    inline: [
      {
        after: "## Les 5 meilleurs romans",
        file: "File:Émile Zola Nadar.jpg",
        alt: "Portrait d'Émile Zola par Nadar",
        caption: "Émile Zola photographié par Nadar",
      },
    ],
  },
  "jules-verne-par-quel-roman-commencer": {
    cover: "File:'Twenty Thousand Leagues Under the Sea' by Neuville and Riou 027.jpg",
    inline: [
      {
        after: 0,
        file: "File:Félix Nadar 1820-1910 portraits Jules Verne (restoration).jpg",
        alt: "Portrait de Jules Verne par Nadar",
        caption: "Jules Verne photographié par Nadar",
      },
    ],
  },
  "classiques-lycee-lire-gratuitement-pdf": {
    cover: "File:Œuvres de Molière. Volume 4. LDUT411(4).jpg",
    inline: [
      {
        after: "### Gustave Flaubert, Madame Bovary",
        file: "File:Portrait de Gustave Flaubert vers 1865-1869. - btv1b10053467c.jpg",
        alt: "Portrait de Gustave Flaubert par Nadar",
        caption: "Gustave Flaubert photographié par Nadar",
      },
      {
        after: "### Guy de Maupassant, Le Horla",
        file: "File:Le Horla, Paris, Paul Ollendorff (1887).jpg",
        alt: "Couverture de l'édition originale du Horla, 1887",
        caption: "Le Horla, édition originale (Ollendorff, 1887)",
      },
    ],
  },
  "livres-audio-gratuits-francais-ou-ecouter": {
    cover: "File:Old books - old textures.jpg",
    inline: [
      {
        after: "## Quelques idées pour commencer",
        file: "File:Félix Nadar 1820-1910 portraits Jules Verne (restoration).jpg",
        alt: "Portrait de Jules Verne par Nadar",
        caption: "Jules Verne, dont les romans d'aventure se prêtent bien à l'écoute",
      },
    ],
  },
  "victor-hugo-oeuvres-essentielles-a-lire": {
    cover: "File:Victor Hugo by Étienne Carjat 1876 - full.jpg",
    inline: [
      {
        after: "### Notre-Dame de Paris (1831)",
        file: "File:Hugo - Notre-Dame de Paris, 1844 p0610.png",
        alt: "Illustration de l'édition de 1844 de Notre-Dame de Paris",
        caption: "Notre-Dame de Paris, édition illustrée de 1844",
      },
      {
        after: "### Les Misérables (1862)",
        file: "File:Gavroche (Les Misérables).jpg",
        alt: "Gavroche, illustration d'Émile Bayard",
        caption: "Gavroche, par Émile Bayard",
      },
    ],
  },
  // ---------------------------------------------------------------- articles du 20/11 (EN)
  "is-quasimodo-real-hunchback-of-notre-dame": {
    cover: "File:Hugo - Notre-Dame de Paris, 1844 p0274.png",
    inline: [
      {
        after: "## The novel came first",
        file: "File:Victor Hugo by Étienne Carjat 1876 - full.jpg",
        alt: "Victor Hugo photographed by Étienne Carjat",
        caption: "Victor Hugo, photographed by Étienne Carjat",
      },
    ],
  },
  "les-miserables-reading-guide-five-volumes": {
    cover: "File:Cosette-sweeping-les-miserables-emile-bayard-1862.jpg",
    inline: [
      {
        after: "## Volume 3: Marius",
        file: "File:Gavroche (Les Misérables).jpg",
        alt: "Gavroche, illustration by Émile Bayard",
        caption: "Gavroche, by Émile Bayard",
      },
    ],
  },
  "public-domain-day-2027-what-becomes-free": {
    cover: "File:Old Geodesy library books.jpg",
    inline: [
      {
        after: "## United States: highlights from 1931",
        file: "File:George Charles Beresford - Virginia Woolf in 1902 - Restoration.jpg",
        alt: "Virginia Woolf photographed by George Charles Beresford in 1902",
        caption: "Virginia Woolf in 1902. Her novel The Waves (1931) enters the US public domain in 2027",
      },
    ],
  },
  "free-christmas-stories-public-domain": {
    cover: "File:Mr Fezziwig's Ball - A Christmas Carol (1843), frontispiece - BL.jpg",
    inline: [
      {
        after: "## A Victorian tradition",
        file: "File:Marley's Ghost-John Leech, 1843.jpg",
        alt: "Marley's Ghost, illustration by John Leech for A Christmas Carol, 1843",
        caption: "Marley's Ghost, by John Leech, from the first edition of A Christmas Carol (1843)",
      },
    ],
  },
  "free-classic-audiobooks-public-domain-guide": {
    cover: "File:Old books - old textures.jpg",
    inline: [
      {
        after: "### Public libraries",
        file: "File:LOC Main Reading Room Highsmith.jpg",
        alt: "The Main Reading Room of the Library of Congress",
        caption: "The Main Reading Room of the Library of Congress, Washington",
      },
    ],
  },
};
