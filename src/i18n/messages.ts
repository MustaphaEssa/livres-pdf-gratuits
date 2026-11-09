import type { Locale } from "./config";

// Structure d'un dictionnaire d'interface.
export interface Messages {
  nav: { home: string; catalogue: string; audiobooks: string; collections: string; authors: string; blog: string; about: string; contact: string; admin: string };
  search: { placeholder: string; button: string };
  account: { login: string; register: string; myAccount: string; logout: string };
  common: {
    loading: string;
    cancel: string;
    back: string;
    previous: string;
    next: string;
    seeAll: string;
    by: string;
    downloads: string;
    reviews: string;
  };
  home: {
    heroTitle: string; heroHighlight: string; heroSubtitle: string;
    statsBooks: string; statsDownloads: string; statsUsers: string;
    categoriesTitle: string; categoriesSubtitle: string; allCategories: string;
    featuredTitle: string; featuredSubtitle: string;
    newestTitle: string; newestSubtitle: string; seeAll: string;
    authorTitle: string; authorText: string; authorCta: string; booksSuffix: string;
  };
  book: { view: string; download: string };
  catalogue: {
    title: string; collectionOf: string; booksWord: string; freePdf: string;
    filters: string; reset: string; searchLabel: string; category: string;
    language: string; allLanguages: string; sortBy: string;
    found: string; foundPlural: string; forQuery: string; noResults: string; seeAllBooks: string;
    sortPopular: string; sortNewest: string; sortTitleAsc: string; sortTitleDesc: string;
  };
  bookPage: {
    downloadPdf: string; readOnline: string; addFavorite: string; removeFavorite: string;
    reviewsCount: string; downloadsCount: string; size: string; pages: string;
    language: string; year: string; description: string; information: string;
    publisher: string; isbn: string; pubYear: string; noPdf: string;
    readerCta: string; readerButton: string; relatedTitle: string;
  };
  reviews: {
    title: string; yourName: string; comment: string; publish: string; sending: string;
    thanks: string; chooseRating: string; none: string; anonymous: string;
  };
  langNames: { fr: string; ar: string; en: string };
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
  };
  compte: {
    hello: string; welcome: string; info: string; fullName: string; email: string;
    memberSince: string; editProfile: string; name: string; currentPassword: string;
    currentPasswordPlaceholder: string; newPassword: string; newPasswordPlaceholder: string;
    save: string; saving: string; updated: string; noChange: string;
    favorites: string; noFavorites: string; downloads: string; noDownloads: string;
    exploreCatalogue: string; logout: string;
  };
  blog: {
    title: string; subtitle: string; empty: string; backToBlog: string;
  };
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
    heroTitle: string; heroSubtitle: string; missionTitle: string; missionP1: string; missionP2: string;
    valuesTitle: string;
    value1Title: string; value1Desc: string; value2Title: string; value2Desc: string;
    value3Title: string; value3Desc: string; value4Title: string; value4Desc: string;
    statsBooks: string; statsDownloads: string; statsUsers: string; statsCategories: string;
    teamTitle: string; teamP1: string; teamP2: string;
  };
  footer: {
    tagline: string; categoriesTitle: string; companyTitle: string; contactTitle: string; rights: string;
    about: string; contact: string; blog: string; legalNotice: string; terms: string; privacy: string; sitemap: string;
  };
  notFound: { title: string; text: string; home: string; browse: string };
  admin: {
    dashboard: string; books: string; categories: string; blog: string; viewSite: string; logout: string;
    loginTitle: string; loginSubtitle: string; email: string; password: string; remember: string; forgot: string; signIn: string; signingIn: string;
    totalBooks: string; downloads: string; users: string; blogPosts: string; recentBooks: string; seeAll: string; loading: string; noBooks: string;
    colTitle: string; colCategory: string; colStatus: string; colDownloads: string; colRating: string; colActions: string; colSlug: string; colBooks: string;
    published: string; draft: string; featured: string; view: string; edit: string; delete: string;
    booksTitle: string; addBook: string; searchPlaceholder: string; allCategories: string; confirmDeleteBook: string; showing: string; onWord: string; booksWord: string;
    addBookTitle: string; addBookSubtitle: string; mainInfo: string; fTitle: string; fTitlePh: string; fSlug: string; urlPrefix: string;
    fAuthor: string; fAuthorPh: string; fDescription: string; fDescriptionPh: string; fLanguage: string; fPubYear: string; fIsbn: string; fPublisher: string; fPublisherPh: string;
    fPageCountOpt: string; fPageCountPh: string; settings: string; fCategory: string; publishedCheck: string; featuredCheck: string;
    filesTitle: string; fPdf: string; choosePdf: string; fCover: string; coverFormats: string;
    save: string; saving: string; cancel: string; bookCreated: string; selectPdf: string; errorGeneric: string;
    editBookTitle: string; editLoading: string; bookNotFound: string; saved: string;
    categoriesTitle: string; addCategoryTitle: string; cName: string; cNamePh: string; cType: string; typeBooks: string; typeBlog: string; add: string; adding: string; confirmDeleteCategory: string; noCategories: string; addImpossible: string; rename: string; cancelAction: string;
    articlesTitle: string; newArticle: string; noArticles: string; createFirst: string; confirmDeleteArticle: string; atFront: string;
    articleCard: string; afSlugPh: string; afExcerpt: string; afContent: string; afContentPh: string; afCover: string; afCoverPh: string; afNone: string; newArticleTitle: string; editArticleTitle: string; articleNotFound: string;
  };
}

