/**
 * Build the canonical text used to embed a person or project.
 * Mirrors the fields the keyword search already weights:
 * primary (name), secondary (role/status), tertiary (compiled_summary).
 */
export function buildEntityEmbeddingText(input: {
  name: string;
  roleOrStatus?: string | null;
  summary?: string | null;
}): string {
  return [input.name, input.roleOrStatus ?? '', input.summary ?? '']
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}
