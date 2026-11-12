import { Suspense } from "react";
import DesignShell from "@/components/design/shell";
import AuthLanding from "@/components/auth/auth-landing";

export const metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <DesignShell>
      <Suspense fallback={null}>
        <AuthLanding mode="signin" />
      </Suspense>
    </DesignShell>
  );
}
