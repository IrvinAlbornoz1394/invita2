import { Suspense } from "react";
import type { Metadata } from "next";
import styles from "../admin.module.css";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar · Panel", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className={styles.shell}>
      <div className={styles.loginWrap}>
        <div className={`${styles.card} ${styles.loginCard}`}>
          <h1 className={styles.loginTitle}>Invitaciones</h1>
          <p className={styles.cardHint}>Entra con tu cuenta de administrador.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
