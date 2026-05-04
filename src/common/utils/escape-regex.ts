/** Escape user input for safe use inside `RegExp` (substring match). */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
