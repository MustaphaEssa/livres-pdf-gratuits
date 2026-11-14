import { Suspense } from "react";
import DesignShell from "@/components/design/shell";
import AuthLanding from "@/components/auth/auth-landing";
import { getServerI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return { title: t.meta.login, robots: { index: false } };
}

export default function LoginPage() {
  return (
    <DesignShell>
      <Suspense fallback={null}>
        <AuthLanding mode="signin" />
      </Suspense>
    </DesignShell>
  );
}
