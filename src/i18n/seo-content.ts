import type { Locale } from "./config";

// Contenu éditorial visible destiné au référencement :
//  - FAQ propre à chaque fiche livre (vise « {titre} pdf gratuit ») ;
//  - texte de présentation + FAQ de la page d'accueil (vise « livres pdf gratuits »).
// Rédigé par langue avec le mot-clé principal de chaque langue.
//
// Placeholders fiche livre : {title} {author} {formats}
// Placeholders accueil : {n} (nombre de livres)

export interface SeoContent {
  /** Libellé d'attribution sous un résumé repris de Wikipédia */
  summarySource: string;
  bookFaqTitle: string;
  bookFaq: { q: string; a: string }[];
  homeTitle: string;
  homeText: string[];
  homeFaqTitle: string;
  homeFaq: { q: string; a: string }[];
}

export const SEO_CONTENT: Record<Locale, SeoContent> = {
  fr: {
    summarySource: "Résumé : Wikipédia (licence CC BY-SA)",
    bookFaqTitle: "Questions sur ce livre",
    bookFaq: [
      {
        q: "Comment télécharger « {title} » en PDF gratuitement ?",
        a: "Cliquez sur « Télécharger le PDF » sur cette page : « {title} » de {author} se télécharge gratuitement, sans inscription. Formats disponibles : {formats}.",
      },
      {
        q: "Peut-on lire « {title} » en ligne sans le télécharger ?",
        a: "Oui. Le bouton « Lire en ligne » ouvre le livre directement dans votre navigateur, sur ordinateur, tablette ou téléphone, et retient la page où vous vous êtes arrêté.",
      },
      {
        q: "« {title} » est-il libre de droits ?",
        a: "« {title} » de {author} appartient au domaine public : vous pouvez le lire, le télécharger, l'imprimer et le partager librement et légalement.",
      },
    ],
    homeTitle: "Des livres PDF gratuits, légaux et sans inscription",
    homeText: [
      "Livres PDF Gratuits rassemble {n} livres du domaine public à télécharger gratuitement en PDF ou EPUB, à lire en ligne dans le navigateur ou à écouter en livre audio. Romans, poésie, théâtre, philosophie, histoire, contes : les grands classiques de la littérature française et mondiale sont réunis dans une bibliothèque numérique gratuite.",
      "Chaque livre dispose d'une fiche avec un résumé, des informations sur l'auteur et des liens de téléchargement directs. Aucun compte n'est nécessaire et tous les ouvrages sont libres de droits : vous pouvez les lire sur ordinateur, liseuse, tablette ou téléphone, les imprimer et les partager.",
    ],
    homeFaqTitle: "Questions fréquentes",
    homeFaq: [
      {
        q: "Les livres PDF de ce site sont-ils vraiment gratuits ?",
        a: "Oui. Tous les livres sont gratuits, sans abonnement ni inscription. Il s'agit d'œuvres du domaine public, que chacun peut lire, télécharger et partager légalement.",
      },
      {
        q: "Comment télécharger un livre PDF gratuitement ?",
        a: "Recherchez un titre ou un auteur, ouvrez la fiche du livre puis cliquez sur « Télécharger le PDF ». Vous pouvez aussi le lire directement en ligne ou choisir le format EPUB pour une liseuse.",
      },
      {
        q: "Puis-je lire les livres sur liseuse ou sur téléphone ?",
        a: "Oui. Le format PDF s'ouvre partout ; le format EPUB s'adapte à l'écran des liseuses (Kobo, Kindle via « Envoyer vers Kindle ») et des téléphones. Le lecteur en ligne fonctionne aussi sur mobile.",
      },
    ],
  },
  en: {
    summarySource: "Summary: Wikipedia (CC BY-SA license)",
    bookFaqTitle: "About this book",
    bookFaq: [
      {
        q: "How can I download “{title}” as a free PDF?",
        a: "Click “Download PDF” on this page: “{title}” by {author} downloads for free, no account needed. Available formats: {formats}.",
      },
      {
        q: "Can I read “{title}” online without downloading it?",
        a: "Yes. The “Read online” button opens the book right in your browser on a computer, tablet or phone, and remembers where you stopped.",
      },
      {
        q: "Is “{title}” copyright-free?",
        a: "“{title}” by {author} is in the public domain: you can read, download, print and share it freely and legally.",
      },
    ],
    homeTitle: "Free PDF books: legal, no sign-up",
    homeText: [
      "Livres PDF Gratuits offers {n} public-domain books to download for free as PDF or EPUB, read online in your browser or listen to as audiobooks. Novels, poetry, plays, philosophy, history and tales: the great classics of world literature in one free digital library.",
      "Every book has its own page with a summary, details about the author and direct download links. No account is needed and every title is copyright-free, so you can read it on a computer, e-reader, tablet or phone, print it and share it.",
    ],
    homeFaqTitle: "Frequently asked questions",
    homeFaq: [
      {
        q: "Are the PDF books on this site really free?",
        a: "Yes. Every book is free, with no subscription or sign-up. They are public-domain works that anyone can legally read, download and share.",
      },
      {
        q: "How do I download a free PDF book?",
        a: "Search for a title or author, open the book's page and click “Download PDF”. You can also read it online or pick the EPUB format for an e-reader.",
      },
      {
        q: "Can I read the books on an e-reader or phone?",
        a: "Yes. PDF opens everywhere; EPUB adapts to e-readers (Kobo, Kindle via “Send to Kindle”) and phones. The online reader works on mobile too.",
      },
    ],
  },
  ar: {
    summarySource: "الملخص: ويكيبيديا (رخصة CC BY-SA)",
    bookFaqTitle: "أسئلة حول هذا الكتاب",
    bookFaq: [
      {
        q: "كيف أحمّل كتاب «{title}» PDF مجانًا؟",
        a: "اضغط على «تحميل PDF» في هذه الصفحة: يُحمَّل كتاب «{title}» لـ{author} مجانًا ودون تسجيل. الصيغ المتاحة: {formats}.",
      },
      {
        q: "هل يمكن قراءة «{title}» على الإنترنت دون تحميله؟",
        a: "نعم. يفتح زر «اقرأ على الإنترنت» الكتاب مباشرة في المتصفح على الحاسوب أو اللوحي أو الهاتف، ويحفظ الصفحة التي توقفت عندها.",
      },
      {
        q: "هل كتاب «{title}» حر الحقوق؟",
        a: "كتاب «{title}» لـ{author} من الملك العام: يمكنك قراءته وتحميله وطباعته ومشاركته بحرية وبشكل قانوني.",
      },
    ],
    homeTitle: "كتب PDF مجانية وقانونية ودون تسجيل",
    homeText: [
      "يضم موقع Livres PDF Gratuits {n} كتابًا من الملك العام للتحميل المجاني بصيغة PDF أو EPUB، أو للقراءة على الإنترنت، أو للاستماع ككتب صوتية. روايات وشعر ومسرح وفلسفة وتاريخ وحكايات: روائع الأدب العالمي في مكتبة رقمية مجانية.",
      "لكل كتاب صفحة تتضمن ملخصًا ومعلومات عن المؤلف وروابط تحميل مباشرة. لا حاجة إلى حساب، وجميع الكتب حرة الحقوق: يمكنك قراءتها على الحاسوب أو القارئ الإلكتروني أو الهاتف وطباعتها ومشاركتها.",
    ],
    homeFaqTitle: "أسئلة شائعة",
    homeFaq: [
      { q: "هل كتب PDF في هذا الموقع مجانية حقًا؟", a: "نعم. جميع الكتب مجانية دون اشتراك أو تسجيل، وهي أعمال من الملك العام يمكن لأي شخص قراءتها وتحميلها ومشاركتها قانونيًا." },
      { q: "كيف أحمّل كتاب PDF مجانًا؟", a: "ابحث عن عنوان أو مؤلف، وافتح صفحة الكتاب ثم اضغط على «تحميل PDF». ويمكنك أيضًا قراءته على الإنترنت أو اختيار صيغة EPUB للقارئ الإلكتروني." },
      { q: "هل يمكنني قراءة الكتب على الهاتف أو القارئ الإلكتروني؟", a: "نعم. تفتح صيغة PDF على كل الأجهزة، وتتكيف صيغة EPUB مع شاشات القارئات الإلكترونية والهواتف. ويعمل القارئ على الإنترنت أيضًا على الهاتف." },
    ],
  },
  es: {
    summarySource: "Resumen: Wikipedia (licencia CC BY-SA)",
    bookFaqTitle: "Preguntas sobre este libro",
    bookFaq: [
      { q: "¿Cómo descargar «{title}» en PDF gratis?", a: "Pulsa «Descargar PDF» en esta página: «{title}» de {author} se descarga gratis y sin registro. Formatos disponibles: {formats}." },
      { q: "¿Se puede leer «{title}» en línea sin descargarlo?", a: "Sí. El botón «Leer en línea» abre el libro en tu navegador, en ordenador, tableta o móvil, y recuerda la página donde te quedaste." },
      { q: "¿«{title}» está libre de derechos?", a: "«{title}» de {author} es de dominio público: puedes leerlo, descargarlo, imprimirlo y compartirlo libre y legalmente." },
    ],
    homeTitle: "Libros PDF gratis, legales y sin registro",
    homeText: [
      "Livres PDF Gratuits reúne {n} libros de dominio público para descargar gratis en PDF o EPUB, leer en línea o escuchar como audiolibro. Novelas, poesía, teatro, filosofía, historia y cuentos: los grandes clásicos de la literatura universal en una biblioteca digital gratuita.",
      "Cada libro tiene su ficha con un resumen, información sobre el autor y enlaces de descarga directa. No hace falta cuenta y todas las obras están libres de derechos: puedes leerlas en ordenador, lector electrónico o móvil, imprimirlas y compartirlas.",
    ],
    homeFaqTitle: "Preguntas frecuentes",
    homeFaq: [
      { q: "¿Los libros PDF de este sitio son realmente gratis?", a: "Sí. Todos los libros son gratuitos, sin suscripción ni registro. Son obras de dominio público que cualquiera puede leer, descargar y compartir legalmente." },
      { q: "¿Cómo descargar un libro en PDF gratis?", a: "Busca un título o autor, abre la ficha del libro y pulsa «Descargar PDF». También puedes leerlo en línea o elegir el formato EPUB para un lector electrónico." },
      { q: "¿Puedo leer los libros en un lector electrónico o en el móvil?", a: "Sí. El PDF se abre en cualquier dispositivo; el EPUB se adapta a lectores electrónicos y móviles. El lector en línea también funciona en el móvil." },
    ],
  },
  de: {
    summarySource: "Zusammenfassung: Wikipedia (Lizenz CC BY-SA)",
    bookFaqTitle: "Fragen zu diesem Buch",
    bookFaq: [
      { q: "Wie lade ich „{title}“ kostenlos als PDF herunter?", a: "Klicken Sie auf dieser Seite auf „PDF herunterladen“: „{title}“ von {author} ist kostenlos und ohne Anmeldung erhältlich. Verfügbare Formate: {formats}." },
      { q: "Kann ich „{title}“ online lesen, ohne es herunterzuladen?", a: "Ja. Die Schaltfläche „Online lesen“ öffnet das Buch direkt im Browser auf Computer, Tablet oder Handy und merkt sich, wo Sie aufgehört haben." },
      { q: "Ist „{title}“ urheberrechtsfrei?", a: "„{title}“ von {author} ist gemeinfrei: Sie dürfen es frei und legal lesen, herunterladen, ausdrucken und teilen." },
    ],
    homeTitle: "Kostenlose PDF-Bücher – legal und ohne Anmeldung",
    homeText: [
      "Livres PDF Gratuits bietet {n} gemeinfreie Bücher zum kostenlosen Download als PDF oder EPUB, zum Online-Lesen im Browser oder als Hörbuch. Romane, Lyrik, Theater, Philosophie, Geschichte und Märchen: die großen Klassiker der Weltliteratur in einer kostenlosen digitalen Bibliothek.",
      "Jedes Buch hat eine eigene Seite mit Zusammenfassung, Angaben zum Autor und direkten Download-Links. Ein Konto ist nicht nötig, und alle Werke sind urheberrechtsfrei: Lesen Sie sie auf Computer, E-Reader, Tablet oder Handy, drucken und teilen Sie sie.",
    ],
    homeFaqTitle: "Häufige Fragen",
    homeFaq: [
      { q: "Sind die PDF-Bücher auf dieser Website wirklich kostenlos?", a: "Ja. Alle Bücher sind kostenlos, ohne Abo und ohne Anmeldung. Es sind gemeinfreie Werke, die jeder legal lesen, herunterladen und teilen darf." },
      { q: "Wie lade ich ein PDF-Buch kostenlos herunter?", a: "Suchen Sie nach Titel oder Autor, öffnen Sie die Buchseite und klicken Sie auf „PDF herunterladen“. Sie können es auch online lesen oder EPUB für einen E-Reader wählen." },
      { q: "Kann ich die Bücher auf einem E-Reader oder Handy lesen?", a: "Ja. PDF öffnet sich überall; EPUB passt sich E-Readern und Handys an. Der Online-Reader funktioniert auch mobil." },
    ],
  },
  it: {
    summarySource: "Riassunto: Wikipedia (licenza CC BY-SA)",
    bookFaqTitle: "Domande su questo libro",
    bookFaq: [
      { q: "Come scaricare «{title}» in PDF gratis?", a: "Clicca su «Scarica PDF» in questa pagina: «{title}» di {author} si scarica gratis e senza registrazione. Formati disponibili: {formats}." },
      { q: "Si può leggere «{title}» online senza scaricarlo?", a: "Sì. Il pulsante «Leggi online» apre il libro nel browser su computer, tablet o telefono e ricorda la pagina in cui ti sei fermato." },
      { q: "«{title}» è libero da diritti?", a: "«{title}» di {author} è di pubblico dominio: puoi leggerlo, scaricarlo, stamparlo e condividerlo liberamente e legalmente." },
    ],
    homeTitle: "Libri PDF gratis, legali e senza registrazione",
    homeText: [
      "Livres PDF Gratuits raccoglie {n} libri di pubblico dominio da scaricare gratis in PDF o EPUB, leggere online o ascoltare come audiolibri. Romanzi, poesia, teatro, filosofia, storia e fiabe: i grandi classici della letteratura mondiale in una biblioteca digitale gratuita.",
      "Ogni libro ha una scheda con riassunto, informazioni sull'autore e link di download diretti. Non serve un account e tutte le opere sono libere da diritti: puoi leggerle su computer, e-reader, tablet o telefono, stamparle e condividerle.",
    ],
    homeFaqTitle: "Domande frequenti",
    homeFaq: [
      { q: "I libri PDF di questo sito sono davvero gratis?", a: "Sì. Tutti i libri sono gratuiti, senza abbonamento né registrazione. Sono opere di pubblico dominio che chiunque può leggere, scaricare e condividere legalmente." },
      { q: "Come scaricare un libro PDF gratis?", a: "Cerca un titolo o un autore, apri la scheda del libro e clicca su «Scarica PDF». Puoi anche leggerlo online o scegliere il formato EPUB per un e-reader." },
      { q: "Posso leggere i libri su e-reader o telefono?", a: "Sì. Il PDF si apre ovunque; l'EPUB si adatta a e-reader e telefoni. Il lettore online funziona anche da mobile." },
    ],
  },
  pt: {
    summarySource: "Resumo: Wikipédia (licença CC BY-SA)",
    bookFaqTitle: "Perguntas sobre este livro",
    bookFaq: [
      { q: "Como baixar «{title}» em PDF grátis?", a: "Clique em «Baixar PDF» nesta página: «{title}» de {author} é baixado gratuitamente e sem cadastro. Formatos disponíveis: {formats}." },
      { q: "É possível ler «{title}» online sem baixar?", a: "Sim. O botão «Ler online» abre o livro no navegador, no computador, tablet ou celular, e lembra a página onde você parou." },
      { q: "«{title}» é livre de direitos autorais?", a: "«{title}» de {author} está em domínio público: você pode lê-lo, baixá-lo, imprimi-lo e compartilhá-lo livre e legalmente." },
    ],
    homeTitle: "Livros em PDF grátis, legais e sem cadastro",
    homeText: [
      "Livres PDF Gratuits reúne {n} livros em domínio público para baixar grátis em PDF ou EPUB, ler online ou ouvir como audiolivro. Romances, poesia, teatro, filosofia, história e contos: os grandes clássicos da literatura mundial numa biblioteca digital gratuita.",
      "Cada livro tem uma página com resumo, informações sobre o autor e links de download direto. Não é preciso conta e todas as obras são livres de direitos: leia no computador, leitor digital, tablet ou celular, imprima e compartilhe.",
    ],
    homeFaqTitle: "Perguntas frequentes",
    homeFaq: [
      { q: "Os livros em PDF deste site são mesmo grátis?", a: "Sim. Todos os livros são gratuitos, sem assinatura nem cadastro. São obras em domínio público que qualquer pessoa pode ler, baixar e compartilhar legalmente." },
      { q: "Como baixar um livro em PDF grátis?", a: "Pesquise um título ou autor, abra a página do livro e clique em «Baixar PDF». Também pode lê-lo online ou escolher o formato EPUB para um leitor digital." },
      { q: "Posso ler os livros num leitor digital ou no celular?", a: "Sim. O PDF abre em qualquer aparelho; o EPUB se adapta a leitores digitais e celulares. O leitor online também funciona no celular." },
    ],
  },
  nl: {
    summarySource: "Samenvatting: Wikipedia (licentie CC BY-SA)",
    bookFaqTitle: "Vragen over dit boek",
    bookFaq: [
      { q: "Hoe download ik ‘{title}’ gratis als PDF?", a: "Klik op deze pagina op ‘PDF downloaden’: ‘{title}’ van {author} is gratis en zonder account te downloaden. Beschikbare formaten: {formats}." },
      { q: "Kan ik ‘{title}’ online lezen zonder te downloaden?", a: "Ja. De knop ‘Online lezen’ opent het boek direct in je browser op computer, tablet of telefoon en onthoudt waar je gebleven was." },
      { q: "Is ‘{title}’ rechtenvrij?", a: "‘{title}’ van {author} behoort tot het publieke domein: je mag het vrij en legaal lezen, downloaden, printen en delen." },
    ],
    homeTitle: "Gratis PDF-boeken, legaal en zonder account",
    homeText: [
      "Livres PDF Gratuits biedt {n} rechtenvrije boeken om gratis als PDF of EPUB te downloaden, online te lezen of als luisterboek te beluisteren. Romans, poëzie, toneel, filosofie, geschiedenis en sprookjes: de grote klassiekers van de wereldliteratuur in één gratis digitale bibliotheek.",
      "Elk boek heeft een eigen pagina met een samenvatting, informatie over de auteur en directe downloadlinks. Een account is niet nodig en alle werken zijn rechtenvrij: lees ze op computer, e-reader, tablet of telefoon, print en deel ze.",
    ],
    homeFaqTitle: "Veelgestelde vragen",
    homeFaq: [
      { q: "Zijn de PDF-boeken op deze site echt gratis?", a: "Ja. Alle boeken zijn gratis, zonder abonnement of account. Het zijn rechtenvrije werken die iedereen legaal mag lezen, downloaden en delen." },
      { q: "Hoe download ik gratis een PDF-boek?", a: "Zoek een titel of auteur, open de boekpagina en klik op ‘PDF downloaden’. Je kunt het ook online lezen of EPUB kiezen voor een e-reader." },
      { q: "Kan ik de boeken op een e-reader of telefoon lezen?", a: "Ja. PDF opent overal; EPUB past zich aan e-readers en telefoons aan. De online lezer werkt ook op mobiel." },
    ],
  },
  ru: {
    summarySource: "Краткое содержание: Википедия (лицензия CC BY-SA)",
    bookFaqTitle: "Вопросы об этой книге",
    bookFaq: [
      { q: "Как бесплатно скачать «{title}» в PDF?", a: "Нажмите «Скачать PDF» на этой странице: книга «{title}» ({author}) скачивается бесплатно и без регистрации. Доступные форматы: {formats}." },
      { q: "Можно ли читать «{title}» онлайн без скачивания?", a: "Да. Кнопка «Читать онлайн» открывает книгу прямо в браузере на компьютере, планшете или телефоне и запоминает, где вы остановились." },
      { q: "Свободна ли книга «{title}» от авторских прав?", a: "Книга «{title}» ({author}) находится в общественном достоянии: её можно свободно и законно читать, скачивать, печатать и распространять." },
    ],
    homeTitle: "Бесплатные книги в PDF — законно и без регистрации",
    homeText: [
      "Livres PDF Gratuits — это {n} книг из общественного достояния, которые можно бесплатно скачать в PDF или EPUB, читать онлайн или слушать как аудиокниги. Романы, поэзия, драматургия, философия, история и сказки: классика мировой литературы в бесплатной цифровой библиотеке.",
      "У каждой книги есть страница с кратким содержанием, сведениями об авторе и прямыми ссылками для скачивания. Аккаунт не нужен, все произведения свободны от авторских прав: читайте на компьютере, электронной книге или телефоне, печатайте и делитесь.",
    ],
    homeFaqTitle: "Частые вопросы",
    homeFaq: [
      { q: "Книги в PDF на этом сайте действительно бесплатны?", a: "Да. Все книги бесплатны, без подписки и регистрации. Это произведения из общественного достояния, которые любой может законно читать, скачивать и распространять." },
      { q: "Как бесплатно скачать книгу в PDF?", a: "Найдите название или автора, откройте страницу книги и нажмите «Скачать PDF». Также можно читать онлайн или выбрать формат EPUB для электронной книги." },
      { q: "Можно ли читать книги на электронной книге или телефоне?", a: "Да. PDF открывается на любом устройстве, EPUB подстраивается под экраны электронных книг и телефонов. Онлайн-читалка тоже работает на телефоне." },
    ],
  },
  tr: {
    summarySource: "Özet: Vikipedi (CC BY-SA lisansı)",
    bookFaqTitle: "Bu kitap hakkında sorular",
    bookFaq: [
      { q: "“{title}” ücretsiz PDF olarak nasıl indirilir?", a: "Bu sayfadaki “PDF indir” düğmesine tıklayın: {author} imzalı “{title}” ücretsiz ve kayıt olmadan indirilir. Mevcut biçimler: {formats}." },
      { q: "“{title}” indirmeden çevrimiçi okunabilir mi?", a: "Evet. “Çevrimiçi oku” düğmesi kitabı bilgisayar, tablet veya telefonda doğrudan tarayıcıda açar ve kaldığınız sayfayı hatırlar." },
      { q: "“{title}” telif hakkından muaf mı?", a: "{author} imzalı “{title}” kamu malıdır: onu özgürce ve yasal olarak okuyabilir, indirebilir, yazdırabilir ve paylaşabilirsiniz." },
    ],
    homeTitle: "Ücretsiz PDF kitaplar: yasal ve kayıtsız",
    homeText: [
      "Livres PDF Gratuits, PDF veya EPUB olarak ücretsiz indirilebilen, çevrimiçi okunabilen ya da sesli kitap olarak dinlenebilen {n} kamu malı kitap sunar. Romanlar, şiir, tiyatro, felsefe, tarih ve masallar: dünya edebiyatının büyük klasikleri ücretsiz bir dijital kütüphanede.",
      "Her kitabın özet, yazar bilgisi ve doğrudan indirme bağlantıları içeren bir sayfası vardır. Hesap gerekmez ve tüm eserler telif hakkından muaftır: bilgisayar, e-okuyucu, tablet veya telefonda okuyun, yazdırın ve paylaşın.",
    ],
    homeFaqTitle: "Sık sorulan sorular",
    homeFaq: [
      { q: "Bu sitedeki PDF kitaplar gerçekten ücretsiz mi?", a: "Evet. Tüm kitaplar abonelik veya kayıt olmadan ücretsizdir. Bunlar herkesin yasal olarak okuyabileceği, indirebileceği ve paylaşabileceği kamu malı eserlerdir." },
      { q: "Ücretsiz PDF kitap nasıl indirilir?", a: "Bir başlık veya yazar arayın, kitap sayfasını açın ve “PDF indir”e tıklayın. Kitabı çevrimiçi de okuyabilir veya e-okuyucu için EPUB biçimini seçebilirsiniz." },
      { q: "Kitapları e-okuyucuda veya telefonda okuyabilir miyim?", a: "Evet. PDF her cihazda açılır; EPUB e-okuyuculara ve telefonlara uyum sağlar. Çevrimiçi okuyucu mobilde de çalışır." },
    ],
  },
  zh: {
    summarySource: "简介：维基百科（CC BY-SA 许可）",
    bookFaqTitle: "关于本书的问题",
    bookFaq: [
      { q: "如何免费下载《{title}》PDF？", a: "点击本页的“下载PDF”：{author}的《{title}》可免费下载，无需注册。可用格式：{formats}。" },
      { q: "可以不下载直接在线阅读《{title}》吗？", a: "可以。“在线阅读”按钮会在电脑、平板或手机的浏览器中直接打开本书，并记住您读到的页面。" },
      { q: "《{title}》是否没有版权限制？", a: "{author}的《{title}》属于公有领域：您可以自由、合法地阅读、下载、打印和分享。" },
    ],
    homeTitle: "免费PDF图书：合法、无需注册",
    homeText: [
      "Livres PDF Gratuits 收录{n}本公有领域图书，可免费下载PDF或EPUB、在线阅读或收听有声书。小说、诗歌、戏剧、哲学、历史与童话：世界文学经典尽在这座免费数字图书馆。",
      "每本书都有独立页面，包含简介、作者信息和直接下载链接。无需账号，所有作品均无版权限制：可在电脑、电子阅读器、平板或手机上阅读，也可打印和分享。",
    ],
    homeFaqTitle: "常见问题",
    homeFaq: [
      { q: "本站的PDF图书真的免费吗？", a: "是的。所有图书均免费，无需订阅或注册。这些都是公有领域作品，任何人都可以合法阅读、下载和分享。" },
      { q: "如何免费下载PDF图书？", a: "搜索书名或作者，打开图书页面并点击“下载PDF”。也可以在线阅读，或为电子阅读器选择EPUB格式。" },
      { q: "可以在电子阅读器或手机上阅读吗？", a: "可以。PDF在任何设备上都能打开；EPUB会适配电子阅读器和手机屏幕。在线阅读器也支持手机。" },
    ],
  },
  ja: {
    summarySource: "あらすじ：ウィキペディア（CC BY-SA ライセンス）",
    bookFaqTitle: "この本についての質問",
    bookFaq: [
      { q: "『{title}』をPDFで無料ダウンロードするには？", a: "このページの「PDFをダウンロード」をクリックしてください。{author}の『{title}』は無料・登録不要でダウンロードできます。利用できる形式：{formats}。" },
      { q: "『{title}』はダウンロードせずにオンラインで読めますか？", a: "はい。「オンラインで読む」ボタンで、パソコン・タブレット・スマートフォンのブラウザで直接開けます。読んだページも記憶されます。" },
      { q: "『{title}』は著作権フリーですか？", a: "{author}の『{title}』はパブリックドメインです。自由かつ合法的に読み、ダウンロードし、印刷し、共有できます。" },
    ],
    homeTitle: "無料のPDF本：合法・登録不要",
    homeText: [
      "Livres PDF Gratuitsでは、パブリックドメインの本{n}冊をPDFやEPUBで無料ダウンロード、オンラインで閲覧、またはオーディオブックで聴くことができます。小説、詩、戯曲、哲学、歴史、童話など、世界文学の名作を無料のデジタル図書館に集めました。",
      "各本にはあらすじ、著者情報、直接ダウンロードリンクを載せたページがあります。アカウントは不要で、すべての作品が著作権フリー。パソコン、電子書籍リーダー、タブレット、スマートフォンで読み、印刷や共有もできます。",
    ],
    homeFaqTitle: "よくある質問",
    homeFaq: [
      { q: "このサイトのPDF本は本当に無料ですか？", a: "はい。すべての本が無料で、定期購読や登録は不要です。誰でも合法的に読み、ダウンロードし、共有できるパブリックドメイン作品です。" },
      { q: "PDF本を無料でダウンロードするには？", a: "書名または著者名で検索し、本のページを開いて「PDFをダウンロード」をクリックしてください。オンラインで読んだり、電子書籍リーダー用にEPUB形式を選んだりもできます。" },
      { q: "電子書籍リーダーやスマートフォンで読めますか？", a: "はい。PDFはどの端末でも開け、EPUBは電子書籍リーダーやスマートフォンの画面に合わせて表示されます。オンラインリーダーもスマートフォンに対応しています。" },
    ],
  },
};

export function seoContent(locale: Locale): SeoContent {
  return SEO_CONTENT[locale];
}

/** Remplace {clé} par sa valeur. */
export function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
