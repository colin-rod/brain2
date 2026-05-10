'use server';

import { createClient } from '@/lib/supabase/server';
import { runParseCapture } from '@/lib/parser/run-parse';

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

  return runParseCapture(supabase, captureId, user.id);
}
