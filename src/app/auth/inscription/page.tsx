import { Suspense } from "react";
import DesignShell from "@/components/design/shell";
import AuthLanding from "@/components/auth/auth-landing";

export const metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <DesignShell>
      <Suspense fallback={null}>
        <AuthLanding mode="signup" />
      </Suspense>
    </DesignShell>
  );
}
