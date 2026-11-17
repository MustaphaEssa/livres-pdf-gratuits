import type { Locale } from "./config";

// Textes SEO (titres, meta descriptions, FAQ) par langue.
// Rédigés pour chaque langue (pas de traduction mot à mot) afin que chaque
// version linguistique ait des balises uniques, avec le mot-clé principal
// de la langue (« PDF gratuit », « free PDF », « PDF مجانا »…).
//
// Placeholders : {title} {author} {name} {n} {titles}

export interface SeoMessages {
  /** Fin du <title> d'une fiche livre PDF : « {Titre} - {Auteur} | … » */
  bookSuffix: string;
  /** Fin du <title> d'une fiche livre audio */
  audioSuffix: string;
  /** Appel à l'action en fin de meta description (livre PDF) */
  bookCta: string;
  /** Appel à l'action en fin de meta description (livre audio) */
  audioCta: string;
  authorTitle: string;
  /** {name} {titles} */
  authorDesc: string;
  /** {name} {n} {titles} */
  categoryDesc: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
}

export const SEO_MESSAGES: Record<Locale, SeoMessages> = {
  fr: {
    bookSuffix: "Télécharger PDF gratuit",
    audioSuffix: "Livre audio gratuit",
    bookCta: "Téléchargez le PDF gratuitement ou lisez-le en ligne, sans inscription.",
    audioCta: "Écoutez-le gratuitement en ligne, sans inscription.",
    authorTitle: "{name} : livres PDF gratuits à télécharger",
    authorDesc: "Téléchargez gratuitement les livres de {name} en PDF ou lisez-les en ligne : {titles}. Sans inscription.",
    categoryDesc: "{n} livres {name} gratuits à télécharger en PDF ou à lire en ligne : {titles}. Sans inscription.",
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "Comment télécharger un livre {name} en PDF gratuitement ?",
        a: "Choisissez un livre dans la liste, ouvrez sa fiche puis cliquez sur « Télécharger le PDF ». Le téléchargement est gratuit et ne demande aucune inscription.",
      },
      {
        q: "Ces livres {name} sont-ils légaux ?",
        a: "Oui. Les livres proposés appartiennent au domaine public ou sont diffusés avec l'accord de leurs ayants droit : vous pouvez les lire, les télécharger et les partager librement.",
      },
      {
        q: "Combien de livres {name} sont disponibles ?",
        a: "La catégorie {name} compte actuellement {n} livres gratuits, et de nouveaux titres sont ajoutés régulièrement. Vous pouvez aussi les lire en ligne sans rien télécharger.",
      },
    ],
  },
  en: {
    bookSuffix: "Free PDF Download",
    audioSuffix: "Free Audiobook",
    bookCta: "Download the free PDF or read it online, no sign-up needed.",
    audioCta: "Listen free online, no sign-up needed.",
    authorTitle: "{name} PDF Books: Free Download",
    authorDesc: "Download {name}'s books as free PDFs or read them online: {titles}. No sign-up needed.",
    categoryDesc: "{n} free {name} books to download as PDF or read online: {titles}. No sign-up needed.",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "How do I download a {name} book as a free PDF?",
        a: "Pick a book from the list, open its page and click “Download PDF”. Downloads are free and no account is required.",
      },
      {
        q: "Are these {name} books legal to download?",
        a: "Yes. The books are in the public domain or shared with the rights holders' permission, so you can read, download and share them freely.",
      },
      {
        q: "How many {name} books are available?",
        a: "The {name} category currently has {n} free books, and new titles are added regularly. You can also read them online without downloading anything.",
      },
    ],
  },
  ar: {
    bookSuffix: "تحميل PDF مجانا",
    audioSuffix: "كتاب صوتي مجاني",
    bookCta: "حمّل الكتاب PDF مجانًا أو اقرأه على الإنترنت دون تسجيل.",
    audioCta: "استمع إليه مجانًا على الإنترنت دون تسجيل.",
    authorTitle: "كتب {name} PDF – تحميل مجاني",
    authorDesc: "تحميل كتب {name} PDF مجانًا أو قراءتها على الإنترنت: {titles}. دون تسجيل.",
    categoryDesc: "{n} كتاب {name} مجاني للتحميل PDF أو القراءة على الإنترنت: {titles}. دون تسجيل.",
    faqTitle: "أسئلة شائعة",
    faq: [
      {
        q: "كيف أحمّل كتاب {name} PDF مجانًا؟",
        a: "اختر كتابًا من القائمة، وافتح صفحته ثم اضغط على «تحميل PDF». التحميل مجاني ولا يتطلب أي تسجيل.",
      },
      {
        q: "هل تحميل كتب {name} هذه قانوني؟",
        a: "نعم. الكتب المعروضة من الملك العام أو منشورة بإذن أصحاب الحقوق، لذا يمكنك قراءتها وتحميلها ومشاركتها بحرية.",
      },
      {
        q: "كم عدد كتب {name} المتاحة؟",
        a: "يضم قسم {name} حاليًا {n} كتابًا مجانيًا، وتُضاف عناوين جديدة باستمرار. ويمكنك أيضًا قراءتها على الإنترنت دون تحميل.",
      },
    ],
  },
  es: {
    bookSuffix: "Descargar PDF gratis",
    audioSuffix: "Audiolibro gratis",
    bookCta: "Descarga el PDF gratis o léelo en línea, sin registro.",
    audioCta: "Escúchalo gratis en línea, sin registro.",
    authorTitle: "Libros de {name} en PDF gratis",
    authorDesc: "Descarga gratis los libros de {name} en PDF o léelos en línea: {titles}. Sin registro.",
    categoryDesc: "{n} libros de {name} gratis para descargar en PDF o leer en línea: {titles}. Sin registro.",
    faqTitle: "Preguntas frecuentes",
    faq: [
      {
        q: "¿Cómo descargar un libro de {name} en PDF gratis?",
        a: "Elige un libro de la lista, abre su ficha y pulsa «Descargar PDF». La descarga es gratuita y no requiere registro.",
      },
      {
        q: "¿Es legal descargar estos libros de {name}?",
        a: "Sí. Los libros son de dominio público o se comparten con permiso de sus titulares, así que puedes leerlos, descargarlos y compartirlos libremente.",
      },
      {
        q: "¿Cuántos libros de {name} hay disponibles?",
        a: "La categoría {name} tiene actualmente {n} libros gratuitos y se añaden títulos nuevos con regularidad. También puedes leerlos en línea sin descargar nada.",
      },
    ],
  },
  de: {
    bookSuffix: "PDF kostenlos herunterladen",
    audioSuffix: "Kostenloses Hörbuch",
    bookCta: "PDF kostenlos herunterladen oder online lesen, ohne Anmeldung.",
    audioCta: "Kostenlos online anhören, ohne Anmeldung.",
    authorTitle: "{name}: Bücher als PDF kostenlos",
    authorDesc: "Bücher von {name} kostenlos als PDF herunterladen oder online lesen: {titles}. Ohne Anmeldung.",
    categoryDesc: "{n} kostenlose {name}-Bücher als PDF herunterladen oder online lesen: {titles}. Ohne Anmeldung.",
    faqTitle: "Häufige Fragen",
    faq: [
      {
        q: "Wie lade ich ein {name}-Buch kostenlos als PDF herunter?",
        a: "Wählen Sie ein Buch aus der Liste, öffnen Sie die Seite und klicken Sie auf „PDF herunterladen“. Der Download ist kostenlos und ohne Anmeldung.",
      },
      {
        q: "Ist der Download dieser {name}-Bücher legal?",
        a: "Ja. Die Bücher sind gemeinfrei oder werden mit Zustimmung der Rechteinhaber angeboten – Sie dürfen sie frei lesen, herunterladen und teilen.",
      },
      {
        q: "Wie viele {name}-Bücher gibt es?",
        a: "Die Kategorie {name} umfasst derzeit {n} kostenlose Bücher, und regelmäßig kommen neue hinzu. Sie können sie auch online lesen, ohne etwas herunterzuladen.",
      },
    ],
  },
  it: {
    bookSuffix: "Scarica PDF gratis",
    audioSuffix: "Audiolibro gratis",
    bookCta: "Scarica il PDF gratis o leggilo online, senza registrazione.",
    audioCta: "Ascoltalo gratis online, senza registrazione.",
    authorTitle: "Libri di {name} in PDF gratis",
    authorDesc: "Scarica gratis i libri di {name} in PDF o leggili online: {titles}. Senza registrazione.",
    categoryDesc: "{n} libri di {name} gratis da scaricare in PDF o leggere online: {titles}. Senza registrazione.",
    faqTitle: "Domande frequenti",
    faq: [
      {
        q: "Come scaricare un libro di {name} in PDF gratis?",
        a: "Scegli un libro dall'elenco, apri la sua scheda e clicca su «Scarica PDF». Il download è gratuito e senza registrazione.",
      },
      {
        q: "È legale scaricare questi libri di {name}?",
        a: "Sì. I libri sono di pubblico dominio o condivisi con il consenso dei titolari dei diritti: puoi leggerli, scaricarli e condividerli liberamente.",
      },
      {
        q: "Quanti libri di {name} sono disponibili?",
        a: "La categoria {name} conta attualmente {n} libri gratuiti e nuovi titoli vengono aggiunti regolarmente. Puoi anche leggerli online senza scaricare nulla.",
      },
    ],
  },
  pt: {
    bookSuffix: "Baixar PDF grátis",
    audioSuffix: "Audiolivro grátis",
    bookCta: "Baixe o PDF grátis ou leia online, sem cadastro.",
    audioCta: "Ouça grátis online, sem cadastro.",
    authorTitle: "Livros de {name} em PDF grátis",
    authorDesc: "Baixe grátis os livros de {name} em PDF ou leia online: {titles}. Sem cadastro.",
    categoryDesc: "{n} livros de {name} grátis para baixar em PDF ou ler online: {titles}. Sem cadastro.",
    faqTitle: "Perguntas frequentes",
    faq: [
      {
        q: "Como baixar um livro de {name} em PDF grátis?",
        a: "Escolha um livro da lista, abra a página dele e clique em «Baixar PDF». O download é gratuito e não exige cadastro.",
      },
      {
        q: "É legal baixar estes livros de {name}?",
        a: "Sim. Os livros são de domínio público ou partilhados com autorização dos detentores de direitos, por isso pode lê-los, baixá-los e partilhá-los livremente.",
      },
      {
        q: "Quantos livros de {name} estão disponíveis?",
        a: "A categoria {name} tem atualmente {n} livros gratuitos e novos títulos são adicionados regularmente. Também pode lê-los online sem baixar nada.",
      },
    ],
  },
  nl: {
    bookSuffix: "Gratis PDF downloaden",
    audioSuffix: "Gratis luisterboek",
    bookCta: "Download de gratis PDF of lees online, zonder account.",
    audioCta: "Gratis online luisteren, zonder account.",
    authorTitle: "{name}: boeken gratis als PDF",
    authorDesc: "Download de boeken van {name} gratis als PDF of lees ze online: {titles}. Zonder account.",
    categoryDesc: "{n} gratis {name}-boeken om als PDF te downloaden of online te lezen: {titles}. Zonder account.",
    faqTitle: "Veelgestelde vragen",
    faq: [
      {
        q: "Hoe download ik een {name}-boek gratis als PDF?",
        a: "Kies een boek uit de lijst, open de pagina en klik op ‘PDF downloaden’. Downloaden is gratis en zonder account.",
      },
      {
        q: "Is het downloaden van deze {name}-boeken legaal?",
        a: "Ja. De boeken zijn rechtenvrij of worden gedeeld met toestemming van de rechthebbenden: je mag ze vrij lezen, downloaden en delen.",
      },
      {
        q: "Hoeveel {name}-boeken zijn er beschikbaar?",
        a: "De categorie {name} telt momenteel {n} gratis boeken en er komen regelmatig nieuwe titels bij. Je kunt ze ook online lezen zonder iets te downloaden.",
      },
    ],
  },
  ru: {
    bookSuffix: "Скачать PDF бесплатно",
    audioSuffix: "Бесплатная аудиокнига",
    bookCta: "Скачайте PDF бесплатно или читайте онлайн без регистрации.",
    audioCta: "Слушайте бесплатно онлайн без регистрации.",
    authorTitle: "{name}: книги в PDF бесплатно",
    authorDesc: "Скачайте книги автора {name} в PDF бесплатно или читайте онлайн: {titles}. Без регистрации.",
    categoryDesc: "{n} бесплатных книг «{name}» в PDF для скачивания или чтения онлайн: {titles}. Без регистрации.",
    faqTitle: "Частые вопросы",
    faq: [
      {
        q: "Как бесплатно скачать книгу «{name}» в PDF?",
        a: "Выберите книгу из списка, откройте её страницу и нажмите «Скачать PDF». Скачивание бесплатное и не требует регистрации.",
      },
      {
        q: "Законно ли скачивать эти книги «{name}»?",
        a: "Да. Книги находятся в общественном достоянии или публикуются с согласия правообладателей, поэтому их можно свободно читать, скачивать и распространять.",
      },
      {
        q: "Сколько книг «{name}» доступно?",
        a: "Сейчас в разделе «{name}» {n} бесплатных книг, и новые добавляются регулярно. Их также можно читать онлайн, ничего не скачивая.",
      },
    ],
  },
  tr: {
    bookSuffix: "Ücretsiz PDF İndir",
    audioSuffix: "Ücretsiz Sesli Kitap",
    bookCta: "PDF'yi ücretsiz indirin veya kayıt olmadan çevrimiçi okuyun.",
    audioCta: "Kayıt olmadan ücretsiz çevrimiçi dinleyin.",
    authorTitle: "{name} PDF Kitapları – Ücretsiz İndir",
    authorDesc: "{name} kitaplarını ücretsiz PDF olarak indirin veya çevrimiçi okuyun: {titles}. Kayıt gerekmez.",
    categoryDesc: "PDF olarak indirilebilen veya çevrimiçi okunabilen {n} ücretsiz {name} kitabı: {titles}. Kayıt gerekmez.",
    faqTitle: "Sık sorulan sorular",
    faq: [
      {
        q: "Bir {name} kitabını ücretsiz PDF olarak nasıl indiririm?",
        a: "Listeden bir kitap seçin, sayfasını açın ve “PDF indir” düğmesine tıklayın. İndirme ücretsizdir ve kayıt gerektirmez.",
      },
      {
        q: "Bu {name} kitaplarını indirmek yasal mı?",
        a: "Evet. Kitaplar kamu malıdır veya hak sahiplerinin izniyle paylaşılmaktadır; onları özgürce okuyabilir, indirebilir ve paylaşabilirsiniz.",
      },
      {
        q: "Kaç {name} kitabı var?",
        a: "{name} kategorisinde şu anda {n} ücretsiz kitap bulunuyor ve düzenli olarak yenileri ekleniyor. Hiçbir şey indirmeden çevrimiçi de okuyabilirsiniz.",
      },
    ],
  },
  zh: {
    bookSuffix: "免费下载PDF",
    audioSuffix: "免费有声书",
    bookCta: "免费下载PDF或在线阅读，无需注册。",
    audioCta: "免费在线收听，无需注册。",
    authorTitle: "{name}作品PDF免费下载",
    authorDesc: "免费下载{name}的PDF图书或在线阅读：{titles}。无需注册。",
    categoryDesc: "{n}本免费{name}图书，可下载PDF或在线阅读：{titles}。无需注册。",
    faqTitle: "常见问题",
    faq: [
      { q: "如何免费下载{name}类图书的PDF？", a: "在列表中选择一本书，打开其页面并点击“下载PDF”。下载免费，无需注册。" },
      { q: "下载这些{name}类图书合法吗？", a: "合法。这些图书属于公有领域或经权利人许可发布，您可以自由阅读、下载和分享。" },
      { q: "{name}类共有多少本书？", a: "{name}类目前共有{n}本免费图书，并会定期添加新书。您也可以在线阅读，无需下载。" },
    ],
  },
  ja: {
    bookSuffix: "PDF無料ダウンロード",
    audioSuffix: "無料オーディオブック",
    bookCta: "PDFを無料でダウンロード、または登録なしでオンラインで読めます。",
    audioCta: "登録なしで無料オンライン再生できます。",
    authorTitle: "{name}の本 PDF無料ダウンロード",
    authorDesc: "{name}の本をPDFで無料ダウンロード、またはオンラインで読めます：{titles}。登録不要。",
    categoryDesc: "{name}の無料本{n}冊をPDFでダウンロード、またはオンラインで読めます：{titles}。登録不要。",
    faqTitle: "よくある質問",
    faq: [
      { q: "{name}の本をPDFで無料ダウンロードするには？", a: "一覧から本を選んでページを開き、「PDFをダウンロード」をクリックしてください。無料で、登録も不要です。" },
      { q: "これらの{name}の本のダウンロードは合法ですか？", a: "はい。掲載している本はパブリックドメイン、または権利者の許可を得て公開されているため、自由に読み、ダウンロードし、共有できます。" },
      { q: "{name}の本は何冊ありますか？", a: "{name}カテゴリには現在{n}冊の無料本があり、新しい本も定期的に追加されています。ダウンロードせずにオンラインで読むこともできます。" },
    ],
  },
};

export function seoMessages(locale: Locale): SeoMessages {
  return SEO_MESSAGES[locale];
}
