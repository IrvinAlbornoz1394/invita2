import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../actions";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: { template: "%s · Panel", default: "Panel" },
  robots: { index: false },
};

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/admin">
          Invitaciones
        </Link>
        <nav className={styles.nav}>
          <Link href="/admin">Invitaciones</Link>
          <Link href="/admin/temas">Temas</Link>
        </nav>
        <Suspense>
          <User />
        </Suspense>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

async function User() {
  const { email } = await requireAdmin();
  return (
    <div className={styles.user}>
      <span>{email}</span>
      <form action={signOut}>
        <button className={`${styles.btn} ${styles.btnSmall}`}>Salir</button>
      </form>
    </div>
  );
}
