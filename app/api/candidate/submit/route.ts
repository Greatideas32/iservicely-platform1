import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const { token, scenario_id, answer_text } = await req.json();
  const sb = supabaseAdmin();

  const { data: cand, error: e1 } = await sb
    .from('candidates')
    .select('id, interview_id, token_expires_at')
    .eq('access_token', token)
    .single();
  if (e1 || !cand) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  if (new Date(cand.token_expires_at) < new Date())
    return NextResponse.json({ error: 'Link expired' }, { status: 400 });

  const { data: resp, error: e2 } = await sb
    .from('responses')
    .insert({ candidate_id: cand.id, scenario_id, answer_text })
    .select('id')
    .single();
  if (e2 || !resp) return NextResponse.json({ error: e2?.message || 'Insert failed' }, { status: 500 });

  const scoreRes = await fetch(process.env.SUPABASE_SCORE_FN_URL!, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response_id: resp.id })
  });

  if (!scoreRes.ok) {
    return NextResponse.json({ ok: false, warning: 'Saved answer but scoring failed.' });
  }
  return NextResponse.json({ ok: true });
}
