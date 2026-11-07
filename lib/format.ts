const currencyFormatter = new Intl.NumberFormat("fr-TN", {
  style: "currency",
  currency: "TND",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const numberFormatter = new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 });

const compactFormatter = new Intl.NumberFormat("fr-TN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Montant en dinars tunisiens, 3 décimales : « 1 234,500 DT ». */
export function formatDT(value: number | null | undefined): string {
  return currencyFormatter.format(Number.isFinite(value) ? (value as number) : 0);
}

/** Version courte pour les axes des graphiques : « 1,5 k ». */
export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatKm(value: number): string {
  return `${numberFormatter.format(value)} km`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count > 1 ? plural : singular}`;
}
