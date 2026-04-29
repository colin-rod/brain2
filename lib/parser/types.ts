import type { ParsedNoteJson } from '@/types/database';

export type ParseMode = 'meeting_note' | 'plain_text_note' | 'chat_transcript' | 'email';

export interface ParseInput {
  mode: ParseMode;
  /** Raw text content (for text/chat captures, or OCR text for images) */
  text?: string;
  /** Base64-encoded image data (for image captures) */
  imageBase64?: string;
  /** MIME type of the image */
  imageMimeType?: string;
  /** Optional user-provided note that accompanies a file capture. */
  userContext?: string;
}

export interface ParseResult {
  data?: ParsedNoteJson;
  error?: string;
}

export interface TranscribeInput {
  audio: Blob | File;
  filename: string;
}

export interface TranscribeResult {
  text?: string;
  error?: string;
}

export interface ParserProvider {
  parse(input: ParseInput): Promise<ParseResult>;
  transcribeAudio(input: TranscribeInput): Promise<TranscribeResult>;
}
