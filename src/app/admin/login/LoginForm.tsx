"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import styles from "../admin.module.css";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    params.get("e") === "sin-acceso" ? "Esta cuenta no tiene acceso al panel." : null
  );
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setPending(false);
      setError(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : error.message);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className={styles.grid} onSubmit={submit}>
      {error && <p className={styles.error}>{error}</p>}
      <label className={styles.field}>
        <span className={styles.label}>Correo</span>
        <input className={styles.input} name="email" type="email" autoComplete="email" required />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Contraseña</span>
        <input className={styles.input} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
