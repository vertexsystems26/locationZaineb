import type {
  CarStatus,
  ExpenseCategory,
  IncomeCategory,
  RentalStatus,
  TransactionCategory,
} from "@/types";

export const APP_NAME = "Location Zaineb";

export const CAR_STATUS_META: Record<CarStatus, { label: string; className: string; dot: string }> = {
  disponible: {
    label: "Disponible",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  loué: {
    label: "Loué",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-amber-50 text-amber-800 ring-amber-600/25",
    dot: "bg-amber-500",
  },
};

export const RENTAL_STATUS_META: Record<RentalStatus, { label: string; className: string; dot: string }> = {
  "à venir": {
    label: "À venir",
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
    dot: "bg-violet-500",
  },
  "en cours": {
    label: "En cours",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  terminée: {
    label: "Terminée",
    className: "bg-slate-100 text-slate-700 ring-slate-500/20",
    dot: "bg-slate-400",
  },
  annulée: {
    label: "Annulée",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
  },
};

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  location: "Location",
  vidange: "Vidange",
  assurance: "Assurance",
  vignette: "Vignette",
  réparation: "Réparation",
  carburant: "Carburant",
  lavage: "Lavage",
  pneus: "Pneus",
  autre: "Autre",
};

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  location: "Location",
  autre: "Autre entrée",
};

/**
 * Palette catégorielle validée (ordre fixe, sûr pour le daltonisme sur les paires adjacentes).
 * La couleur suit l'entité : une catégorie garde toujours la même couleur, quel que soit le filtre.
 */
export const CATEGORICAL_PALETTE = [
  "#2a78d6", // bleu
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // jaune
  "#e87ba4", // magenta
  "#008300", // vert
  "#6250d6", // violet
  "#e34948", // rouge
] as const;

/** Couleur du texte posé sur une couleur de la palette (noir sur le jaune, blanc ailleurs). */
export function textOnPalette(color: string): string {
  return color === "#eda100" ? "#0b0b0b" : "#ffffff";
}

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  vidange: CATEGORICAL_PALETTE[0],
  assurance: CATEGORICAL_PALETTE[1],
  vignette: CATEGORICAL_PALETTE[2],
  réparation: CATEGORICAL_PALETTE[3],
  carburant: CATEGORICAL_PALETTE[4],
  lavage: CATEGORICAL_PALETTE[5],
  pneus: CATEGORICAL_PALETTE[6],
  autre: CATEGORICAL_PALETTE[7],
};

/** Couleurs des graphiques (marques en couleur, texte en encre neutre). */
export const CHART = {
  income: CATEGORICAL_PALETTE[0],
  expense: CATEGORICAL_PALETTE[1],
  balance: CATEGORICAL_PALETTE[0],
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
  surface: "#ffffff",
} as const;
