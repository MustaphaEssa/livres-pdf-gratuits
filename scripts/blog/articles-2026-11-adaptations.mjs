// « Top 10 des livres adaptés en film » et « Top 10 des livres adaptés en série »,
// en français et en anglais (4 articles, novembre 2026).
//
// - Liens /livre/@gNNN : livre importé depuis Gutenberg (n° NNN), remplacé à l'insertion
//   par l'adresse réelle de la fiche (texte seul si absent) — voir add-blog-articles.mjs.
// - Images « commons:File:… » et champ `cover` : vraies images du domaine public sur
//   Wikimedia Commons, téléchargées et hébergées sur le site, crédit ajouté automatiquement
//   (voir scripts/blog/commons.mjs). Aucune affiche de film (protégées) : illustrations
//   et éditions originales des romans.
// Faits vérifiés le 2026-11-20 (sources en bas de chaque article).

const IMG = {
  odyssey: "File:John William Waterhouse - Ulysses and the Sirens (1891).jpg",
  wuthering: "File:Houghton Lowell 1238.5 (A) - Wuthering Heights, 1847.jpg",
  frankenstein: "File:Frontispiece to Frankenstein 1831.jpg",
  pride: "File:Houghton Typ 805.94.8320 - Pride and Prejudice, 1894, Hugh Thomson - Protested.jpg",
  prideWide: "File:Thomson-PP-Ch57.JPG",
  monteCristo: "File:Maximilien Morrel.jpg",
  notreDame: "File:Hugo - Notre-Dame de Paris, 1844 p0274.png",
  germinal: "File:The mining village illustration from Germinal by Emile Zola（Drawing by Jules Férat）.jpg",
  dracula: "File:Dracula-First-Edition-1897 (cropped).jpg",
  sherlock: "File:Portrait of Sherlock Holmes by Sidney Paget-Cropped.jpg",
  cosette: "File:Cosette-sweeping-les-miserables-emile-bayard-1862.jpg",
};

const SRC = {
  monteCristo: "[AlloCiné](https://www.allocine.fr/article/fichearticle_gen_carticle=1000091407.html)",
  odyssey: "[TheWrap](https://www.thewrap.com/creative-content/movies/the-odyssey-box-office-1-billion/)",
  wuthering:
    "[GamesRadar](https://www.gamesradar.com/entertainment/romance-movies/wuthering-heights-is-the-first-movie-of-2026-to-pass-the-usd100-million-mark-at-the-box-office/)",
  frankenstein: "[Netflix Tudum](https://www.netflix.com/tudum/articles/frankenstein-guillermo-del-toro-release-date-cast-photos)",
  quasimodo:
    "[What's on Netflix](https://www.whats-on-netflix.com/news/the-hunchback-soul-of-paris-everything-we-know-about-netflixs-new-quasimodo-movie/)",
  prideNetflixFr:
    "[Netflix News](https://www.netflix-news.com/articles/programmes/series/1617212-orgueil-et-prejuges-netflix-adapte-le-roman-de-jane-austen-en-2026-avec-emma-corrin-et-jack-lowden-11-09-2026/)",
  prideNetflixEn: "[Wikipedia](https://en.wikipedia.org/wiki/Pride_and_Prejudice_(2026_TV_series))",
  comtesse:
    "[Dexerto](https://www.dexerto.fr/films-series/la-comtesse-de-monte-cristo-calendrier-sortie-episodes-streaming-tv-1664168/)",
  comteFrance2:
    "[Ozap](https://www.ozap.com/actu/france-2-annonce-la-date-de-diffusion-de-sa-serie-internationale-adaptee-du-comte-de-monte-cristo/652748)",
  miserables: "[PBS Masterpiece](https://www.pbs.org/wgbh/masterpiece/specialfeatures/news-les-miserables-comes-to-masterpiece)",
  greatExpectations: "[TV Insider](https://tvinsider.com/1085439/great-expectations-2023-series-fx-hulu-olivia-colman)",
};

