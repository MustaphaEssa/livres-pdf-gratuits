"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { userLogout } from "@/lib/user-client";
import { useI18n } from "@/components/i18n-provider";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useI18n();

  const handleLogout = async () => {
    await userLogout();
    router.push("/");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      {t.compte.logout}
    </Button>
  );
}
