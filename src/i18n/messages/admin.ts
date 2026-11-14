// Libellés de l'admin : toujours en français, quelle que soit la langue du site.
export interface AdminMessages {
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
}

export const adminFr: AdminMessages = {
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
};