export const articles = [
  // =========================================================================
  // FILMS — FR
  // =========================================================================
  {
    language: "fr",
    slug: "top-10-livres-adaptes-en-film",
    title: "Top 10 des livres adaptés en film (à lire gratuitement avant de regarder)",
    categorySlug: "culture",
    cover: IMG.odyssey,
    excerpt:
      "Monte-Cristo, L'Odyssée, Frankenstein, Orgueil et préjugés… Les 10 grands romans qui ont donné des films marquants, et où les lire gratuitement.",
    metaTitle: "Top 10 des livres adaptés en film : les classiques à lire",
    metaDescription:
      "Monte-Cristo, L'Odyssée, Frankenstein, Orgueil et préjugés… 10 romans devenus des films cultes, et les livres à lire gratuitement avant de regarder.",
    tags: "adaptation, films, romans, cinéma, classiques",
    content: `2026 a été une grande année pour les classiques au cinéma : *The Odyssey* de Christopher Nolan a dépassé le milliard de dollars, et *Les Hauts de Hurlevent* d'Emerald Fennell a ouvert l'année. Le cinéma n'a jamais cessé de puiser dans les grands romans.

Point commun des dix livres de ce classement : ils sont tous dans le domaine public. Vous pouvez donc les lire gratuitement, avant ou après le film.

## 1. Le Comte de Monte-Cristo, Alexandre Dumas

Le roman de vengeance par excellence. Edmond Dantès, emprisonné à tort au château d'If, revient des années plus tard sous l'identité d'un mystérieux comte. Le film de Matthieu Delaporte et Alexandre de La Patellière (2024), avec Pierre Niney, a dépassé les 9 millions d'entrées en France.

![Maximilien Morrel, illustration du Comte de Monte-Cristo d'après Paul Gavarni](commons:${IMG.monteCristo} "Maximilien Morrel, personnage du Comte de Monte-Cristo, gravure d'après Paul Gavarni")

[Lire Le Comte de Monte-Cristo gratuitement](/livre/le-comte-de-monte-cristo).

## 2. L'Odyssée, Homère

Le long retour d'Ulysse vers Ithaque, ses ruses, ses monstres et ses tentations. L'adaptation de Christopher Nolan, sortie en juillet 2026, est l'un des plus grands succès de l'année. [Lire L'Odyssée](/livre/@g14286) dans la traduction de Leconte de Lisle.

## 3. Les Trois Mousquetaires, Alexandre Dumas

D'Artagnan, Athos, Porthos, Aramis et la redoutable Milady. Adapté des dizaines de fois, le roman a récemment donné le diptyque de Martin Bourboulon, *D'Artagnan* et *Milady* (2023), avec François Civil et Eva Green. [Lire Les Trois Mousquetaires](/livre/les-trois-mousquetaires).

## 4. Frankenstein, Mary Shelley

Le savant qui crée la vie, et la créature qui se retourne contre lui. Guillermo del Toro en a tiré un film pour Netflix (novembre 2025), avec Oscar Isaac en Victor Frankenstein et Jacob Elordi en Créature.

![Frontispice de Frankenstein, édition de 1831, gravure de Theodor von Holst](commons:${IMG.frankenstein} "Le frontispice de l'édition de 1831 de Frankenstein")

[Lire Frankenstein](/livre/frankenstein-ou-le-promethee-moderne-volume-1-of-3).

## 5. Les Hauts de Hurlevent, Emily Brontë

L'amour destructeur de Heathcliff et Catherine sur les landes du Yorkshire. Le film d'Emerald Fennell (février 2026), avec Margot Robbie et Jacob Elordi, a divisé la critique par ses libertés avec le roman. Raison de plus pour lire l'original.

![Page de titre de la première édition des Hauts de Hurlevent, 1847](commons:${IMG.wuthering} "Première édition, 1847, publiée sous le pseudonyme d'Ellis Bell")

Le roman en anglais : [Wuthering Heights](/livre/@g768).

## 6. Orgueil et préjugés, Jane Austen

Elizabeth Bennet, Mr Darcy et l'art du malentendu. Le film de Joe Wright (2005), avec Keira Knightley et Matthew Macfadyen, reste l'une des adaptations préférées du public.

![Illustration de Hugh Thomson pour Orgueil et préjugés, 1894](commons:${IMG.pride} "Illustration de Hugh Thomson pour l'édition de 1894")

Le roman en anglais : [Pride and Prejudice](/livre/@g1342).

## 7. Notre-Dame de Paris, Victor Hugo

Quasimodo, Esmeralda et la cathédrale. Du dessin animé Disney (1996) au film Netflix *Quasimodo, l'âme de Paris* (27 novembre 2026), qui imagine l'homme ayant pu inspirer Hugo.

![Illustration de l'édition de 1844 de Notre-Dame de Paris](commons:${IMG.notreDame} "Illustration de l'édition de 1844 de Notre-Dame de Paris")

[Lire Notre-Dame de Paris](/livre/notre-dame-de-paris-1482).

## 8. Germinal, Émile Zola

La grève des mineurs du Nord. Claude Berri en a fait en 1993 un film à grand spectacle avec Renaud et Gérard Depardieu.

![Le coron, illustration de Jules Férat pour Germinal](commons:${IMG.germinal} "Le village de mineurs, dessin de Jules Férat pour Germinal")

[Lire Germinal](/livre/germinal), et notre guide [par où commencer Zola](/blog/par-ou-commencer-zola-rougon-macquart).

## 9. Gatsby le Magnifique, F. Scott Fitzgerald

Les fêtes somptueuses de Jay Gatsby et son amour impossible pour Daisy, dans l'Amérique des années 1920. Baz Luhrmann l'a adapté en 2013 avec Leonardo DiCaprio. Le roman en anglais : [The Great Gatsby](/livre/@g64317).

## 10. Les Quatre Filles du docteur March, Louisa May Alcott

Meg, Jo, Beth et Amy grandissent pendant la guerre de Sécession. L'adaptation de Greta Gerwig (2019), avec Saoirse Ronan, a fait découvrir le roman à une nouvelle génération. En anglais : [Little Women](/livre/@g514).

## Lire avant ou après le film ?

Les deux se défendent. Lire avant permet de juger l'adaptation et de garder ses propres images en tête. Lire après permet de retrouver les personnages, avec tout ce que le film a dû couper : un roman de 1 000 pages ne tient jamais dans deux heures.

Envie de séries plutôt ? Voir notre [top 10 des livres adaptés en série](/blog/top-10-livres-adaptes-en-serie).

## Sources

- Monte-Cristo (2024), plus de 9 millions d'entrées : ${SRC.monteCristo}
- The Odyssey, plus d'un milliard de dollars : ${SRC.odyssey}
- Les Hauts de Hurlevent d'Emerald Fennell : ${SRC.wuthering}
- Frankenstein de Guillermo del Toro : ${SRC.frankenstein}
- Quasimodo, l'âme de Paris : ${SRC.quasimodo}

*Informations vérifiées le 20 novembre 2026.*`,
  },

  // =========================================================================
  // SÉRIES — FR
  // =========================================================================
  {
    language: "fr",
    slug: "top-10-livres-adaptes-en-serie",
    title: "Top 10 des livres adaptés en série (à lire gratuitement)",
    categorySlug: "culture",
    cover: IMG.prideWide,
    excerpt:
      "Orgueil et préjugés, Sherlock, Lupin, Les Misérables, Monte-Cristo… Les 10 romans qui ont donné les meilleures séries, et où les lire gratuitement.",
    metaTitle: "Top 10 des livres adaptés en série : les romans à lire",
    metaDescription:
      "Orgueil et préjugés, Sherlock, Lupin, Les Misérables… Les 10 romans devenus des séries marquantes, et les livres à lire gratuitement.",
    tags: "adaptation, séries, romans, netflix, bbc, classiques",
    content: `La série a un avantage sur le cinéma : le temps. Six, huit ou dix épisodes permettent de garder les intrigues secondaires qu'un film doit couper. C'est pourquoi les grands romans du XIXe siècle s'y prêtent si bien. Et le mouvement continue : Netflix lance une nouvelle série *Orgueil et préjugés* le 3 décembre 2026.

Les dix romans de ce classement sont tous dans le domaine public : vous pouvez les lire gratuitement.

## 1. Orgueil et préjugés (BBC 1995, Netflix 2026)

La mini-série de la BBC de 1995, avec Colin Firth, est restée culte. Netflix propose sa propre version le 3 décembre 2026, en six épisodes, écrite par Dolly Alderton, avec Emma Corrin, Olivia Colman et Jack Lowden. Le roman en anglais : [Pride and Prejudice](/livre/@g1342).

## 2. Sherlock (BBC, 2010)

Benedict Cumberbatch et Martin Freeman transposent le détective de Conan Doyle dans le Londres d'aujourd'hui.

![Sherlock Holmes dessiné par Sidney Paget](commons:${IMG.sherlock} "Sherlock Holmes par Sidney Paget, l'illustrateur qui a fixé son image")

Les enquêtes d'origine sont libres de droits (en anglais) : [Les Aventures de Sherlock Holmes](/livre/@g1661) et [Le Chien des Baskerville](/livre/@g2852).

## 3. Lupin (Netflix, 2021)

Omar Sy incarne Assane Diop, un homme qui s'inspire des aventures d'Arsène Lupin pour venger son père. Une série qui a donné envie à beaucoup de spectateurs de lire Maurice Leblanc : [Arsène Lupin, gentleman cambrioleur](/livre/arsene-lupin-gentleman-cambrioleur).

## 4. Le Comte de Monte-Cristo (France 2, 2025) et La Comtesse de Monte-Cristo (TF1, 2026)

Deux séries en deux ans : une coproduction internationale avec Sam Claflin, diffusée sur France 2 à partir de décembre 2025, puis *La Comtesse de Monte-Cristo* avec Audrey Fleurot, qui fait de Mercédès l'héroïne de la vengeance. [Lire le roman](/livre/le-comte-de-monte-cristo).

## 5. Les Misérables (BBC, 2018)

Six épisodes, sans chansons, adaptés par Andrew Davies, avec Dominic West en Jean Valjean, David Oyelowo en Javert et Olivia Colman en Madame Thénardier.

![Cosette balayant, illustration d'Émile Bayard pour Les Misérables, 1862](commons:${IMG.cosette} "Cosette, par Émile Bayard (1862) : l'image la plus célèbre du roman")

Le roman en anglais, en cinq volumes : notre [guide des Misérables](/blog/les-miserables-reading-guide-five-volumes) vous aide à vous y retrouver.

## 6. Guerre et Paix (BBC, 2016)

Andrew Davies, encore lui, adapte le monument de Tolstoï avec Lily James, Paul Dano et James Norton. Le roman en anglais : [War and Peace](/livre/@g2600).

## 7. Les Grandes Espérances (BBC / FX, 2023)

Steven Knight (*Peaky Blinders*) revisite Dickens dans une version sombre, avec Olivia Colman en Miss Havisham. [Great Expectations](/livre/@g1400) (en anglais).

## 8. Le Tour du monde en 80 jours (2021)

David Tennant reprend le rôle de Phileas Fogg dans une série d'aventure familiale. [Lire Le Tour du monde en quatre-vingts jours](/livre/le-tour-du-monde-en-quatre-vingts-jours) et notre guide [par quel Jules Verne commencer](/blog/jules-verne-par-quel-roman-commencer).

## 9. Dracula (BBC / Netflix, 2020)

Steven Moffat et Mark Gatiss, les créateurs de *Sherlock*, réinventent le comte en trois épisodes, avec Claes Bang.

![Couverture de la première édition de Dracula, 1897](commons:${IMG.dracula} "La première édition de Dracula, 1897")

Le roman de Bram Stoker en anglais : [Dracula](/livre/@g345).

## 10. Jane Eyre (BBC, 2006)

Ruth Wilson et Toby Stephens dans l'une des adaptations les plus fidèles du roman de Charlotte Brontë. [Lire Jane Eyre en français](/livre/@g16235).

## Une série, puis le livre ?

C'est souvent le meilleur ordre : la série donne envie, le livre approfondit. Vous y retrouverez les pensées des personnages, les digressions de l'auteur et les scènes que la série a dû condenser.

Plutôt cinéma ? Voir notre [top 10 des livres adaptés en film](/blog/top-10-livres-adaptes-en-film).

## Sources

- Orgueil et préjugés, série Netflix 2026 : ${SRC.prideNetflixFr}
- Le Comte de Monte-Cristo (France 2) : ${SRC.comteFrance2} ; La Comtesse de Monte-Cristo : ${SRC.comtesse}
- Les Misérables (BBC, 2018) : ${SRC.miserables}
- Les Grandes Espérances (2023) : ${SRC.greatExpectations}

*Informations vérifiées le 20 novembre 2026.*`,
  },

  // =========================================================================
  // FILMS — EN
  // =========================================================================
  {
    language: "en",
    slug: "top-10-books-adapted-into-movies",
    title: "Top 10 Books Adapted Into Movies (Read Them Free First)",
    categorySlug: "culture",
    cover: IMG.odyssey,
    excerpt:
      "The Odyssey, Frankenstein, Pride and Prejudice, Dracula… Ten classic novels behind memorable movies, and where to read them free.",
    metaTitle: "Top 10 Books Adapted Into Movies: Classics to Read First",
    metaDescription:
      "The Odyssey, Frankenstein, Pride and Prejudice, Dracula… 10 classic novels that became great movies, and the books you can read free before watching.",
    tags: "book adaptations, movies, novels, classics, film",
    content: `2026 has been a huge year for classics at the movies: Christopher Nolan's *The Odyssey* passed $1 billion worldwide, and Emerald Fennell's *Wuthering Heights* opened the year. Hollywood keeps coming back to great novels.

All ten books on this list are in the public domain, so you can read them free, before or after the movie.

## 1. The Odyssey, Homer

Odysseus's long journey home to Ithaca, with its monsters, gods and temptations. Christopher Nolan's adaptation, released in July 2026, became one of the biggest films of the year. [Read The Odyssey](/livre/@g3160) (in Alexander Pope's translation) or its prequel, [The Iliad](/livre/@g2199).

## 2. Wuthering Heights, Emily Brontë

The destructive love of Heathcliff and Catherine on the Yorkshire moors. Emerald Fennell's film (February 2026), starring Margot Robbie and Jacob Elordi, divided critics with the liberties it takes.

![Title page of the first edition of Wuthering Heights, 1847](commons:${IMG.wuthering} "First edition, 1847, published under the pseudonym Ellis Bell")

[Read Wuthering Heights](/livre/@g768).

## 3. Frankenstein, Mary Shelley

The scientist who creates life, and the creature who turns against him. Guillermo del Toro adapted it for Netflix (November 2025), with Oscar Isaac as Victor Frankenstein and Jacob Elordi as the Creature.

![Frontispiece of the 1831 edition of Frankenstein by Theodor von Holst](commons:${IMG.frankenstein} "Frontispiece of the 1831 edition of Frankenstein")

[Read Frankenstein](/livre/@g84).

## 4. Pride and Prejudice, Jane Austen

Elizabeth Bennet, Mr Darcy and the art of misunderstanding. Joe Wright's 2005 film with Keira Knightley and Matthew Macfadyen remains a fan favorite.

![Hugh Thomson illustration for Pride and Prejudice, 1894](commons:${IMG.pride} "Hugh Thomson's illustration for the 1894 edition")

[Read Pride and Prejudice](/livre/@g1342).

## 5. The Count of Monte Cristo, Alexandre Dumas

Wrongly imprisoned, Edmond Dantès returns years later as a mysterious count to take his revenge. The 2024 French film starring Pierre Niney drew more than 9 million admissions in France alone. [Read The Count of Monte Cristo](/livre/@g1184).

## 6. Dracula, Bram Stoker

The novel that defined the vampire. Among countless adaptations, Francis Ford Coppola's *Bram Stoker's Dracula* (1992), with Gary Oldman, is one of the most faithful in spirit.

![Cover of the first edition of Dracula, 1897](commons:${IMG.dracula} "The first edition of Dracula, 1897")

[Read Dracula](/livre/@g345).

## 7. The Great Gatsby, F. Scott Fitzgerald

Lavish parties, old money and an impossible love in 1920s America. Baz Luhrmann adapted it in 2013 with Leonardo DiCaprio. [Read The Great Gatsby](/livre/@g64317).

## 8. Little Women, Louisa May Alcott

Meg, Jo, Beth and Amy grow up during the American Civil War. Greta Gerwig's 2019 film with Saoirse Ronan introduced the novel to a new generation. [Read Little Women](/livre/@g514).

## 9. The Hunchback of Notre-Dame, Victor Hugo

From Disney's 1996 animated film to Netflix's *The Hunchback, Soul of Paris* (November 27, 2026).

![Illustration from the 1844 edition of Notre-Dame de Paris](commons:${IMG.notreDame} "Illustration from the 1844 edition of Notre-Dame de Paris")

Curious whether Quasimodo really existed? Read [Was Quasimodo Real?](/blog/is-quasimodo-real-hunchback-of-notre-dame), then [the novel](/livre/the-hunchback-of-notre-dame-00hugo).

## 10. The Three Musketeers, Alexandre Dumas

D'Artagnan, Athos, Porthos, Aramis and the dangerous Milady. Adapted dozens of times, most recently in Martin Bourboulon's two-part French epic (2023) with François Civil and Eva Green. [Read The Three Musketeers](/livre/@g1257).

## Read first, or watch first?

Both work. Reading first lets you judge the adaptation and keep your own images of the characters. Reading after lets you spend more time with characters you loved, including everything the movie had to cut.

Prefer TV? See our [top 10 books adapted into TV series](/blog/top-10-books-adapted-into-tv-series).

## Sources

- The Odyssey passes $1 billion: ${SRC.odyssey}
- Wuthering Heights (2026): ${SRC.wuthering}
- Frankenstein (2025): ${SRC.frankenstein}
- The Count of Monte Cristo (2024), over 9 million admissions: ${SRC.monteCristo}
- The Hunchback, Soul of Paris: ${SRC.quasimodo}

*Information checked on November 20, 2026.*`,
  },

  // =========================================================================
  // SERIES — EN
  // =========================================================================
  {
    language: "en",
    slug: "top-10-books-adapted-into-tv-series",
    title: "Top 10 Books Adapted Into TV Series (Read Them Free)",
    categorySlug: "culture",
    cover: IMG.prideWide,
    excerpt:
      "Pride and Prejudice, Sherlock, Les Misérables, War and Peace, Lupin… Ten classic novels behind the best TV series, and where to read them free.",
    metaTitle: "Top 10 Books Adapted Into TV Series: Classics to Read",
    metaDescription:
      "Pride and Prejudice, Sherlock, Les Misérables, War and Peace… 10 classic novels that became great TV series, and the books you can read free.",
    tags: "book adaptations, tv series, novels, netflix, bbc, classics",
    content: `TV has one big advantage over film: time. Six, eight or ten episodes leave room for the subplots a movie has to cut, which is why long 19th-century novels make such good series. And it keeps going: Netflix releases a new *Pride and Prejudice* series on December 3, 2026.

All ten novels on this list are in the public domain, so you can read them free.

## 1. Pride and Prejudice (BBC 1995, Netflix 2026)

The 1995 BBC miniseries with Colin Firth is a classic. Netflix releases its own six-episode version on December 3, 2026, written by Dolly Alderton, with Emma Corrin, Olivia Colman and Jack Lowden. [Read the novel](/livre/@g1342).

## 2. Sherlock (BBC, 2010)

Benedict Cumberbatch and Martin Freeman bring Conan Doyle's detective into modern London.

![Sherlock Holmes drawn by Sidney Paget](commons:${IMG.sherlock} "Sherlock Holmes by Sidney Paget, the illustrator who defined his look")

The original stories are free to read: [The Adventures of Sherlock Holmes](/livre/@g1661), [A Study in Scarlet](/livre/@g244) and [The Hound of the Baskervilles](/livre/@g2852).

## 3. Les Misérables (BBC, 2018)

Six episodes, no songs, adapted by Andrew Davies, with Dominic West as Jean Valjean, David Oyelowo as Javert and Olivia Colman as Madame Thénardier.

![Cosette sweeping, illustration by Émile Bayard for Les Misérables, 1862](commons:${IMG.cosette} "Cosette by Émile Bayard (1862), the novel's most famous image")

Our [reading guide to Les Misérables](/blog/les-miserables-reading-guide-five-volumes) helps you through the five volumes.

## 4. War and Peace (BBC, 2016)

Andrew Davies again, adapting Tolstoy's masterpiece with Lily James, Paul Dano and James Norton. [Read War and Peace](/livre/@g2600).

## 5. Great Expectations (BBC / FX, 2023)

Steven Knight (*Peaky Blinders*) gives Dickens a dark makeover, with Olivia Colman as Miss Havisham. [Read Great Expectations](/livre/@g1400).

## 6. Lupin (Netflix, 2021)

Omar Sy plays Assane Diop, a man inspired by the adventures of gentleman thief Arsène Lupin. Maurice Leblanc's original stories are in the public domain: [Arsène Lupin, gentleman cambrioleur](/livre/arsene-lupin-gentleman-cambrioleur) (in French).

## 7. Dracula (BBC / Netflix, 2020)

Steven Moffat and Mark Gatiss, the creators of *Sherlock*, reinvent the Count in three episodes starring Claes Bang.

![Cover of the first edition of Dracula, 1897](commons:${IMG.dracula} "The first edition of Dracula, 1897")

[Read Dracula](/livre/@g345).

## 8. Around the World in 80 Days (2021)

David Tennant plays Phileas Fogg in a family adventure series based on Jules Verne's novel. [Read the novel](/livre/le-tour-du-monde-en-quatre-vingts-jours) (in French).

## 9. The Count of Monte Cristo (2025) and The Countess of Monte Cristo (2026)

Two series in two years: an international co-production starring Sam Claflin, broadcast in France from December 2025, then *La Comtesse de Monte-Cristo* with Audrey Fleurot, which makes Mercédès the avenger. [Read the novel](/livre/@g1184).

## 10. Jane Eyre (BBC, 2006)

Ruth Wilson and Toby Stephens in one of the most faithful adaptations of Charlotte Brontë's novel. [Read Jane Eyre](/livre/@g1260).

## Watch first, then read?

It is often the best order: the series hooks you, the book goes deeper. You get the characters' thoughts, the author's asides and the scenes the show had to compress.

Prefer movies? See our [top 10 books adapted into movies](/blog/top-10-books-adapted-into-movies).

## Sources

- Pride and Prejudice, Netflix series (2026): ${SRC.prideNetflixEn}
- The Countess of Monte Cristo: ${SRC.comtesse}
- Les Misérables (BBC, 2018): ${SRC.miserables}
- Great Expectations (2023): ${SRC.greatExpectations}

*Information checked on November 20, 2026.*`,
  },
];
