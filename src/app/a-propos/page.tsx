import DesignShell from "@/components/design/shell";
import { getServerI18n } from "@/i18n/server";

export const metadata = { title: "À propos" };

export default async function AboutPage() {
  const { t } = await getServerI18n();

  const values = [
    { title: t.about.value1Title, description: t.about.value1Desc },
    { title: t.about.value2Title, description: t.about.value2Desc },
    { title: t.about.value3Title, description: t.about.value3Desc },
    { title: t.about.value4Title, description: t.about.value4Desc },
  ];

  return (
    <DesignShell>
      <div className="wrap">
        <div className="page-head">
          <div>
            <div className="eyebrow">À propos</div>
            <h1>{t.about.heroTitle}</h1>
            <p>{t.about.heroSubtitle}</p>
          </div>
        </div>

        <section className="section" style={{ paddingTop: 0 }}>
          <h2 className="section-head" style={{ marginBottom: 16 }}>
            {t.about.missionTitle}
          </h2>
          <p className="prose">{t.about.missionP1}</p>
          <p className="prose" style={{ marginTop: 16 }}>
            {t.about.missionP2}
          </p>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>{t.about.valuesTitle}</h2>
          </div>
          <div className="format-cards">
            {values.map((v) => (
              <div key={v.title} className="format-card">
                <h3 style={{ fontSize: 20 }}>{v.title}</h3>
                <p>{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>{t.about.teamTitle}</h2>
          </div>
          <p className="prose">{t.about.teamP1}</p>
          <p className="prose" style={{ marginTop: 16 }}>
            {t.about.teamP2}
          </p>
        </section>
      </div>
    </DesignShell>
  );
}
