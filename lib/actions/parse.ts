'use server';

import { createClient } from '@/lib/supabase/server';
import { OpenAIParserProvider } from '@/lib/parser/openai-provider';
import type { ParseMode } from '@/lib/parser/types';
import type { CaptureSourceType } from '@/types/database';

const sourceToParseModeMap: Record<CaptureSourceType, ParseMode> = {
  image: 'meeting_note',
  text: 'plain_text_note',
  chat_transcript: 'chat_transcript',
  voice: 'plain_text_note',
  email: 'email',
};

interface ParseCaptureResult {
  success: boolean;
  error?: string;
}

export async function parseCapture(captureId: string): Promise<ParseCaptureResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Load the capture
  const { data: capture, error: fetchError } = await supabase
    .from('captures')
    .select('*')
    .eq('id', captureId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !capture) {
    return { success: false, error: 'Capture not found' };
  }

  // Mark as processing
  await supabase.from('captures').update({ status: 'processing' }).eq('id', captureId);

  try {
    const parser = new OpenAIParserProvider();
    const mode = sourceToParseModeMap[capture.source_type as CaptureSourceType];

    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    // If image capture, download from Storage and convert to base64
    if (capture.source_type === 'image' && capture.file_path) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('captures')
        .download(capture.file_path);

      if (downloadError || !fileData) {
        await supabase
          .from('captures')
          .update({ status: 'failed', error_message: `Download failed: ${downloadError?.message}` })
          .eq('id', captureId);
        return { success: false, error: 'Failed to download image' };
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      imageBase64 = buffer.toString('base64');
      imageMimeType = fileData.type || 'image/jpeg';
    }

    let transcribedText = capture.ocr_text;

    // If voice capture without an existing transcript, download audio and transcribe.
    if (capture.source_type === 'voice' && capture.file_path && !transcribedText) {
      const { data: audioData, error: downloadError } = await supabase.storage
        .from('captures')
        .download(capture.file_path);

      if (downloadError || !audioData) {
        await supabase
          .from('captures')
          .update({ status: 'failed', error_message: `Download failed: ${downloadError?.message}` })
          .eq('id', captureId);
        return { success: false, error: 'Failed to download audio' };
      }

      const filename = capture.file_path.split('/').pop() || 'audio.webm';
      const transcription = await parser.transcribeAudio({ audio: audioData, filename });

      if (transcription.error || !transcription.text) {
        await supabase
          .from('captures')
          .update({
            status: 'failed',
            error_message: transcription.error || 'Empty transcription',
          })
          .eq('id', captureId);
        return { success: false, error: transcription.error || 'Empty transcription' };
      }

      transcribedText = transcription.text;
      await supabase.from('captures').update({ ocr_text: transcribedText }).eq('id', captureId);
    }

    const isFileCapture = capture.source_type === 'image' || capture.source_type === 'voice';
    const userContext = isFileCapture && capture.raw_text ? capture.raw_text : undefined;

    let textForParser: string | undefined;
    if (capture.source_type === 'image') {
      textForParser = undefined;
    } else if (capture.source_type === 'voice') {
      textForParser = transcribedText || undefined;
    } else {
      textForParser = capture.raw_text || undefined;
    }

    const result = await parser.parse({
      mode,
      text: textForParser,
      imageBase64,
      imageMimeType,
      userContext,
    });

    if (result.error || !result.data) {
      await supabase
        .from('captures')
        .update({ status: 'failed', error_message: result.error || 'Parse returned no data' })
        .eq('id', captureId);
      return { success: false, error: result.error || 'Parse returned no data' };
    }

    // Store parsed result and update status
    await supabase
      .from('captures')
      .update({
        parsed_json: result.data,
        status: 'parsed',
        error_message: null,
      })
      .eq('id', captureId);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await supabase
      .from('captures')
      .update({ status: 'failed', error_message: message })
      .eq('id', captureId);
    return { success: false, error: message };
  }
}
