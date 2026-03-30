import type { ParsedNoteJson } from '@/types/database';

export type ParseMode = 'meeting_note' | 'plain_text_note' | 'chat_transcript';

export interface ParseInput {
  mode: ParseMode;
  /** Raw text content (for text/chat captures, or OCR text for images) */
  text?: string;
  /** Base64-encoded image data (for image captures) */
  imageBase64?: string;
  /** MIME type of the image */
  imageMimeType?: string;
}

export interface ParseResult {
  data?: ParsedNoteJson;
  error?: string;
}

/**
 * Provider interface — swap OpenAI for a local LLM later
 * by implementing this interface.
 */
export interface ParserProvider {
  parse(input: ParseInput): Promise<ParseResult>;
}
