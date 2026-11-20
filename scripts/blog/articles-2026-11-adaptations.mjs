// « Romans adaptés en films et en séries » — FR et EN (novembre 2026).
// Liens /livre/@gNNN : livre importé depuis Gutenberg (n° NNN), remplacé à l'insertion
// par l'adresse réelle de la fiche (voir add-blog-articles.mjs) ou par du texte simple.
// Faits vérifiés le 2026-11-20 (sources en bas de chaque article).

const SOURCES_FR = `## Sources

- Monte-Cristo (2024), plus de 9 millions d'entrées : [AlloCiné](https://www.allocine.fr/article/fichearticle_gen_carticle=1000091407.html), [Ozap](https://www.ozap.com/actu/box-office-le-comte-de-monte-cristo-avec-pierre-niney-devient-le-2e-plus-gros-succes-de-l-annee-2024-au-cinema/645931)
- The Odyssey de Christopher Nolan, milliard de dollars : [TheWrap](https://www.thewrap.com/creative-content/movies/the-odyssey-box-office-1-billion/)
- Les Hauts de Hurlevent d'Emerald Fennell : [GamesRadar](https://www.gamesradar.com/entertainment/romance-movies/wuthering-heights-is-the-first-movie-of-2026-to-pass-the-usd100-million-mark-at-the-box-office/)
- Frankenstein de Guillermo del Toro : [Netflix Tudum](https://www.netflix.com/tudum/articles/frankenstein-guillermo-del-toro-release-date-cast-photos)
- Orgueil et préjugés, série Netflix 2026 : [Netflix News](https://www.netflix-news.com/articles/programmes/series/1617212-orgueil-et-prejuges-netflix-adapte-le-roman-de-jane-austen-en-2026-avec-emma-corrin-et-jack-lowden-11-09-2026/)
- Quasimodo, l'âme de Paris : [What's on Netflix](https://www.whats-on-netflix.com/news/the-hunchback-soul-of-paris-everything-we-know-about-netflixs-new-quasimodo-movie/)
- La Comtesse de Monte-Cristo : [Dexerto](https://www.dexerto.fr/films-series/la-comtesse-de-monte-cristo-calendrier-sortie-episodes-streaming-tv-1664168/) ; Le Comte de Monte-Cristo (France 2) : [Ozap](https://www.ozap.com/actu/france-2-annonce-la-date-de-diffusion-de-sa-serie-internationale-adaptee-du-comte-de-monte-cristo/652748)
- Les Misérables (BBC, 2018) : [PBS Masterpiece](https://www.pbs.org/wgbh/masterpiece/specialfeatures/news-les-miserables-comes-to-masterpiece) ; Great Expectations (2023) : [TV Insider](https://tvinsider.com/1085439/great-expectations-2023-series-fx-hulu-olivia-colman)

*Informations vérifiées le 20 novembre 2026.*`;

const SOURCES_EN = `## Sources

- The Count of Monte Cristo (2024), over 9 million admissions in France: [AlloCiné](https://www.allocine.fr/article/fichearticle_gen_carticle=1000091407.html)
- Christopher Nolan's The Odyssey passes $1 billion: [TheWrap](https://www.thewrap.com/creative-content/movies/the-odyssey-box-office-1-billion/)
- Emerald Fennell's Wuthering Heights: [GamesRadar](https://www.gamesradar.com/entertainment/romance-movies/wuthering-heights-is-the-first-movie-of-2026-to-pass-the-usd100-million-mark-at-the-box-office/)
- Guillermo del Toro's Frankenstein: [Netflix Tudum](https://www.netflix.com/tudum/articles/frankenstein-guillermo-del-toro-release-date-cast-photos)
- Pride and Prejudice, Netflix series (2026): [Wikipedia](https://en.wikipedia.org/wiki/Pride_and_Prejudice_(2026_TV_series))
- The Hunchback, Soul of Paris: [What's on Netflix](https://www.whats-on-netflix.com/news/the-hunchback-soul-of-paris-everything-we-know-about-netflixs-new-quasimodo-movie/)
- Les Misérables (BBC, 2018): [PBS Masterpiece](https://www.pbs.org/wgbh/masterpiece/specialfeatures/news-les-miserables-comes-to-masterpiece); Great Expectations (2023): [TV Insider](https://tvinsider.com/1085439/great-expectations-2023-series-fx-hulu-olivia-colman)

*Information checked on November 20, 2026.*`;

