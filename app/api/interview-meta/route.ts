import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: cand, error: e1 } = await sb
    .from('candidates').select('id, interview_id, token_expires_at').eq('access_token', token).single();
  if (e1 || !cand) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  if (new Date(cand.token_expires_at) < new Date())
    return NextResponse.json({ error: 'Link expired' }, { status: 400 });

  const { data: interview, error: e2 } = await sb
    .from('interviews').select('id, role_title, scenario_ids, rubric').eq('id', cand.interview_id).single();
  if (e2 || !interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

  const { data: scenarios, error: e3 } = await sb
    .from('scenarios').select('id, title, body').in('id', interview.scenario_ids);
  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

  return NextResponse.json({ interview, scenarios });
}