const fr: Messages = {
  nav: { home: "Accueil", catalogue: "Catalogue", audiobooks: "Livres audio", collections: "Collections", authors: "Auteurs", blog: "Blog", about: "À propos", contact: "Contact", admin: "Admin" },
  search: { placeholder: "Rechercher un livre...", button: "Rechercher" },
  account: { login: "Connexion", register: "Créer un compte", myAccount: "Mon compte", logout: "Déconnexion" },
  common: { loading: "Chargement...", cancel: "Annuler", back: "Retour", previous: "Précédent", next: "Suivant", seeAll: "Voir tout", by: "par", downloads: "téléchargements", reviews: "avis" },
  home: {
    heroTitle: "Votre Bibliothèque de", heroHighlight: "Livres PDF Gratuits",
    heroSubtitle: "Découvrez des milliers de livres gratuits dans toutes les catégories. Romans, sciences, histoire, informatique, religion et bien plus encore.",
    statsBooks: "Livres", statsDownloads: "Téléchargements", statsUsers: "Utilisateurs",
    categoriesTitle: "Catégories Populaires", categoriesSubtitle: "Explorez notre large collection par catégorie", allCategories: "Voir toutes les catégories",
    featuredTitle: "Livres en Vedette", featuredSubtitle: "Les livres les plus populaires cette semaine",
    newestTitle: "Nouveautés", newestSubtitle: "Les derniers livres ajoutés à notre bibliothèque", seeAll: "Voir tout",
    authorTitle: "Vous êtes auteur ?", authorText: "Publiez vos propres livres sur notre plateforme et atteignez des milliers de lecteurs. C'est gratuit et simple.", authorCta: "Nous contacter", booksSuffix: "livres",
  },
  book: { view: "Voir", download: "PDF" },
  catalogue: {
    title: "Catalogue des Livres", collectionOf: "Parcourez notre collection de", booksWord: "livres", freePdf: "PDF gratuits",
    filters: "Filtres", reset: "Réinitialiser", searchLabel: "Recherche", category: "Catégorie", language: "Langue", allLanguages: "Toutes", sortBy: "Trier par",
    found: "livre trouvé", foundPlural: "livres trouvés", forQuery: "pour", noResults: "Aucun livre ne correspond à vos critères", seeAllBooks: "Voir tous les livres",
    sortPopular: "Popularité", sortNewest: "Plus récents", sortTitleAsc: "Titre A-Z", sortTitleDesc: "Titre Z-A",
  },
  bookPage: {
    downloadPdf: "Télécharger PDF", readOnline: "Lire en ligne", addFavorite: "Ajouter aux favoris", removeFavorite: "Retirer des favoris",
    reviewsCount: "avis", downloadsCount: "téléchargements", size: "Taille", pages: "Pages", language: "Langue", year: "Année",
    description: "Description", information: "Informations", publisher: "Éditeur", isbn: "ISBN", pubYear: "Année de publication", noPdf: "Aucun fichier PDF disponible pour ce livre.",
    readerCta: "Lisez ce livre directement dans votre navigateur", readerButton: "Lire en ligne", relatedTitle: "Livres similaires",
  },
  reviews: {
    title: "Avis des lecteurs", yourName: "Votre nom", comment: "Votre commentaire (optionnel)", publish: "Publier mon avis", sending: "Envoi…",
    thanks: "Merci pour votre avis !", chooseRating: "Choisissez une note (1 à 5 étoiles)", none: "Aucun avis pour le moment. Soyez le premier !", anonymous: "Anonyme",
  },
  langNames: { fr: "Français", ar: "العربية", en: "English" },
  auth: {
    loginTitle: "Connexion", loginSubtitle: "Connectez-vous pour accéder à votre compte", registerTitle: "Créer un compte", registerSubtitle: "Rejoignez notre communauté de lecteurs",
    email: "Email", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe", fullName: "Nom complet", yourName: "Votre nom",
    remember: "Se souvenir", forgot: "Mot de passe oublié ?", signIn: "Se connecter", signingIn: "Connexion...", signUp: "Créer un compte", creating: "Création...",
    noAccount: "Pas encore de compte ?", createOne: "Créer un compte", hasAccount: "Déjà un compte ?", signInLink: "Se connecter",
    backHome: "← Retour au site", acceptTerms: "J'accepte les", terms: "conditions d'utilisation", and: "et la", privacy: "politique de confidentialité",
    forgotTitle: "Mot de passe oublié", forgotSubtitle: "Entrez votre email pour recevoir un lien de réinitialisation", sendLink: "Envoyer le lien", sending: "Envoi…",
    forgotSent: "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé. Pensez à vérifier vos spams.", backToLogin: "Retour à la connexion",
    resetTitle: "Nouveau mot de passe", resetSubtitle: "Choisissez un nouveau mot de passe", newPassword: "Nouveau mot de passe", confirm: "Confirmer", resetButton: "Réinitialiser le mot de passe",
    resetDone: "Mot de passe mis à jour ! Redirection vers la connexion…", invalidLink: "Lien invalide. Refaites une demande de réinitialisation.",
    fillAll: "Veuillez remplir tous les champs", passwordsMismatch: "Les mots de passe ne correspondent pas", passwordTooShort: "Le mot de passe doit contenir au moins 6 caractères", genericError: "Une erreur est survenue. Réessayez.", wrongCredentials: "Email ou mot de passe incorrect",
  },
  compte: {
    hello: "Bonjour", welcome: "Bienvenue sur votre espace personnel", info: "Informations", fullName: "Nom complet", email: "Email",
    memberSince: "Membre depuis", editProfile: "Modifier mon profil", name: "Nom", currentPassword: "Mot de passe actuel", currentPasswordPlaceholder: "pour changer le mot de passe",
    newPassword: "Nouveau mot de passe", newPasswordPlaceholder: "min. 6 caractères", save: "Enregistrer", saving: "Enregistrement…", updated: "Profil mis à jour.", noChange: "Aucune modification.",
    favorites: "Mes favoris", noFavorites: "Aucun favori. Cliquez sur le ❤ d'un livre pour l'ajouter.", downloads: "Mes téléchargements", noDownloads: "Vous n'avez encore téléchargé aucun livre.",
    exploreCatalogue: "Explorer le catalogue", logout: "Se déconnecter",
  },
  blog: { title: "Blog", subtitle: "Actualités, conseils et réflexions sur le monde du livre et de la lecture.", empty: "Aucun article pour le moment.", backToBlog: "Retour au blog" },
  comments: { title: "Commentaires", yourName: "Votre nom", placeholder: "Votre commentaire…", publish: "Publier", sending: "Envoi…", empty: "Aucun commentaire. Soyez le premier à réagir !", anonymous: "Anonyme" },
  contact: {
    title: "Contactez-nous", subtitle: "Vous avez une question, une suggestion ou souhaitez collaborer avec nous ? N'hésitez pas à nous envoyer un message.",
    sentTitle: "Message envoyé !", sentText: "Merci de nous avoir contactés. Nous répondrons à votre message dans les plus brefs délais.",
    name: "Nom complet", namePlaceholder: "Votre nom", email: "Email", subject: "Sujet", subjectPlaceholder: "Sujet de votre message",
    message: "Message", messagePlaceholder: "Votre message...", send: "Envoyer le message",
    infoTitle: "Informations de contact", phone: "Téléphone", address: "Adresse", addressValue: "Maroc",
    hoursTitle: "Heures d'ouverture", hoursWeek: "Lundi - Vendredi : 9h00 - 18h00", hoursSat: "Samedi : 9h00 - 13h00", hoursSun: "Dimanche : Fermé",
    otherTitle: "Autres moyens de contact", otherText: "Vous pouvez également nous suivre sur nos réseaux sociaux pour rester informé des dernières nouveautés.",
  },
  about: {
    heroTitle: "À Propos de Livre PDF Gratuit", heroSubtitle: "Notre mission est de rendre le savoir accessible à tous en offrant une bibliothèque de livres PDF gratuits dans plusieurs langues.",
    missionTitle: "Notre Mission",
    missionP1: "Livre PDF Gratuit est une plateforme dédiée à la diffusion du savoir et de la culture. Nous croyons fermement que l'éducation et l'accès à l'information sont des droits fondamentaux qui devraient être accessibles à tous, partout dans le monde.",
    missionP2: "Notre plateforme propose des milliers de livres dans diverses catégories : romans, sciences, histoire, informatique, religion, philosophie, poésie et bien plus encore. Nous nous engageons à enrichir constamment notre collection avec de nouveaux titres.",
    valuesTitle: "Nos Valeurs",
    value1Title: "Accès Gratuit", value1Desc: "Nous croyons que le savoir doit être accessible à tous. Tous nos livres sont disponibles gratuitement.",
    value2Title: "Multilingue", value2Desc: "Une plateforme qui valorise la diversité culturelle avec des contenus en français, arabe et anglais.",
    value3Title: "Communauté", value3Desc: "Une communauté de lecteurs et d'auteurs qui partagent leur passion pour les livres.",
    value4Title: "Passion", value4Desc: "Un projet porté par la passion des livres et le désir de diffuser le savoir.",
    statsBooks: "Livres", statsDownloads: "Téléchargements", statsUsers: "Utilisateurs", statsCategories: "Catégories",
    teamTitle: "Notre Équipe",
    teamP1: "Livre PDF Gratuit est un projet ambitieux porté par une équipe déterminée à démocratiser l'accès au savoir. Bien que notre équipe soit actuellement réduite, nous travaillons quotidiennement pour améliorer la plateforme et enrichir notre collection.",
    teamP2: "Si vous souhaitez rejoindre notre projet ou le soutenir, n'hésitez pas à nous contacter.",
  },
  footer: {
    tagline: "Votre bibliothèque de livres PDF gratuits. Des milliers de livres disponibles en téléchargement libre.",
    categoriesTitle: "Catégories", companyTitle: "Entreprise", contactTitle: "Contact", rights: "Tous droits réservés.",
    about: "À propos", contact: "Contact", blog: "Blog", legalNotice: "Mentions légales", terms: "Conditions d'utilisation", privacy: "Politique de confidentialité", sitemap: "Plan du site",
  },
  notFound: {
    title: "Page non trouvée", text: "Désolé, la page que vous recherchez n'existe pas ou a été déplacée.",
    home: "Retour à l'accueil", browse: "Parcourir le catalogue",
  },
  admin: {
    dashboard: "Tableau de bord", books: "Livres", categories: "Catégories", blog: "Blog", viewSite: "Voir le site", logout: "Déconnexion",
    loginTitle: "Connexion Admin", loginSubtitle: "Connectez-vous pour accéder au panneau d'administration", email: "Email", password: "Mot de passe", remember: "Se souvenir", forgot: "Mot de passe oublié ?", signIn: "Se connecter", signingIn: "Connexion...",
    totalBooks: "Total Livres", downloads: "Téléchargements", users: "Utilisateurs", blogPosts: "Articles Blog", recentBooks: "Livres récents", seeAll: "Voir tout", loading: "Chargement...", noBooks: "Aucun livre",
    colTitle: "Titre", colCategory: "Catégorie", colStatus: "Statut", colDownloads: "Téléchargements", colRating: "Note", colActions: "Actions", colSlug: "Slug", colBooks: "Livres",
    published: "Publié", draft: "Brouillon", featured: "Vedette", view: "Voir", edit: "Modifier", delete: "Supprimer",
    booksTitle: "Livres", addBook: "Ajouter un livre", searchPlaceholder: "Rechercher...", allCategories: "Tous", confirmDeleteBook: "Supprimer ce livre ? Le livre et son fichier PDF seront définitivement supprimés.", showing: "Affichage de", onWord: "sur", booksWord: "livres",
    addBookTitle: "Ajouter un livre", addBookSubtitle: "Ajoutez un nouveau livre à votre bibliothèque", mainInfo: "Informations principales", fTitle: "Titre", fTitlePh: "Titre du livre", fSlug: "Slug", urlPrefix: "URL",
    fAuthor: "Auteur", fAuthorPh: "Nom de l'auteur", fDescription: "Description", fDescriptionPh: "Description du livre...", fLanguage: "Langue", fPubYear: "Année de publication", fIsbn: "ISBN", fPublisher: "Éditeur", fPublisherPh: "Nom de l'éditeur",
    fPageCountOpt: "Nombre de pages (optionnel)", fPageCountPh: "Détecté automatiquement depuis le PDF", settings: "Paramètres", fCategory: "Catégorie", publishedCheck: "Publié", featuredCheck: "Livre en vedette",
    filesTitle: "Fichiers", fPdf: "Fichier PDF", choosePdf: "Cliquez pour choisir un fichier PDF", fCover: "Image de couverture (optionnel)", coverFormats: "JPG, PNG ou WebP",
    save: "Enregistrer", saving: "Enregistrement…", cancel: "Annuler", bookCreated: "Livre créé avec succès ! Redirection...", selectPdf: "Veuillez sélectionner un fichier PDF", errorGeneric: "Une erreur est survenue",
    editBookTitle: "Modifier le livre", editLoading: "Chargement…", bookNotFound: "Livre introuvable.", saved: "Modifications enregistrées ! Redirection…",
    categoriesTitle: "Catégories", addCategoryTitle: "Ajouter une catégorie", cName: "Nom", cNamePh: "Ex : Développement personnel", cType: "Type", typeBooks: "Livres", typeBlog: "Blog", add: "Ajouter", adding: "Ajout…", confirmDeleteCategory: "Supprimer la catégorie", noCategories: "Aucune catégorie.", addImpossible: "Ajout impossible", rename: "Renommer", cancelAction: "Annuler",
    articlesTitle: "Articles", newArticle: "Nouvel article", noArticles: "Aucun article.", createFirst: "Créer le premier", confirmDeleteArticle: "Supprimer l'article", atFront: "À la une",
    articleCard: "Article", afSlugPh: "mon-article", afExcerpt: "Extrait", afContent: "Contenu", afContentPh: "Séparez les paragraphes par une ligne vide.", afCover: "Image de couverture (URL, optionnel)", afCoverPh: "https://…", afNone: "— Aucune —", newArticleTitle: "Nouvel article", editArticleTitle: "Modifier l'article", articleNotFound: "Article introuvable.",
  },
};

