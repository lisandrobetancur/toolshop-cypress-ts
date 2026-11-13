const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un importe como lo muestra la tienda: `$1,234.50`. */
export function money(amount: number): string {
  return `$${formatter.format(amount)}`;
}

/** Convierte un texto de precio (`$1,234.50`) en número. */
export function parseMoney(text: string): number {
  return Number(text.replace(/[^0-9.-]/g, ''));
}

/** Suma en centavos para evitar errores de coma flotante al calcular totales esperados. */
export function sumLines(lines: { price: number; quantity: number }[]): number {
  const cents = lines.reduce(
    (total, line) => total + Math.round(line.price * 100) * line.quantity,
    0,
  );
  return cents / 100;
}