export const articles = [
  // =========================================================================
  {
    language: "fr",
    slug: "romans-adaptes-en-films-et-series",
    title: "Les meilleurs romans adaptés en films et en séries (à lire avant de regarder)",
    categorySlug: "culture",
    excerpt:
      "Monte-Cristo, Orgueil et préjugés, Frankenstein, Les Misérables… Notre top des grands romans adaptés au cinéma et en série, avec les adaptations à voir et les livres à lire gratuitement.",
    metaTitle: "Romans adaptés en films et séries : le top des classiques",
    metaDescription:
      "Le top des romans adaptés en films et séries : Monte-Cristo, Orgueil et préjugés, Frankenstein, Sherlock… Les adaptations à voir et les livres gratuits.",
    tags: "adaptation, romans, films, séries, classiques, netflix",
    content: `2026 restera comme une grande année pour les classiques à l'écran. *The Odyssey* de Christopher Nolan a dépassé le milliard de dollars au box-office mondial. *Les Hauts de Hurlevent* d'Emerald Fennell a ouvert l'année. Et en cette fin d'année, Netflix enchaîne *Quasimodo, l'âme de Paris* (27 novembre) et une nouvelle série *Orgueil et préjugés* (3 décembre).

Point commun de toutes ces adaptations : les romans d'origine sont dans le domaine public. Vous pouvez donc les lire gratuitement, avant ou après avoir vu le film. Voici notre sélection : dix romans devenus des films marquants, puis dix romans devenus des séries.

## Les romans adaptés au cinéma

### 1. Le Comte de Monte-Cristo, Alexandre Dumas

Le roman de vengeance par excellence : Edmond Dantès, emprisonné à tort au château d'If, revient des années plus tard sous l'identité d'un mystérieux comte. Le film de Matthieu Delaporte et Alexandre de La Patellière (2024), avec Pierre Niney, a dépassé les 9 millions d'entrées en France. [Lire Le Comte de Monte-Cristo](/livre/le-comte-de-monte-cristo).

### 2. Les Trois Mousquetaires, Alexandre Dumas

D'Artagnan, Athos, Porthos, Aramis et la redoutable Milady. Adapté des dizaines de fois, le roman a récemment donné le diptyque de Martin Bourboulon, *D'Artagnan* et *Milady* (2023), avec François Civil et Eva Green. [Lire Les Trois Mousquetaires](/livre/les-trois-mousquetaires).

### 3. L'Odyssée, Homère

Le long retour d'Ulysse vers Ithaque, ses ruses, ses monstres et ses tentations. L'adaptation de Christopher Nolan, sortie en juillet 2026, est l'un des plus grands succès de l'année. Lisez-la dans la traduction de Leconte de Lisle : [L'Odyssée](/livre/@g14286).

### 4. Les Hauts de Hurlevent, Emily Brontë

L'amour destructeur de Heathcliff et Catherine sur les landes du Yorkshire. Le film d'Emerald Fennell (février 2026), avec Margot Robbie et Jacob Elordi, a divisé la critique par ses libertés avec le roman. Raison de plus pour lire l'original (en anglais) : [Wuthering Heights](/livre/@g768).

### 5. Frankenstein, Mary Shelley

Le savant qui crée la vie, et la créature qui se retourne contre lui. Guillermo del Toro en a tiré un film pour Netflix (novembre 2025), avec Oscar Isaac en Victor Frankenstein et Jacob Elordi en Créature. [Lire Frankenstein](/livre/frankenstein-ou-le-promethee-moderne-volume-1-of-3).

### 6. Orgueil et préjugés, Jane Austen

Elizabeth Bennet, Mr Darcy et l'art du malentendu. Le film de Joe Wright (2005), avec Keira Knightley et Matthew Macfadyen, reste l'une des adaptations préférées du public. Le roman en anglais : [Pride and Prejudice](/livre/@g1342).

### 7. Notre-Dame de Paris, Victor Hugo

Quasimodo, Esmeralda et la cathédrale. Du dessin animé Disney (1996) au film Netflix *Quasimodo, l'âme de Paris* (2026), qui imagine l'homme ayant pu inspirer Hugo. [Lire Notre-Dame de Paris](/livre/notre-dame-de-paris-1482).

### 8. Germinal, Émile Zola

La grève des mineurs du Nord. Claude Berri en a fait en 1993 un film à grand spectacle avec Renaud et Gérard Depardieu. [Lire Germinal](/livre/germinal), et pour aller plus loin, notre guide [par où commencer Zola](/blog/par-ou-commencer-zola-rougon-macquart).

### 9. Gatsby le Magnifique, F. Scott Fitzgerald

Les fêtes somptueuses de Jay Gatsby et son amour impossible pour Daisy, dans l'Amérique des années 1920. Baz Luhrmann l'a adapté en 2013 avec Leonardo DiCaprio. Le roman en anglais : [The Great Gatsby](/livre/@g64317).

### 10. Les Quatre Filles du docteur March, Louisa May Alcott

Meg, Jo, Beth et Amy grandissent pendant la guerre de Sécession. L'adaptation de Greta Gerwig (2019), avec Saoirse Ronan, a fait découvrir le roman à une nouvelle génération. En anglais : [Little Women](/livre/@g514).

## Les romans adaptés en séries

### 1. Orgueil et préjugés (BBC 1995, Netflix 2026)

La mini-série de la BBC de 1995, avec Colin Firth, est restée culte. Netflix propose sa propre version le 3 décembre 2026, en six épisodes, écrite par Dolly Alderton, avec Emma Corrin, Olivia Colman et Jack Lowden. [Pride and Prejudice](/livre/@g1342).

### 2. Sherlock (BBC, 2010)

Benedict Cumberbatch et Martin Freeman transposent le détective de Conan Doyle dans le Londres d'aujourd'hui. Les enquêtes d'origine sont toutes libres de droits : [Les Aventures de Sherlock Holmes](/livre/@g1661) et [Le Chien des Baskerville](/livre/@g2852) (en anglais).

### 3. Lupin (Netflix, 2021)

Omar Sy incarne Assane Diop, un homme qui s'inspire des aventures d'Arsène Lupin pour venger son père. Une série qui a donné envie à beaucoup de spectateurs de lire Maurice Leblanc : [Arsène Lupin, gentleman cambrioleur](/livre/arsene-lupin-gentleman-cambrioleur).

### 4. Le Comte de Monte-Cristo (France 2, 2025) et La Comtesse de Monte-Cristo (TF1, 2026)

Deux séries en deux ans : une coproduction internationale avec Sam Claflin, diffusée sur France 2 à partir de décembre 2025, puis *La Comtesse de Monte-Cristo* avec Audrey Fleurot, qui fait de Mercédès l'héroïne de la vengeance. [Lire le roman](/livre/le-comte-de-monte-cristo).

### 5. Les Misérables (BBC, 2018)

Six épisodes, sans chansons, adaptés par Andrew Davies, avec Dominic West en Jean Valjean, David Oyelowo en Javert et Olivia Colman en Madame Thénardier. Lisez le roman en anglais en cinq volumes : notre [guide des Misérables](/blog/les-miserables-reading-guide-five-volumes) vous aide à vous y retrouver.

### 6. Guerre et Paix (BBC, 2016)

Andrew Davies, encore lui, adapte le monument de Tolstoï avec Lily James, Paul Dano et James Norton. Le roman en anglais : [War and Peace](/livre/@g2600).

### 7. Les Grandes Espérances (BBC / FX, 2023)

Steven Knight (*Peaky Blinders*) revisite Dickens dans une version sombre, avec Olivia Colman en Miss Havisham. [Great Expectations](/livre/@g1400) (en anglais).

### 8. Le Tour du monde en 80 jours (2021)

David Tennant reprend le rôle de Phileas Fogg dans une série d'aventure familiale. [Lire Le Tour du monde en quatre-vingts jours](/livre/le-tour-du-monde-en-quatre-vingts-jours) et notre guide [par quel Jules Verne commencer](/blog/jules-verne-par-quel-roman-commencer).

### 9. Dracula (BBC / Netflix, 2020)

Steven Moffat et Mark Gatiss, les créateurs de *Sherlock*, réinventent le comte en trois épisodes, avec Claes Bang. Le roman de Bram Stoker en anglais : [Dracula](/livre/@g345).

### 10. Jane Eyre (BBC, 2006)

Ruth Wilson et Toby Stephens dans l'une des adaptations les plus fidèles du roman de Charlotte Brontë. [Lire Jane Eyre en français](/livre/@g16235).

## Lire avant ou après ?

Les deux se défendent. Lire avant permet de juger l'adaptation et de garder ses propres images en tête. Lire après permet de retrouver les personnages qu'on a aimés, avec tout ce que le film a dû couper : un roman de 1 000 pages ne tient jamais dans deux heures.

Tous les romans de cette liste sont gratuits et légaux à lire sur le site, en ligne ou en PDF. Pour savoir pourquoi, lisez notre explication du [domaine public](/blog/domaine-public-telecharger-livres-gratuitement-legalement).

${SOURCES_FR}`,
  },

  // =========================================================================
  {
    language: "en",
    slug: "novels-adapted-into-movies-and-tv-series",
    title: "The Best Novels Adapted Into Movies and TV Series (Read Them First)",
    categorySlug: "culture",
    excerpt:
      "Pride and Prejudice, Frankenstein, The Count of Monte Cristo, Sherlock Holmes… The classic novels behind the best movies and TV series, and where to read them free.",
    metaTitle: "Novels Adapted Into Movies and TV Series: Top Classics",
    metaDescription:
      "Classic novels adapted into movies and TV series: Pride and Prejudice, Frankenstein, Dracula, Sherlock Holmes. What to watch, and the books to read free.",
    tags: "book adaptations, novels, movies, tv series, classics, netflix",
    content: `2026 has been a huge year for classic novels on screen. Christopher Nolan's *The Odyssey* passed $1 billion at the global box office. Emerald Fennell's *Wuthering Heights* opened the year. And Netflix is closing it with *The Hunchback, Soul of Paris* (November 27) and a new *Pride and Prejudice* series (December 3).

What all these stories have in common: the original books are in the public domain. You can read them free, before or after watching. Here are ten novels that became memorable movies, and ten that became great TV series.

## Novels adapted into movies

### 1. The Odyssey, Homer

Odysseus's long journey home to Ithaca, with its monsters, gods and temptations. Christopher Nolan's adaptation, released in July 2026, became one of the biggest films of the year. [Read The Odyssey](/livre/@g1727) or its prequel, [The Iliad](/livre/@g2199).

### 2. Wuthering Heights, Emily Brontë

The destructive love of Heathcliff and Catherine on the Yorkshire moors. Emerald Fennell's film (February 2026), starring Margot Robbie and Jacob Elordi, divided critics with the liberties it takes. All the more reason to read the original: [Wuthering Heights](/livre/@g768).

### 3. Frankenstein, Mary Shelley

The scientist who creates life, and the creature who turns against him. Guillermo del Toro adapted it for Netflix (November 2025), with Oscar Isaac as Victor Frankenstein and Jacob Elordi as the Creature. [Read Frankenstein](/livre/@g84).

### 4. Pride and Prejudice, Jane Austen

Elizabeth Bennet, Mr Darcy and the art of misunderstanding. Joe Wright's 2005 film with Keira Knightley and Matthew Macfadyen remains a fan favorite. [Read Pride and Prejudice](/livre/@g1342).

### 5. The Count of Monte Cristo, Alexandre Dumas

Wrongly imprisoned, Edmond Dantès returns years later as a mysterious count to take his revenge. The 2024 French film starring Pierre Niney drew more than 9 million admissions in France alone. [Read The Count of Monte Cristo](/livre/@g1184).

### 6. The Great Gatsby, F. Scott Fitzgerald

Lavish parties, old money and an impossible love in 1920s America. Baz Luhrmann adapted it in 2013 with Leonardo DiCaprio. [Read The Great Gatsby](/livre/@g64317).

### 7. Little Women, Louisa May Alcott

Meg, Jo, Beth and Amy grow up during the American Civil War. Greta Gerwig's 2019 film with Saoirse Ronan introduced the novel to a new generation. [Read Little Women](/livre/@g514).

### 8. Dracula, Bram Stoker

The novel that defined the vampire. Among countless adaptations, Francis Ford Coppola's *Bram Stoker's Dracula* (1992), with Gary Oldman, is one of the most faithful in spirit. [Read Dracula](/livre/@g345).

### 9. The Hunchback of Notre-Dame, Victor Hugo

From Disney's 1996 animated film to Netflix's *The Hunchback, Soul of Paris* (2026). Curious whether Quasimodo really existed? Read our article [Was Quasimodo Real?](/blog/is-quasimodo-real-hunchback-of-notre-dame), then [the novel](/livre/the-hunchback-of-notre-dame-00hugo).

### 10. The Three Musketeers, Alexandre Dumas

D'Artagnan, Athos, Porthos, Aramis and the dangerous Milady. Adapted dozens of times, most recently in Martin Bourboulon's two-part French epic (2023) with François Civil and Eva Green. [Read The Three Musketeers](/livre/@g1257).

## Novels adapted into TV series

### 1. Pride and Prejudice (BBC 1995, Netflix 2026)

The 1995 BBC miniseries with Colin Firth is a classic. Netflix releases its own six-episode version on December 3, 2026, written by Dolly Alderton, with Emma Corrin, Olivia Colman and Jack Lowden. [Read the novel](/livre/@g1342).

### 2. Sherlock (BBC, 2010)

Benedict Cumberbatch and Martin Freeman bring Conan Doyle's detective into modern London. The original stories are all free to read: [The Adventures of Sherlock Holmes](/livre/@g1661), [A Study in Scarlet](/livre/@g244) and [The Hound of the Baskervilles](/livre/@g2852).

### 3. Les Misérables (BBC, 2018)

Six episodes, no songs, adapted by Andrew Davies, with Dominic West as Jean Valjean, David Oyelowo as Javert and Olivia Colman as Madame Thénardier. Our [reading guide to Les Misérables](/blog/les-miserables-reading-guide-five-volumes) helps you through the five volumes.

### 4. War and Peace (BBC, 2016)

Andrew Davies again, adapting Tolstoy's masterpiece with Lily James, Paul Dano and James Norton. [Read War and Peace](/livre/@g2600).

### 5. Great Expectations (BBC / FX, 2023)

Steven Knight (*Peaky Blinders*) gives Dickens a dark makeover, with Olivia Colman as Miss Havisham. [Read Great Expectations](/livre/@g1400).

### 6. Lupin (Netflix, 2021)

Omar Sy plays Assane Diop, a man inspired by the adventures of gentleman thief Arsène Lupin. The original stories by Maurice Leblanc are in the public domain: [Arsène Lupin, gentleman cambrioleur](/livre/arsene-lupin-gentleman-cambrioleur) (in French).

### 7. Dracula (BBC / Netflix, 2020)

Steven Moffat and Mark Gatiss, the creators of *Sherlock*, reinvent the Count in three episodes starring Claes Bang. [Read Dracula](/livre/@g345).

### 8. Around the World in 80 Days (2021)

David Tennant plays Phileas Fogg in a family adventure series based on Jules Verne's novel. [Read the novel](/livre/le-tour-du-monde-en-quatre-vingts-jours) (in French).

### 9. The Count of Monte Cristo (2025) and The Countess of Monte Cristo (2026)

Two series in two years: an international co-production starring Sam Claflin, broadcast in France from December 2025, then *La Comtesse de Monte-Cristo* with Audrey Fleurot, which makes Mercédès the avenger. [Read the novel](/livre/@g1184).

### 10. Jane Eyre (BBC, 2006)

Ruth Wilson and Toby Stephens in one of the most faithful adaptations of Charlotte Brontë's novel. [Read Jane Eyre](/livre/@g1260).

## Read first, or watch first?

Both work. Reading first lets you judge the adaptation and keep your own images of the characters. Reading after lets you spend more time with characters you loved, including everything the screen version had to cut: a 1,000-page novel never fits into two hours.

Every novel on this list is free and legal to read on our site, online or as PDF. Want to know which classics become free next? See our article on [Public Domain Day 2027](/blog/public-domain-day-2027-what-becomes-free).

${SOURCES_EN}`,
  },
];
