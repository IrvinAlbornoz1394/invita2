import styles from "./Loading.module.css";

export function InvitationLoading() {
  return (
    <div className={styles.wrap} role="status" aria-label="Cargando invitación">
      <span className={styles.gift} />
    </div>
  );
}
