// Structure du dictionnaire de l'interface publique.
// Placeholders : {n}, {title}, {name}… remplacés par fmt() / plural() (voir ../format.ts).

/** Formes plurielles (règles CLDR via Intl.PluralRules). `other` est obligatoire. */
export interface Plural {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export interface PublicMessages {
  /** Nom de la marque dans la langue : « {before} PDF {after} » (logo, titres). */
  brand: { before: string; after: string };
  meta: {
    defaultTitle: string; description: string; keywords: string[];
    catalogueTitle: string; catalogueDesc: string;
    audioTitle: string; audioTitlePage: string; audioDesc: string;
    collectionsTitle: string; collectionsDesc: string; collectionNotFound: string; collectionDesc: string;
    authorsTitle: string; authorsDesc: string; authorNotFound: string; authorDesc: string;
    categoryNotFound: string; categoryTitle: string; categoryDesc: string;
    blogTitle: string; blogDesc: string; postNotFound: string;
    bookNotFound: string; readTitle: string;
    account: string; about: string; contact: string; login: string; register: string;
    forgot: string; reset: string; terms: string; privacy: string; legal: string; dmca: string;
  };
  nav: {
    home: string; catalogue: string; audiobooks: string; audioShort: string; collections: string; authors: string;
    blog: string; about: string; contact: string; admin: string;
    main: string; mobile: string; mobileMenu: string; openMenu: string; closeMenu: string; skip: string;
    search: string; favorites: string; signIn: string; myAccount: string; language: string;
  };
  common: {
    loading: string; cancel: string; back: string; previous: string; next: string; seeAll: string; by: string;
    breadcrumb: string; page: string; pageOf: string; pagination: string; showMore: string; clearAll: string;
    reset: string; all: string; audio: string; pdfAudio: string; close: string; share: string; copyLink: string; linkCopied: string;
    books: Plural; seeBook: string; seeBookOf: string; coverOf: string; coverOfBy: string;
    publicDomain: string; frenchOnly: string; unknownAuthor: string;
  };
  /** Noms des genres par slug (repli : nom en base). */
  categories: Record<string, string>;
  home: {
    pill: string; heroBefore: string; heroEm: string; heroAfter: string; heroLead: string;
    shelfEyebrow: string; shelfTitle: string; newest: string; seeAllCatalogue: string;
    listsEyebrow: string; listsTitle: string; allCollections: string;
    exploreEyebrow: string; genresTitle: string; allCatalogue: string;
    authorsEyebrow: string; authorsTitle: string; allAuthors: string;
    featuredEyebrow: string; featuredTitle: string; featuredText: string; seeCatalogue: string; seeBookOf: string;
    audioEyebrow: string; audioTitle: string; allAudio: string;
    helpEyebrow: string; helpTitle: string; helpText: string; readingGuides: string;
    f1Tag: string; f1Text: string; f1Label: string; f1Value: string;
    f2Tag: string; f2Text: string; f2Label: string; f2Value: string;
    f3Tag: string; f3Text: string; f3Label: string;
    postsEyebrow: string; postsTitle: string; allBlog: string;
  };
  search: {
    label: string; button: string; placeholder: string; modeLabel: string; modeTitle: string; modeDesc: string;
    descPlaceholder: string; suggestions: string; noMatch: string; allResults: string; tryLabel: string;
    examples: string[]; surprise: string;
  };
  arch: {
    roledesc: string; label: string; show: string; kicker: string; read: string;
    prevBook: string; nextBook: string; bookN: string;
  };
  catalogue: {
    title: string; intro: string; searchLabel: string; genres: string; filters: string; language: string;
    genre: string; format: string; withAudio: string; sortBy: string; sortRelevance: string; sortTitle: string;
    sortAuthor: string; view: string; grid: string; list: string; noResults: string; noResultsHint: string;
  };
  audio: {
    eyebrow: string; title: string; intro: string; titles: Plural; noPage: string; pagesCount: Plural;
    firstPage: string; empty: string; emptyHint: string; browse: string;
  };
  collections: {
    /** Notes génériques des collections (même ordre que FALLBACKS de scripts/seed-collections.mjs). */
    fallbackNotes: string[];
    eyebrow: string; one: string; title: string; intro: string; empty: string; emptyHint: string };
  authors: { title: string; count: Plural; empty: string; booksAvailable: Plural; booksOf: string };
  category: { freeBooks: Plural; empty: string; seeCatalogue: string; booksOf: string };
  book: {
    /** Description générée quand celle de la source est inutilisable. Placeholders : {title} {author} {formats}. */
    autoDesc: string;
    readOnline: string; by: string; language: string; duration: string; pages: string; downloads: string;
    downloadPdf: string; listen: string; about: string; listenOnline: string; theAuthor: string; allTheirBooks: string;
    sameAuthor: string; moreOf: string; reviews: string; readOrDownload: string; publicDomainNotice: string;
    openReader: string; pdfOffline: string; epubDevice: string; epubIdeal: string; downloadEpub: string;
    sendKindle: string; problem: string; contactUs: string; report: string; dmcaPolicy: string; facts: string;
    title: string; author: string; genre: string; publication: string; formats: string; license: string;
    similar: string; reportSubject: string; reportBody: string;
    favAdd: string; favIn: string; favReason: string; favReasonGeneric: string;
    hoursMinutes: string; minutes: string;
    audioUnavailable: string; chapter: string; totalDuration: string;
  };
  reader: {
    opening: string; loading: string; thumbnails: string; pagesTab: string; outlineTab: string; pageNumber: string;
    fitPage: string; fitWidth: string; zoomOut: string; zoomIn: string; flipBook: string; single: string;
    double: string; textSelect: string; fullscreen: string; download: string; close: string;
    noOutline: string; cannotDisplay: string; progress: string; prevKey: string; nextKey: string;
  };
  reviews: {
    title: string; yourName: string; comment: string; publish: string; sending: string;
    thanks: string; chooseRating: string; none: string; anonymous: string;
    pending: string; promptTitle: string; promptHint: string; promptThanks: string; promptAddComment: string; close: string;
  };
  auth: {
    loginTitle: string; loginSubtitle: string; registerTitle: string; registerSubtitle: string;
    email: string; password: string; confirmPassword: string; fullName: string; yourName: string;
    remember: string; forgot: string; signIn: string; signingIn: string; signUp: string; creating: string;
    noAccount: string; createOne: string; hasAccount: string; signInLink: string;
    backHome: string; acceptTerms: string; terms: string; and: string; privacy: string;
    forgotTitle: string; forgotSubtitle: string; sendLink: string; sending: string;
    forgotSent: string; backToLogin: string; resetTitle: string; resetSubtitle: string;
    newPassword: string; confirm: string; resetButton: string; resetDone: string; invalidLink: string;
    fillAll: string; passwordsMismatch: string; passwordTooShort: string; genericError: string; wrongCredentials: string;
    welcomeBack: string; createYours: string; signinLead: string; signupLead: string; landingSigninLead: string;
    orEmail: string; name: string; emailPlaceholder: string; wait: string; createMine: string;
    googleFailed: string; consentPrefix: string; andOur: string; show: string; hide: string;
  };
  compte: {
    hello: string; welcome: string; info: string; fullName: string; email: string;
    memberSince: string; editProfile: string; name: string; currentPassword: string;
    currentPasswordPlaceholder: string; newPassword: string; newPasswordPlaceholder: string;
    save: string; saving: string; updated: string; noChange: string;
    favorites: string; noFavorites: string; downloads: string; noDownloads: string;
    exploreCatalogue: string; logout: string;
  };
  blog: { eyebrow: string; title: string; subtitle: string; empty: string; backToBlog: string; joinDiscussion: string };
  comments: {
    title: string; yourName: string; placeholder: string; publish: string; sending: string; empty: string; anonymous: string;
  };
  contact: {
    title: string; subtitle: string; sentTitle: string; sentText: string;
    name: string; namePlaceholder: string; email: string; subject: string; subjectPlaceholder: string;
    message: string; messagePlaceholder: string; send: string;
    infoTitle: string; phone: string; address: string; addressValue: string;
    hoursTitle: string; hoursWeek: string; hoursSat: string; hoursSun: string;
    otherTitle: string; otherText: string;
  };
  about: {
    eyebrow: string; heroTitle: string; heroSubtitle: string; missionTitle: string; missionP1: string; missionP2: string;
    valuesTitle: string;
    value1Title: string; value1Desc: string; value2Title: string; value2Desc: string;
    value3Title: string; value3Desc: string; value4Title: string; value4Desc: string;
    teamTitle: string; teamP1: string; teamP2: string;
  };
  footer: {
    tagline: string; explore: string; genres: string; info: string;
    contact: string; dmca: string; legalNotice: string; privacy: string; terms: string;
  };
  notFound: { title: string; text: string; home: string; browse: string };
}

/** Dictionnaire d'une langue autre que le français/anglais : les clés manquantes retombent sur l'anglais. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string[] ? string[] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};
