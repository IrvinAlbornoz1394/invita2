import styles from "./Loading.module.css";

const CONFETTI = Array.from({ length: 14 }, (_, i) => i);

export function InvitationLoading() {
  return (
    <div className={styles.wrap} role="status" aria-label="Cargando invitación">
      <div className={styles.confetti} aria-hidden>
        {CONFETTI.map((i) => (
          <span key={i} />
        ))}
      </div>
      <div className={styles.balloons} aria-hidden>
        <span className={styles.balloon} />
        <span className={styles.balloon} />
        <span className={styles.balloon} />
      </div>
    </div>
  );
}