const ar: Messages = {
  nav: { home: "الرئيسية", catalogue: "الفهرس", audiobooks: "كتب صوتية", collections: "مجموعات", authors: "المؤلفون", blog: "المدونة", about: "من نحن", contact: "اتصل بنا", admin: "الإدارة" },
  search: { placeholder: "ابحث عن كتاب...", button: "بحث" },
  account: { login: "تسجيل الدخول", register: "إنشاء حساب", myAccount: "حسابي", logout: "تسجيل الخروج" },
  common: { loading: "جارٍ التحميل...", cancel: "إلغاء", back: "رجوع", previous: "السابق", next: "التالي", seeAll: "عرض الكل", by: "بقلم", downloads: "تحميلات", reviews: "مراجعات" },
  home: {
    heroTitle: "مكتبتك من", heroHighlight: "الكتب المجانية بصيغة PDF",
    heroSubtitle: "اكتشف آلاف الكتب المجانية في جميع الفئات: روايات، علوم، تاريخ، معلوميات، دين وغير ذلك الكثير.",
    statsBooks: "كتاب", statsDownloads: "تحميل", statsUsers: "مستخدم",
    categoriesTitle: "الفئات الشائعة", categoriesSubtitle: "استكشف مجموعتنا الواسعة حسب الفئة", allCategories: "عرض كل الفئات",
    featuredTitle: "كتب مميزة", featuredSubtitle: "أكثر الكتب شعبية هذا الأسبوع",
    newestTitle: "أحدث الإضافات", newestSubtitle: "آخر الكتب المضافة إلى مكتبتنا", seeAll: "عرض الكل",
    authorTitle: "هل أنت مؤلف؟", authorText: "انشر كتبك على منصتنا وصل إلى آلاف القراء. الأمر مجاني وبسيط.", authorCta: "اتصل بنا", booksSuffix: "كتاب",
  },
  book: { view: "عرض", download: "PDF" },
  catalogue: {
    title: "فهرس الكتب", collectionOf: "تصفح مجموعتنا المكونة من", booksWord: "كتاب", freePdf: "مجانية بصيغة PDF",
    filters: "عوامل التصفية", reset: "إعادة ضبط", searchLabel: "بحث", category: "الفئة", language: "اللغة", allLanguages: "الكل", sortBy: "ترتيب حسب",
    found: "كتاب", foundPlural: "كتب", forQuery: "عن", noResults: "لا يوجد كتاب يطابق معاييرك", seeAllBooks: "عرض كل الكتب",
    sortPopular: "الشعبية", sortNewest: "الأحدث", sortTitleAsc: "العنوان أ-ي", sortTitleDesc: "العنوان ي-أ",
  },
  bookPage: {
    downloadPdf: "تحميل PDF", readOnline: "قراءة عبر الإنترنت", addFavorite: "إضافة إلى المفضلة", removeFavorite: "إزالة من المفضلة",
    reviewsCount: "مراجعة", downloadsCount: "تحميل", size: "الحجم", pages: "الصفحات", language: "اللغة", year: "السنة",
    description: "الوصف", information: "معلومات", publisher: "الناشر", isbn: "الرقم الدولي", pubYear: "سنة النشر", noPdf: "لا يوجد ملف PDF متاح لهذا الكتاب.",
    readerCta: "اقرأ هذا الكتاب مباشرة في متصفحك", readerButton: "قراءة عبر الإنترنت", relatedTitle: "كتب مشابهة",
  },
  reviews: {
    title: "آراء القراء", yourName: "اسمك", comment: "تعليقك (اختياري)", publish: "نشر رأيي", sending: "جارٍ الإرسال…",
    thanks: "شكرًا على رأيك!", chooseRating: "اختر تقييمًا (من 1 إلى 5 نجوم)", none: "لا توجد آراء بعد. كن أول من يشارك!", anonymous: "مجهول",
  },
  langNames: { fr: "Français", ar: "العربية", en: "English" },
  auth: {
    loginTitle: "تسجيل الدخول", loginSubtitle: "سجّل الدخول للوصول إلى حسابك", registerTitle: "إنشاء حساب", registerSubtitle: "انضم إلى مجتمع القراء لدينا",
    email: "البريد الإلكتروني", password: "كلمة المرور", confirmPassword: "تأكيد كلمة المرور", fullName: "الاسم الكامل", yourName: "اسمك",
    remember: "تذكرني", forgot: "نسيت كلمة المرور؟", signIn: "دخول", signingIn: "جارٍ الدخول...", signUp: "إنشاء حساب", creating: "جارٍ الإنشاء...",
    noAccount: "ليس لديك حساب؟", createOne: "إنشاء حساب", hasAccount: "لديك حساب؟", signInLink: "تسجيل الدخول",
    backHome: "← العودة إلى الموقع", acceptTerms: "أوافق على", terms: "شروط الاستخدام", and: "و", privacy: "سياسة الخصوصية",
    forgotTitle: "نسيت كلمة المرور", forgotSubtitle: "أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين", sendLink: "إرسال الرابط", sending: "جارٍ الإرسال…",
    forgotSent: "إذا كان هناك حساب لهذا البريد، فقد تم إرسال رابط إعادة التعيين. تحقق من مجلد الرسائل غير المرغوب فيها.", backToLogin: "العودة إلى تسجيل الدخول",
    resetTitle: "كلمة مرور جديدة", resetSubtitle: "اختر كلمة مرور جديدة", newPassword: "كلمة المرور الجديدة", confirm: "تأكيد", resetButton: "إعادة تعيين كلمة المرور",
    resetDone: "تم تحديث كلمة المرور! جارٍ التحويل إلى تسجيل الدخول…", invalidLink: "رابط غير صالح. أعد طلب إعادة التعيين.",
    fillAll: "يرجى ملء جميع الحقول", passwordsMismatch: "كلمتا المرور غير متطابقتين", passwordTooShort: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل", genericError: "حدث خطأ. حاول مرة أخرى.", wrongCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  },
  compte: {
    hello: "مرحبًا", welcome: "مرحبًا بك في مساحتك الشخصية", info: "معلومات", fullName: "الاسم الكامل", email: "البريد الإلكتروني",
    memberSince: "عضو منذ", editProfile: "تعديل ملفي الشخصي", name: "الاسم", currentPassword: "كلمة المرور الحالية", currentPasswordPlaceholder: "لتغيير كلمة المرور",
    newPassword: "كلمة المرور الجديدة", newPasswordPlaceholder: "6 أحرف على الأقل", save: "حفظ", saving: "جارٍ الحفظ…", updated: "تم تحديث الملف الشخصي.", noChange: "لا يوجد تغيير.",
    favorites: "مفضلاتي", noFavorites: "لا توجد مفضلات. انقر على ❤ لكتاب لإضافته.", downloads: "تحميلاتي", noDownloads: "لم تقم بتحميل أي كتاب بعد.",
    exploreCatalogue: "استكشاف الفهرس", logout: "تسجيل الخروج",
  },
  blog: { title: "المدونة", subtitle: "أخبار ونصائح وتأملات حول عالم الكتاب والقراءة.", empty: "لا توجد مقالات بعد.", backToBlog: "العودة إلى المدونة" },
  comments: { title: "التعليقات", yourName: "اسمك", placeholder: "تعليقك…", publish: "نشر", sending: "جارٍ الإرسال…", empty: "لا توجد تعليقات. كن أول من يعلّق!", anonymous: "مجهول" },
  contact: {
    title: "اتصل بنا", subtitle: "هل لديك سؤال أو اقتراح أو ترغب في التعاون معنا؟ لا تتردد في إرسال رسالة إلينا.",
    sentTitle: "تم إرسال الرسالة!", sentText: "شكرًا لتواصلك معنا. سنرد على رسالتك في أقرب وقت ممكن.",
    name: "الاسم الكامل", namePlaceholder: "اسمك", email: "البريد الإلكتروني", subject: "الموضوع", subjectPlaceholder: "موضوع رسالتك",
    message: "الرسالة", messagePlaceholder: "رسالتك...", send: "إرسال الرسالة",
    infoTitle: "معلومات الاتصال", phone: "الهاتف", address: "العنوان", addressValue: "المغرب",
    hoursTitle: "ساعات العمل", hoursWeek: "الإثنين - الجمعة: 9:00 - 18:00", hoursSat: "السبت: 9:00 - 13:00", hoursSun: "الأحد: مغلق",
    otherTitle: "وسائل تواصل أخرى", otherText: "يمكنك أيضًا متابعتنا على شبكات التواصل الاجتماعي للبقاء على اطلاع بآخر المستجدات.",
  },
  about: {
    heroTitle: "حول Livre PDF Gratuit", heroSubtitle: "مهمتنا هي جعل المعرفة في متناول الجميع من خلال تقديم مكتبة من الكتب المجانية بصيغة PDF بعدة لغات.",
    missionTitle: "مهمتنا",
    missionP1: "Livre PDF Gratuit منصة مكرّسة لنشر المعرفة والثقافة. نؤمن إيمانًا راسخًا بأن التعليم والوصول إلى المعلومات حقوق أساسية يجب أن تكون متاحة للجميع في كل مكان.",
    missionP2: "توفّر منصتنا آلاف الكتب في فئات متنوعة: روايات، علوم، تاريخ، معلوميات، دين، فلسفة، شعر وغير ذلك الكثير. ونلتزم بإثراء مجموعتنا باستمرار بعناوين جديدة.",
    valuesTitle: "قيمنا",
    value1Title: "وصول مجاني", value1Desc: "نؤمن بأن المعرفة يجب أن تكون متاحة للجميع. جميع كتبنا متوفرة مجانًا.",
    value2Title: "متعدد اللغات", value2Desc: "منصة تثمّن التنوع الثقافي بمحتوى بالفرنسية والعربية والإنجليزية.",
    value3Title: "مجتمع", value3Desc: "مجتمع من القراء والمؤلفين يتشاركون شغفهم بالكتب.",
    value4Title: "شغف", value4Desc: "مشروع مدفوع بشغف الكتب والرغبة في نشر المعرفة.",
    statsBooks: "كتاب", statsDownloads: "تحميل", statsUsers: "مستخدم", statsCategories: "فئة",
    teamTitle: "فريقنا",
    teamP1: "Livre PDF Gratuit مشروع طموح يقوده فريق عازم على إتاحة المعرفة للجميع. ورغم أن فريقنا صغير حاليًا، فإننا نعمل يوميًا على تحسين المنصة وإثراء مجموعتنا.",
    teamP2: "إذا كنت ترغب في الانضمام إلى مشروعنا أو دعمه، فلا تتردد في الاتصال بنا.",
  },
  footer: {
    tagline: "مكتبتك من الكتب المجانية بصيغة PDF. آلاف الكتب متاحة للتحميل الحر.",
    categoriesTitle: "الفئات", companyTitle: "الشركة", contactTitle: "اتصل بنا", rights: "جميع الحقوق محفوظة.",
    about: "من نحن", contact: "اتصل بنا", blog: "المدونة", legalNotice: "إشعار قانوني", terms: "شروط الاستخدام", privacy: "سياسة الخصوصية", sitemap: "خريطة الموقع",
  },
  notFound: {
    title: "الصفحة غير موجودة", text: "عذرًا، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    home: "العودة إلى الرئيسية", browse: "تصفّح الفهرس",
  },
  admin: {
    dashboard: "لوحة التحكم", books: "الكتب", categories: "الفئات", blog: "المدونة", viewSite: "عرض الموقع", logout: "تسجيل الخروج",
    loginTitle: "دخول الإدارة", loginSubtitle: "سجّل الدخول للوصول إلى لوحة الإدارة", email: "البريد الإلكتروني", password: "كلمة المرور", remember: "تذكرني", forgot: "نسيت كلمة المرور؟", signIn: "دخول", signingIn: "جارٍ الدخول...",
    totalBooks: "إجمالي الكتب", downloads: "التحميلات", users: "المستخدمون", blogPosts: "مقالات المدونة", recentBooks: "أحدث الكتب", seeAll: "عرض الكل", loading: "جارٍ التحميل...", noBooks: "لا توجد كتب",
    colTitle: "العنوان", colCategory: "الفئة", colStatus: "الحالة", colDownloads: "التحميلات", colRating: "التقييم", colActions: "إجراءات", colSlug: "المعرّف", colBooks: "كتب",
    published: "منشور", draft: "مسودة", featured: "مميّز", view: "عرض", edit: "تعديل", delete: "حذف",
    booksTitle: "الكتب", addBook: "إضافة كتاب", searchPlaceholder: "بحث...", allCategories: "الكل", confirmDeleteBook: "حذف هذا الكتاب؟ سيُحذف الكتاب وملف PDF نهائيًا.", showing: "عرض", onWord: "من", booksWord: "كتب",
    addBookTitle: "إضافة كتاب", addBookSubtitle: "أضف كتابًا جديدًا إلى مكتبتك", mainInfo: "المعلومات الأساسية", fTitle: "العنوان", fTitlePh: "عنوان الكتاب", fSlug: "المعرّف", urlPrefix: "الرابط",
    fAuthor: "المؤلف", fAuthorPh: "اسم المؤلف", fDescription: "الوصف", fDescriptionPh: "وصف الكتاب...", fLanguage: "اللغة", fPubYear: "سنة النشر", fIsbn: "الرقم الدولي", fPublisher: "الناشر", fPublisherPh: "اسم الناشر",
    fPageCountOpt: "عدد الصفحات (اختياري)", fPageCountPh: "يُكتشف تلقائيًا من PDF", settings: "الإعدادات", fCategory: "الفئة", publishedCheck: "منشور", featuredCheck: "كتاب مميّز",
    filesTitle: "الملفات", fPdf: "ملف PDF", choosePdf: "انقر لاختيار ملف PDF", fCover: "صورة الغلاف (اختياري)", coverFormats: "JPG أو PNG أو WebP",
    save: "حفظ", saving: "جارٍ الحفظ…", cancel: "إلغاء", bookCreated: "تم إنشاء الكتاب بنجاح! جارٍ التحويل...", selectPdf: "يرجى اختيار ملف PDF", errorGeneric: "حدث خطأ",
    editBookTitle: "تعديل الكتاب", editLoading: "جارٍ التحميل…", bookNotFound: "الكتاب غير موجود.", saved: "تم حفظ التعديلات! جارٍ التحويل…",
    categoriesTitle: "الفئات", addCategoryTitle: "إضافة فئة", cName: "الاسم", cNamePh: "مثال: تطوير الذات", cType: "النوع", typeBooks: "كتب", typeBlog: "مدونة", add: "إضافة", adding: "جارٍ الإضافة…", confirmDeleteCategory: "حذف الفئة", noCategories: "لا توجد فئات.", addImpossible: "تعذّرت الإضافة", rename: "إعادة تسمية", cancelAction: "إلغاء",
    articlesTitle: "المقالات", newArticle: "مقال جديد", noArticles: "لا توجد مقالات.", createFirst: "أنشئ الأول", confirmDeleteArticle: "حذف المقال", atFront: "في الواجهة",
    articleCard: "المقال", afSlugPh: "مقالتي", afExcerpt: "مقتطف", afContent: "المحتوى", afContentPh: "افصل بين الفقرات بسطر فارغ.", afCover: "صورة الغلاف (رابط، اختياري)", afCoverPh: "https://…", afNone: "— لا شيء —", newArticleTitle: "مقال جديد", editArticleTitle: "تعديل المقال", articleNotFound: "المقال غير موجود.",
  },
};

const en: Messages = {
  nav: { home: "Home", catalogue: "Catalogue", audiobooks: "Audiobooks", collections: "Collections", authors: "Authors", blog: "Blog", about: "About", contact: "Contact", admin: "Admin" },
  search: { placeholder: "Search for a book...", button: "Search" },
  account: { login: "Sign in", register: "Sign up", myAccount: "My account", logout: "Sign out" },
  common: { loading: "Loading...", cancel: "Cancel", back: "Back", previous: "Previous", next: "Next", seeAll: "See all", by: "by", downloads: "downloads", reviews: "reviews" },
  home: {
    heroTitle: "Your Library of", heroHighlight: "Free PDF Books",
    heroSubtitle: "Discover thousands of free books in every category. Novels, science, history, computing, religion and much more.",
    statsBooks: "Books", statsDownloads: "Downloads", statsUsers: "Users",
    categoriesTitle: "Popular Categories", categoriesSubtitle: "Explore our large collection by category", allCategories: "See all categories",
    featuredTitle: "Featured Books", featuredSubtitle: "The most popular books this week",
    newestTitle: "New Arrivals", newestSubtitle: "The latest books added to our library", seeAll: "See all",
    authorTitle: "Are you an author?", authorText: "Publish your own books on our platform and reach thousands of readers. It's free and simple.", authorCta: "Contact us", booksSuffix: "books",
  },
  book: { view: "View", download: "PDF" },
  catalogue: {
    title: "Book Catalogue", collectionOf: "Browse our collection of", booksWord: "books", freePdf: "free PDFs",
    filters: "Filters", reset: "Reset", searchLabel: "Search", category: "Category", language: "Language", allLanguages: "All", sortBy: "Sort by",
    found: "book found", foundPlural: "books found", forQuery: "for", noResults: "No book matches your criteria", seeAllBooks: "See all books",
    sortPopular: "Popularity", sortNewest: "Newest", sortTitleAsc: "Title A-Z", sortTitleDesc: "Title Z-A",
  },
  bookPage: {
    downloadPdf: "Download PDF", readOnline: "Read online", addFavorite: "Add to favorites", removeFavorite: "Remove from favorites",
    reviewsCount: "reviews", downloadsCount: "downloads", size: "Size", pages: "Pages", language: "Language", year: "Year",
    description: "Description", information: "Information", publisher: "Publisher", isbn: "ISBN", pubYear: "Publication year", noPdf: "No PDF file available for this book.",
    readerCta: "Read this book directly in your browser", readerButton: "Read online", relatedTitle: "Related books",
  },
  reviews: {
    title: "Reader reviews", yourName: "Your name", comment: "Your comment (optional)", publish: "Publish my review", sending: "Sending…",
    thanks: "Thank you for your review!", chooseRating: "Choose a rating (1 to 5 stars)", none: "No reviews yet. Be the first!", anonymous: "Anonymous",
  },
  langNames: { fr: "Français", ar: "العربية", en: "English" },
  auth: {
    loginTitle: "Sign in", loginSubtitle: "Sign in to access your account", registerTitle: "Create an account", registerSubtitle: "Join our community of readers",
    email: "Email", password: "Password", confirmPassword: "Confirm password", fullName: "Full name", yourName: "Your name",
    remember: "Remember me", forgot: "Forgot password?", signIn: "Sign in", signingIn: "Signing in...", signUp: "Sign up", creating: "Creating...",
    noAccount: "No account yet?", createOne: "Create one", hasAccount: "Already have an account?", signInLink: "Sign in",
    backHome: "← Back to site", acceptTerms: "I accept the", terms: "terms of use", and: "and the", privacy: "privacy policy",
    forgotTitle: "Forgot password", forgotSubtitle: "Enter your email to receive a reset link", sendLink: "Send link", sending: "Sending…",
    forgotSent: "If an account exists for this email, a reset link has just been sent. Check your spam folder.", backToLogin: "Back to sign in",
    resetTitle: "New password", resetSubtitle: "Choose a new password", newPassword: "New password", confirm: "Confirm", resetButton: "Reset password",
    resetDone: "Password updated! Redirecting to sign in…", invalidLink: "Invalid link. Please request a new reset.",
    fillAll: "Please fill in all fields", passwordsMismatch: "Passwords do not match", passwordTooShort: "Password must be at least 6 characters", genericError: "An error occurred. Please try again.", wrongCredentials: "Incorrect email or password",
  },
  compte: {
    hello: "Hello", welcome: "Welcome to your personal space", info: "Information", fullName: "Full name", email: "Email",
    memberSince: "Member since", editProfile: "Edit my profile", name: "Name", currentPassword: "Current password", currentPasswordPlaceholder: "to change the password",
    newPassword: "New password", newPasswordPlaceholder: "min. 6 characters", save: "Save", saving: "Saving…", updated: "Profile updated.", noChange: "No changes.",
    favorites: "My favorites", noFavorites: "No favorites. Click the ❤ on a book to add it.", downloads: "My downloads", noDownloads: "You haven't downloaded any book yet.",
    exploreCatalogue: "Explore the catalogue", logout: "Sign out",
  },
  blog: { title: "Blog", subtitle: "News, tips and reflections on the world of books and reading.", empty: "No articles yet.", backToBlog: "Back to blog" },
  comments: { title: "Comments", yourName: "Your name", placeholder: "Your comment…", publish: "Publish", sending: "Sending…", empty: "No comments yet. Be the first to react!", anonymous: "Anonymous" },
  contact: {
    title: "Contact us", subtitle: "Have a question, a suggestion or want to collaborate with us? Feel free to send us a message.",
    sentTitle: "Message sent!", sentText: "Thank you for contacting us. We'll reply to your message as soon as possible.",
    name: "Full name", namePlaceholder: "Your name", email: "Email", subject: "Subject", subjectPlaceholder: "Subject of your message",
    message: "Message", messagePlaceholder: "Your message...", send: "Send message",
    infoTitle: "Contact information", phone: "Phone", address: "Address", addressValue: "Morocco",
    hoursTitle: "Opening hours", hoursWeek: "Monday - Friday: 9:00 - 18:00", hoursSat: "Saturday: 9:00 - 13:00", hoursSun: "Sunday: Closed",
    otherTitle: "Other ways to reach us", otherText: "You can also follow us on social media to stay up to date with the latest news.",
  },
  about: {
    heroTitle: "About Livre PDF Gratuit", heroSubtitle: "Our mission is to make knowledge accessible to everyone by offering a library of free PDF books in several languages.",
    missionTitle: "Our Mission",
    missionP1: "Livre PDF Gratuit is a platform dedicated to spreading knowledge and culture. We firmly believe that education and access to information are fundamental rights that should be available to everyone, everywhere.",
    missionP2: "Our platform offers thousands of books across various categories: novels, science, history, computing, religion, philosophy, poetry and much more. We are committed to constantly enriching our collection with new titles.",
    valuesTitle: "Our Values",
    value1Title: "Free Access", value1Desc: "We believe knowledge should be accessible to all. All our books are available for free.",
    value2Title: "Multilingual", value2Desc: "A platform that values cultural diversity with content in French, Arabic and English.",
    value3Title: "Community", value3Desc: "A community of readers and authors who share their passion for books.",
    value4Title: "Passion", value4Desc: "A project driven by a passion for books and the desire to spread knowledge.",
    statsBooks: "Books", statsDownloads: "Downloads", statsUsers: "Users", statsCategories: "Categories",
    teamTitle: "Our Team",
    teamP1: "Livre PDF Gratuit is an ambitious project led by a team determined to democratize access to knowledge. Although our team is currently small, we work daily to improve the platform and enrich our collection.",
    teamP2: "If you'd like to join our project or support it, don't hesitate to contact us.",
  },
  footer: {
    tagline: "Your library of free PDF books. Thousands of books available for free download.",
    categoriesTitle: "Categories", companyTitle: "Company", contactTitle: "Contact", rights: "All rights reserved.",
    about: "About", contact: "Contact", blog: "Blog", legalNotice: "Legal notice", terms: "Terms of use", privacy: "Privacy policy", sitemap: "Sitemap",
  },
  notFound: {
    title: "Page not found", text: "Sorry, the page you're looking for doesn't exist or has been moved.",
    home: "Back to home", browse: "Browse the catalogue",
  },
  admin: {
    dashboard: "Dashboard", books: "Books", categories: "Categories", blog: "Blog", viewSite: "View site", logout: "Sign out",
    loginTitle: "Admin Login", loginSubtitle: "Sign in to access the admin panel", email: "Email", password: "Password", remember: "Remember me", forgot: "Forgot password?", signIn: "Sign in", signingIn: "Signing in...",
    totalBooks: "Total Books", downloads: "Downloads", users: "Users", blogPosts: "Blog Posts", recentBooks: "Recent books", seeAll: "See all", loading: "Loading...", noBooks: "No books",
    colTitle: "Title", colCategory: "Category", colStatus: "Status", colDownloads: "Downloads", colRating: "Rating", colActions: "Actions", colSlug: "Slug", colBooks: "Books",
    published: "Published", draft: "Draft", featured: "Featured", view: "View", edit: "Edit", delete: "Delete",
    booksTitle: "Books", addBook: "Add a book", searchPlaceholder: "Search...", allCategories: "All", confirmDeleteBook: "Delete this book? The book and its PDF file will be permanently deleted.", showing: "Showing", onWord: "of", booksWord: "books",
    addBookTitle: "Add a book", addBookSubtitle: "Add a new book to your library", mainInfo: "Main information", fTitle: "Title", fTitlePh: "Book title", fSlug: "Slug", urlPrefix: "URL",
    fAuthor: "Author", fAuthorPh: "Author name", fDescription: "Description", fDescriptionPh: "Book description...", fLanguage: "Language", fPubYear: "Publication year", fIsbn: "ISBN", fPublisher: "Publisher", fPublisherPh: "Publisher name",
    fPageCountOpt: "Number of pages (optional)", fPageCountPh: "Auto-detected from the PDF", settings: "Settings", fCategory: "Category", publishedCheck: "Published", featuredCheck: "Featured book",
    filesTitle: "Files", fPdf: "PDF file", choosePdf: "Click to choose a PDF file", fCover: "Cover image (optional)", coverFormats: "JPG, PNG or WebP",
    save: "Save", saving: "Saving…", cancel: "Cancel", bookCreated: "Book created successfully! Redirecting...", selectPdf: "Please select a PDF file", errorGeneric: "An error occurred",
    editBookTitle: "Edit book", editLoading: "Loading…", bookNotFound: "Book not found.", saved: "Changes saved! Redirecting…",
    categoriesTitle: "Categories", addCategoryTitle: "Add a category", cName: "Name", cNamePh: "e.g. Personal development", cType: "Type", typeBooks: "Books", typeBlog: "Blog", add: "Add", adding: "Adding…", confirmDeleteCategory: "Delete the category", noCategories: "No categories.", addImpossible: "Cannot add", rename: "Rename", cancelAction: "Cancel",
    articlesTitle: "Articles", newArticle: "New article", noArticles: "No articles.", createFirst: "Create the first one", confirmDeleteArticle: "Delete the article", atFront: "Featured",
    articleCard: "Article", afSlugPh: "my-article", afExcerpt: "Excerpt", afContent: "Content", afContentPh: "Separate paragraphs with a blank line.", afCover: "Cover image (URL, optional)", afCoverPh: "https://…", afNone: "— None —", newArticleTitle: "New article", editArticleTitle: "Edit article", articleNotFound: "Article not found.",
  },
};

export const messages: Record<Locale, Messages> = { fr, en };
void ar; // dictionnaire arabe conservé mais désactivé

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
