'use server';

import { createClient } from '@/lib/supabase/server';
import type { CaptureSourceType } from '@/types/database';

interface CreateCaptureResult {
  id: string;
  error?: never;
}

interface CreateCaptureError {
  id?: never;
  error: string;
}

type CaptureResult = CreateCaptureResult | CreateCaptureError;

export async function createTextCapture(
  rawText: string,
  sourceType: CaptureSourceType,
): Promise<CaptureResult> {
  if (!rawText.trim()) {
    return { error: 'Text cannot be empty' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('captures')
    .insert({
      user_id: user.id,
      source_type: sourceType,
      raw_text: rawText.trim(),
      status: 'new',
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id };
}

export async function createImageCapture(formData: FormData): Promise<CaptureResult> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  const rawText = (formData.get('rawText') as string | null)?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Upload to Supabase Storage (user-scoped path)
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('captures').upload(filePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  // Create capture record
  const { data, error } = await supabase
    .from('captures')
    .insert({
      user_id: user.id,
      source_type: 'image' as CaptureSourceType,
      file_path: filePath,
      raw_text: rawText,
      status: 'new',
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id };
}

export async function createVoiceCapture(formData: FormData): Promise<CaptureResult> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { error: 'No audio provided' };
  }

  const rawText = (formData.get('rawText') as string | null)?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const ext = (file.name.split('.').pop() || 'webm').toLowerCase();
  const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('captures').upload(filePath, file, {
    contentType: file.type || 'audio/webm',
    upsert: false,
  });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data, error } = await supabase
    .from('captures')
    .insert({
      user_id: user.id,
      source_type: 'voice' as CaptureSourceType,
      file_path: filePath,
      raw_text: rawText,
      status: 'new',
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id };
}

export async function createPdfCapture(formData: FormData): Promise<CaptureResult> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  const rawText = (formData.get('rawText') as string | null)?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;

  const { error: uploadError } = await supabase.storage.from('captures').upload(filePath, file, {
    contentType: 'application/pdf',
    upsert: false,
  });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data, error } = await supabase
    .from('captures')
    .insert({
      user_id: user.id,
      source_type: 'pdf' as CaptureSourceType,
      file_path: filePath,
      raw_text: rawText,
      status: 'new',
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id };
}

export async function deleteCapture(captureId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data: capture, error: fetchError } = await supabase
    .from('captures')
    .select('id, user_id, file_path')
    .eq('id', captureId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !capture) return { error: 'Capture not found' };

  if (capture.file_path) {
    await supabase.storage.from('captures').remove([capture.file_path]);
  }

  const { error: deleteError } = await supabase
    .from('captures')
    .delete()
    .eq('id', captureId)
    .eq('user_id', user.id);

  if (deleteError) return { error: deleteError.message };
  return {};
}

export async function fetchCaptures() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('captures')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'saved')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
