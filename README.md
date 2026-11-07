# Location Zaineb — Dashboard de gestion

Application web d'administration pour une petite activité de location de voitures :
flotte, locations, calendrier (planning par voiture) et finances (entrées / sorties en DT).

**Stack :** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · composants style shadcn/ui (Radix) ·
Firebase Firestore (SDK modulaire) · react-hook-form + zod · Recharts · date-fns (locale fr) · lucide-react · sonner.

Pas d'authentification : l'accès au dashboard est direct.

---

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs (déjà fait si .env.local existe)
npm run dev                  # http://localhost:3000
```

Autres commandes :

```bash
npm run build && npm start   # build de production
npm run lint                 # ESLint
npm run typecheck            # vérification TypeScript
```

### Firestore

1. Console Firebase → **Firestore Database** → créer la base (mode production ou test).
2. Publier les règles de développement du fichier `firestore.rules` :
   - soit en les copiant dans Console → Firestore → **Règles** ;
   - soit en ligne de commande :
     ```bash
     npx firebase-tools login
     npx firebase-tools deploy --only firestore:rules
     ```

> ⚠️ Les règles fournies sont **ouvertes** (lecture/écriture pour tous). Elles conviennent au
> développement uniquement. Avant une mise en ligne publique, ajoutez une authentification et
> restreignez les règles.

Aucun index composite n'est nécessaire : l'app écoute les collections complètes en temps réel
(adapté à une petite flotte) et ne fait qu'une requête simple `where("carId", "==", …)`.

---

## Arborescence

```
.
├── app/
│   ├── layout.tsx               # Layout racine : police, providers, sidebar
│   ├── globals.css              # Thème Tailwind v4 (tokens) + animations
│   ├── page.tsx                 # /            Tableau de bord
│   ├── voitures/page.tsx        # /voitures    Flotte
│   ├── voitures/[id]/page.tsx   # /voitures/:id Détail voiture
│   ├── locations/page.tsx       # /locations   Liste filtrable
│   ├── calendrier/page.tsx      # /calendrier  Planning (timeline par voiture)
│   ├── finances/page.tsx        # /finances    Entrées, sorties, graphiques, CSV
│   └── not-found.tsx
├── components/
│   ├── ui/                      # Primitives (button, input/select/textarea, dialog, alert-dialog,
│   │                            #   tabs, table, card, badge, skeleton, label)
│   ├── layout/app-shell.tsx     # Sidebar ordinateur + menu mobile
│   ├── providers/
│   │   ├── providers.tsx        # DataProvider + DialogsProvider + Toaster + Analytics
│   │   ├── data-provider.tsx    # onSnapshot temps réel + synchronisation des statuts
│   │   ├── dialogs-context.ts   # API useDialogs()
│   │   └── dialogs-provider.tsx # Fenêtres globales (formulaires, confirmations)
│   ├── shared/                  # PageHeader, EmptyState, StatCard, badges, FormField, ConfirmDialog
│   ├── charts/                  # Barres entrées/sorties, camembert dépenses, solde cumulé
│   ├── dashboard/               # Vue tableau de bord
│   ├── cars/                    # Liste, formulaire, détail voiture
│   ├── rentals/                 # Liste, tableau, formulaire, détails location
│   ├── calendar/                # Vue calendrier + timeline
│   └── finances/                # Vue finances, tableau et formulaire de transaction
├── hooks/
│   ├── use-cars.ts              # useCars(), useCar(id), useCarsById()
│   ├── use-rentals.ts           # useRentals(), useToday()
│   ├── use-transactions.ts      # useTransactions()
│   └── use-actions.ts           # Suppressions / annulations avec confirmation + toasts
├── lib/
│   ├── firebase.ts              # Initialisation unique, Firestore, Analytics côté client
│   ├── firestore/               # Références de collections + conversion des documents
│   ├── services/                # Écritures Firestore (cars, rentals, transactions, status-sync)
│   ├── rental-logic.ts          # Règles métier pures : jours, total, chevauchements, statuts
│   ├── finance.ts               # Agrégations : totaux, séries mensuelles, catégories, solde
│   ├── schemas.ts               # Schémas zod des formulaires
│   ├── dates.ts / format.ts     # Dates (fr) et montants (DT, 3 décimales)
│   ├── csv.ts                   # Export CSV (séparateur ;, UTF-8 BOM pour Excel)
│   └── constants.ts             # Libellés, couleurs des statuts et catégories
├── types/index.ts               # Car, Rental, Transaction…
├── firestore.rules              # Règles ouvertes (développement)
├── firebase.json / .firebaserc  # Déploiement des règles avec firebase-tools
└── .env.example                 # Variables NEXT_PUBLIC_FIREBASE_*
```

---

## Modèle de données

Dates « jour » stockées en texte ISO `yyyy-MM-dd` (triables, sans problème de fuseau horaire) ;
`createdAt` en `serverTimestamp()`.

| Collection     | Champs |
|----------------|--------|
| `cars`         | brand, model, plate, year, color, dailyPrice, mileage, status (`disponible` \| `loué` \| `maintenance`), notes, createdAt |
| `rentals`      | carId, carLabel, clientName, clientPhone, startDate, endDate, dailyPrice, days, totalPrice, status (`à venir` \| `en cours` \| `terminée` \| `annulée`), notes, createdAt |
| `transactions` | type (`entrée` \| `sortie`), category, amount, date, carId?, rentalId?, description, createdAt |

Catégories : entrées `location` (et `autre` pour un encaissement manuel hors location) ;
sorties `vidange`, `assurance`, `vignette`, `réparation`, `carburant`, `lavage`, `pneus`, `autre`.

## Règles métier

- **Création d'une location** : un `writeBatch` écrit la location **et** sa transaction « entrée »
  (`location`, montant = total, liée à `carId` et `rentalId`). La transaction a l'identifiant
  `rental_<idLocation>` : la liaison est 1↔1.
- **Modification** (dates, prix, voiture) : la transaction liée est mise à jour dans le même batch.
- **Annulation** : statut `annulée` + suppression de la transaction liée. **Suppression** : les deux sont supprimées.
  Les entrées liées ne sont pas modifiables depuis Finances (on passe par la location).
- **Chevauchements interdits** : vérifiés en direct dans le formulaire (voitures indisponibles grisées,
  message d'erreur) puis revérifiés côté serveur juste avant l'enregistrement.
- **Durée** : facturation par 24 h — du 3 au 5 = 2 jours, retour le jour même = 1 jour minimum.
  Une voiture rendue le 5 peut repartir le 5. Pour facturer chaque jour calendaire (du 3 au 5 = 3 jours),
  modifiez `computeDays` et `occupiedEnd` dans `lib/rental-logic.ts`.
- **Statuts automatiques** : le statut d'une location découle de ses dates (sauf `annulée`) ; une voiture
  passe à `loué` quand une location est en cours aujourd'hui, et revient à `disponible` ensuite
  (une voiture en `maintenance` le reste). Les corrections sont écrites dans Firestore automatiquement
  à l'ouverture de l'app et à minuit.
- **Suppression d'une voiture** : bloquée tant qu'elle a des locations en cours ou à venir ;
  l'historique (locations, transactions) est conservé pour les finances.
