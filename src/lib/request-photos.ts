/** Carpeta del bucket donde el cliente sube sus fotos (la política de Storage solo deja esta). */
export const requestPhotoFolder = (requestId: string) => `solicitudes/${requestId}`;

/** URL pública con la que empiezan las fotos de una solicitud */
export const requestPhotoPrefix = (requestId: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${requestPhotoFolder(requestId)}/`;
