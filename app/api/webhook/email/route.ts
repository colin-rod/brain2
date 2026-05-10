import { createServiceClient } from '@/lib/supabase/server';
import { runParseCapture } from '@/lib/parser/run-parse';

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  const token = new URL(request.url).searchParams.get('token');

  if (!secret || !token || token !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = process.env.APP_USER_ID;
  if (!userId) {
    console.error('[email-webhook] APP_USER_ID is not configured');
    return new Response('Server misconfiguration', { status: 500 });
  }

  const formData = await request.formData();
  const from = formData.get('from') as string | null;
  const subject = formData.get('subject') as string | null;
  const text = formData.get('text') as string | null;

  if (!from && !text) {
    return new Response('OK', { status: 200 });
  }

  const rawText = [
    `From: ${from ?? '(unknown)'}`,
    `Subject: ${subject ?? '(no subject)'}`,
    '',
    text ?? '',
  ].join('\n');

  const supabase = await createServiceClient();

  const { data: capture, error } = await supabase
    .from('captures')
    .insert({
      user_id: userId,
      source_type: 'email',
      source_app: 'sendgrid',
      raw_text: rawText,
      status: 'new',
    })
    .select('id')
    .single();

  if (error || !capture) {
    console.error('[email-webhook] Failed to insert capture:', error);
    return new Response('OK', { status: 200 });
  }

  await runParseCapture(supabase, capture.id, userId);

  return new Response('OK', { status: 200 });
}
