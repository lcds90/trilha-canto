export function getLocalDayISO(date: Date = new Date()): string {
  // Ajusta o timestamp considerando o timezone offset local para evitar
  // que o toISOString (que usa UTC) retorne o dia seguinte/anterior dependendo do fuso.
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return d.toISOString().split('T')[0]!
}
