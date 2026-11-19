import type { RequestState } from "@/lib/requests";
import styles from "./admin.module.css";

/** Color de la etiqueta de estado de una solicitud */
export const STATE_BADGE: Record<RequestState, string> = {
  pendiente: styles.badge,
  recibida: `${styles.badge} ${styles.badgeOk}`,
  aprobada: `${styles.badge} ${styles.badgeOk}`,
  vencida: `${styles.badge} ${styles.badgePast}`,
  rechazada: `${styles.badge} ${styles.badgeOff}`,
};
