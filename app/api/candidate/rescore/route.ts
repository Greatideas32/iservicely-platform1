import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { candidate_id } = await req.json();
    if (!candidate_id) return NextResponse.json({ error: 'candidate_id required' }, { status: 400 });

    const sb = supabaseAdmin();

    // Get responses for candidate
    const { data: resps, error: er } = await sb
      .from('responses')
      .select('id')
      .eq('candidate_id', candidate_id);
    if (er) return NextResponse.json({ error: er.message }, { status: 500 });

    if (!resps || !resps.length) {
      return NextResponse.json({ ok: true, message: 'No responses to rescore.' });
    }

    const fnUrl = process.env.SUPABASE_SCORE_FN_URL!;
    const results = [];
    for (const r of resps) {
      const scoreRes = await fetch(fnUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_id: r.id })
      });
      results.push({ id: r.id, ok: scoreRes.ok });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}