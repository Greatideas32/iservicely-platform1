import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const { interview_id, full_name, email, days_valid = 7 } = await req.json();
  const sb = supabaseAdmin();
  const { data: interview, error: e1 } = await sb
    .from('interviews').select('id, company_id').eq('id', interview_id).single();
  if (e1 || !interview) return NextResponse.json({ error: e1?.message || 'Interview not found' }, { status: 400 });

  // --- Quota enforcement (per company per month) ---
  // Load company quota
  const { data: company, error: eC } = await sb
    .from('companies')
    .select('id, candidate_quota_month')
    .eq('id', interview.company_id)
    .single();
  if (eC || !company) return NextResponse.json({ error: 'Company not found' }, { status: 400 });

  // Count candidates created for this company in the current month
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const { data: countRows, error: eCnt } = await sb
    .from('candidates')
    .select('id, interview_id, created_at')
    .gte('created_at', monthStart.toISOString());
  if (eCnt) return NextResponse.json({ error: eCnt.message }, { status: 500 });

  // Filter by this company via interviews lookup
  let used = 0;
  if (countRows && countRows.length) {
    const interviewIds = [...new Set(countRows.map(r => r.interview_id))];
    const { data: intervs } = await sb.from('interviews').select('id, company_id').in('id', interviewIds);
    const companyInterviewSet = new Set((intervs||[]).filter(i => i.company_id === interview.company_id).map(i => i.id));
    used = countRows.filter(r => companyInterviewSet.has(r.interview_id)).length;
  }

  if (used >= company.candidate_quota_month) {
    return NextResponse.json({ error: 'Monthly candidate quota reached for your plan. Upgrade or wait until next month.' }, { status: 403 });
  }
  // --- End quota enforcement ---


  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + days_valid*24*60*60*1000).toISOString();

  const { data: cand, error: e2 } = await sb.from('candidates').insert({
    interview_id, full_name, email, access_token: token, token_expires_at: expires
  }).select('id, access_token').single();
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const link = `${process.env.SITE_URL}/interview/${cand.access_token}`;
  return NextResponse.json({ ok: true, link });
}
