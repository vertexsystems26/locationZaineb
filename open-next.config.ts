import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Application entièrement côté client (données Firestore en temps réel) :
// pas d'ISR, donc pas besoin de cache incrémental R2 ni de liaison WORKER_SELF_REFERENCE.
export default defineCloudflareConfig();
