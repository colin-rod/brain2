export type DetectedTextType = 'text' | 'email' | 'chat_transcript';

const HEADER_RE = /^\s*(from|to|subject)\s*:/gim;
const CHAT_LINE_RE = /^\s*(\[?\d{1,2}:\d{2}(\s?[ap]m)?\]?\s+)?[A-Z][\w .'-]{0,30}:\s/gim;

export function detectTextType(text: string): DetectedTextType {
  if (text.length < 20) return 'text';

  const headers = text.match(HEADER_RE) ?? [];
  const uniqueHeaders = new Set(
    headers.map((m) =>
      m
        .trim()
        .toLowerCase()
        .replace(/\s*:.*/, ''),
    ),
  );
  if (uniqueHeaders.size >= 2) return 'email';

  if ((text.match(CHAT_LINE_RE) ?? []).length >= 3) return 'chat_transcript';

  return 'text';
}
