import type { Firestore } from "firebase/firestore";

/**
 * Le SDK Firebase est chargé UNIQUEMENT à la demande, dans le navigateur.
 *
 * Pourquoi : côté serveur, Next.js résout la version Node.js de Firestore (gRPC + protobufjs),
 * qui génère du code avec `new Function` dès son import — interdit sur Cloudflare Workers
 * (« EvalError: Code generation from strings disallowed »). Aucun module chargé pendant
 * le rendu serveur ne doit donc importer `firebase/*` de façon statique : seuls les
 * `import type` sont autorisés en dehors de `lib/firebase.ts`.
 */
export type FirestoreSdk = typeof import("firebase/firestore");

let loader: Promise<{ sdk: FirestoreSdk; db: Firestore }> | null = null;

export function loadFirestore(): Promise<{ sdk: FirestoreSdk; db: Firestore }> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Firestore n'est disponible que dans le navigateur."));
  }
  if (!loader) {
    loader = Promise.all([import("firebase/firestore"), import("@/lib/firebase")])
      .then(([sdk, { db }]) => ({ sdk, db }))
      .catch((error) => {
        loader = null; // permet une nouvelle tentative (ex. réseau coupé)
        throw error;
      });
  }
  return loader;
}

export const COLLECTIONS = {
  cars: "cars",
  rentals: "rentals",
  transactions: "transactions",
} as const;

/**
 * La transaction « entrée » d'une location a un identifiant déterministe :
 * liaison 1↔1 garantie, mise à jour / suppression sans requête supplémentaire.
 */
export const rentalTransactionId = (rentalId: string) => `rental_${rentalId}`;
