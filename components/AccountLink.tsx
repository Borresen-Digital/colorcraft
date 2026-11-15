"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hentKontoStatus } from "@/lib/authClient";
import { btn } from "@/lib/ui";
import { kontoPath } from "@/lib/accountPaths";
import { useI18n } from "@/components/I18nProvider";

/** «Konto» i toppen, bare når kontoene er slått på. */
export function AccountLink() {
  const { locale, t } = useI18n();
  const [på, setPå] = useState(false);
  useEffect(() => {
    hentKontoStatus().then((s) => setPå(s.enabled));
  }, []);
  if (!på) return null;
  return (
    <Link href={kontoPath(locale)} className={btn("ghost", "sm")}>
      {t.account.account}
    </Link>
  );
}
