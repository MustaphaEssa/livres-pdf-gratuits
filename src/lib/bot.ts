// Détection simple des robots / clients automatisés à partir du User-Agent.
// Sert à ne pas gonfler les compteurs (téléchargements, vues) avec du trafic non humain.

const BOT_RE = new RegExp(
  [
    "bot\\b", "bot/", "crawl", "spider", "slurp", "scrap", "fetch", "preview",
    "facebookexternalhit", "facebot", "meta-externalagent", "whatsapp", "telegram",
    "discord", "skype", "embedly", "pinterest", "linkedin", "vkshare", "quora",
    "ahrefs", "semrush", "mj12", "dotbot", "petalbot", "bytespider", "yandex",
    "baidu", "sogou", "seznam", "duckduck", "applebot", "amazonbot", "gptbot",
    "chatgpt", "oai-searchbot", "claude", "anthropic", "perplexity", "ccbot",
    "diffbot", "dataforseo", "serpstat", "barkrowler", "blexbot", "headless",
    "phantomjs", "puppeteer", "playwright", "selenium", "lighthouse",
    "pagespeed", "gtmetrix", "pingdom", "uptime", "monitor", "statuscake",
    "curl", "wget", "python", "aiohttp", "httpx", "go-http", "java/", "okhttp",
    "axios", "node-fetch", "undici", "libwww", "httpclient", "postman",
    "insomnia", "scrapy", "archive.org", "ia_archiver", "heritrix",
  ].join("|"),
  "i"
);

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.length < 20) return true; // UA absent ou trop court = automatisé
  return BOT_RE.test(userAgent);
}
