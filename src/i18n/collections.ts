import type { Locale } from "./config";

/**
 * Traductions des collections éditoriales (créées par scripts/seed-collections.mjs).
 * Le français reste celui de la base ; une collection créée depuis l'admin et
 * absente d'ici s'affiche telle qu'elle a été saisie.
 */
type Entry = { title: string; description: string };
type Tr = Partial<Record<Exclude<Locale, "fr">, Entry>>;

const COLLECTIONS: Record<string, Tr> = {
  "a-lire-absolument": {
    en: { title: "Must-reads", description: "Our most-viewed books across all genres — an ideal way into the public domain." },
    es: { title: "Imprescindibles", description: "Nuestros libros más consultados, de todos los géneros: la puerta de entrada ideal al dominio público." },
    ar: { title: "كتب لا بد من قراءتها", description: "أكثر كتبنا مشاهدةً من جميع الأنواع — مدخل مثالي إلى كتب الملك العام." },
    de: { title: "Pflichtlektüre", description: "Unsere meistgelesenen Bücher aller Genres – der ideale Einstieg in die Gemeinfreiheit." },
    it: { title: "Da leggere assolutamente", description: "I nostri libri più consultati, di ogni genere: la porta d'ingresso ideale al pubblico dominio." },
    pt: { title: "Leitura obrigatória", description: "Os nossos livros mais consultados, de todos os gêneros — a porta de entrada ideal para o domínio público." },
    nl: { title: "Absoluut lezen", description: "Onze meest bekeken boeken uit alle genres — de ideale toegang tot het publieke domein." },
    ru: { title: "Обязательно к прочтению", description: "Самые популярные книги всех жанров — идеальный вход в мир общественного достояния." },
    tr: { title: "Mutlaka okunmalı", description: "Tüm türlerden en çok görüntülenen kitaplarımız — kamu malı eserlere ideal bir giriş kapısı." },
    zh: { title: "必读之书", description: "各类型中最受欢迎的图书——走进公有领域的理想入口。" },
    ja: { title: "必読の一冊", description: "ジャンルを問わず最も読まれている本。パブリックドメインへの最適な入り口です。" },
  },
  "grands-romans-classiques": {
    en: { title: "Great classic novels", description: "Great works of fiction to (re)discover: stories that have stood the test of centuries." },
    es: { title: "Grandes novelas clásicas", description: "Grandes obras de ficción para (re)descubrir: relatos que han atravesado los siglos." },
    ar: { title: "روائع الروايات الكلاسيكية", description: "أعمال روائية عظيمة لإعادة اكتشافها: حكايات عبرت القرون." },
    de: { title: "Große klassische Romane", description: "Große Werke der Literatur zum (Wieder-)Entdecken: Geschichten, die Jahrhunderte überdauert haben." },
    it: { title: "Grandi romanzi classici", description: "Grandi opere di narrativa da (ri)scoprire: storie che hanno attraversato i secoli." },
    pt: { title: "Grandes romances clássicos", description: "Grandes obras de ficção para (re)descobrir: histórias que atravessaram os séculos." },
    nl: { title: "Grote klassieke romans", description: "Grote fictiewerken om (opnieuw) te ontdekken: verhalen die eeuwen hebben doorstaan." },
    ru: { title: "Великие классические романы", description: "Великие художественные произведения, которые стоит (пере)открыть: истории, пережившие века." },
    tr: { title: "Büyük klasik romanlar", description: "(Yeniden) keşfedilecek büyük kurgu eserleri: yüzyıllara meydan okuyan hikâyeler." },
    zh: { title: "经典长篇小说", description: "值得（重新）发现的伟大小说：穿越数个世纪的故事。" },
    ja: { title: "古典名作小説", description: "（再）発見したい名作フィクション。何世紀も読み継がれてきた物語です。" },
  },
  "s-initier-a-la-philosophie": {
    en: { title: "Getting started with philosophy", description: "Founding texts to think for yourself, from the Ancients to the philosophers of the Enlightenment." },
    es: { title: "Iniciarse en la filosofía", description: "Textos fundacionales para pensar por uno mismo, de los Antiguos a los filósofos de la Ilustración." },
    ar: { title: "مدخل إلى الفلسفة", description: "نصوص مؤسِّسة لتفكر بنفسك، من القدماء إلى فلاسفة عصر التنوير." },
    de: { title: "Einstieg in die Philosophie", description: "Grundlegende Texte zum Selbstdenken – von der Antike bis zu den Philosophen der Aufklärung." },
    it: { title: "Avvicinarsi alla filosofia", description: "Testi fondamentali per pensare con la propria testa, dagli Antichi ai filosofi dell'Illuminismo." },
    pt: { title: "Iniciação à filosofia", description: "Textos fundadores para pensar por si mesmo, dos Antigos aos filósofos do Iluminismo." },
    nl: { title: "Kennismaken met filosofie", description: "Grondleggende teksten om zelf te leren denken, van de Ouden tot de filosofen van de Verlichting." },
    ru: { title: "Введение в философию", description: "Основополагающие тексты, чтобы мыслить самостоятельно: от древних мыслителей до философов Просвещения." },
    tr: { title: "Felsefeye giriş", description: "Kendi başına düşünmek için kurucu metinler: Antik Çağ'dan Aydınlanma filozoflarına." },
    zh: { title: "哲学入门", description: "从古代先贤到启蒙思想家，助你独立思考的奠基之作。" },
    ja: { title: "はじめての哲学", description: "古代から啓蒙思想家まで、自分の頭で考えるための基本テキスト。" },
  },
  "au-fil-de-l-histoire": {
    en: { title: "Through history", description: "Chronicles, memoirs and major studies to understand the past through those who wrote it." },
    es: { title: "A través de la historia", description: "Crónicas, memorias y grandes estudios para comprender el pasado a través de quienes lo escribieron." },
    ar: { title: "عبر التاريخ", description: "حوليات ومذكرات ودراسات كبرى لفهم الماضي من خلال من كتبوه." },
    de: { title: "Streifzüge durch die Geschichte", description: "Chroniken, Memoiren und große Studien, um die Vergangenheit durch ihre Zeitzeugen zu verstehen." },
    it: { title: "Lungo il filo della Storia", description: "Cronache, memorie e grandi studi per capire il passato attraverso chi lo ha scritto." },
    pt: { title: "Ao longo da História", description: "Crônicas, memórias e grandes estudos para compreender o passado através de quem o escreveu." },
    nl: { title: "Door de geschiedenis", description: "Kronieken, memoires en grote studies om het verleden te begrijpen via wie het opschreef." },
    ru: { title: "Сквозь историю", description: "Хроники, мемуары и большие исследования, чтобы понять прошлое глазами тех, кто его описал." },
    tr: { title: "Tarihin izinde", description: "Geçmişi, onu yazanların gözünden anlamak için vakayinameler, anılar ve büyük incelemeler." },
    zh: { title: "历史长河", description: "编年史、回忆录与重要研究，透过亲历者的笔触理解过去。" },
    ja: { title: "歴史をたどる", description: "年代記や回想録、重要な研究書を通して、書き手の目から過去を知る。" },
  },
  "le-gout-de-la-poesie": {
    en: { title: "A taste for poetry", description: "Collections and anthologies to savour line by line — language at its purest." },
    es: { title: "El gusto por la poesía", description: "Poemarios y antologías para saborear verso a verso: el lenguaje en estado puro." },
    ar: { title: "متعة الشعر", description: "دواوين ومختارات تُتذوَّق بيتًا بيتًا — اللغة في أنقى صورها." },
    de: { title: "Freude an der Poesie", description: "Gedichtbände und Anthologien, Vers für Vers zu genießen – Sprache in ihrer reinsten Form." },
    it: { title: "Il gusto della poesia", description: "Raccolte e antologie da gustare verso dopo verso: la lingua allo stato puro." },
    pt: { title: "O gosto pela poesia", description: "Coletâneas e antologias para saborear verso a verso — a língua em estado puro." },
    nl: { title: "De smaak van poëzie", description: "Bundels en bloemlezingen om vers voor vers te proeven — taal in haar zuiverste vorm." },
    ru: { title: "Вкус поэзии", description: "Сборники и антологии, которые хочется смаковать строка за строкой, — язык в чистом виде." },
    tr: { title: "Şiirin tadı", description: "Dize dize tadını çıkaracağınız şiir kitapları ve antolojiler — dilin en saf hâli." },
    zh: { title: "诗歌之味", description: "逐行品味的诗集与选集——最纯粹的语言之美。" },
    ja: { title: "詩を味わう", description: "一行ずつ味わいたい詩集とアンソロジー。最も純粋なことばの姿。" },
  },
  "sciences-et-decouvertes": {
    en: { title: "Science & discovery", description: "Curiosity on every page: nature, the world and knowledge explained." },
    es: { title: "Ciencia y descubrimientos", description: "La curiosidad página a página: la naturaleza, el mundo y el saber explicados." },
    ar: { title: "العلوم والاكتشافات", description: "روح الفضول عبر الصفحات: الطبيعة والعالم والمعرفة بأسلوب واضح." },
    de: { title: "Wissenschaft & Entdeckungen", description: "Neugier auf jeder Seite: Natur, Welt und Wissen erklärt." },
    it: { title: "Scienze e scoperte", description: "La curiosità pagina dopo pagina: la natura, il mondo e il sapere spiegati." },
    pt: { title: "Ciências e descobertas", description: "A curiosidade página a página: a natureza, o mundo e o saber explicados." },
    nl: { title: "Wetenschap & ontdekkingen", description: "Nieuwsgierigheid op elke pagina: de natuur, de wereld en kennis uitgelegd." },
    ru: { title: "Наука и открытия", description: "Любознательность на каждой странице: природа, мир и знания простым языком." },
    tr: { title: "Bilim ve keşifler", description: "Her sayfada merak: doğa, dünya ve bilgi anlaşılır biçimde." },
    zh: { title: "科学与发现", description: "每一页都充满好奇：讲述自然、世界与知识。" },
    ja: { title: "科学と発見", description: "ページをめくるたびに好奇心を刺激。自然、世界、知識をわかりやすく。" },
  },
};

/** Titre et description de la collection dans la langue de la page (repli : texte en base). */
export function localizeCollection<T extends { slug: string; title: string; description?: string | null }>(
  locale: Locale,
  c: T
): T {
  if (locale === "fr") return c;
  const tr = COLLECTIONS[c.slug]?.[locale];
  return tr ? { ...c, title: tr.title, description: tr.description } : c;
}
