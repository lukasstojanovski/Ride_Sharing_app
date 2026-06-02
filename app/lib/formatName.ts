export function capitalizeName(str: string): string {
  return str
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ")
    .trim();
}
