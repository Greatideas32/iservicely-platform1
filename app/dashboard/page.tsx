import { supabaseAdmin } from '@/lib/supabaseServer';

type Scores = { problem_solving:number, communication:number, teamwork:number, culture_fit:number, leadership:number };
type Rubric = { dimensions: Scores };

function overallFit(rubric: Rubric, scoresList: Scores[]): number {
  if (!scoresList.length) return 0;
  const w = rubric.dimensions as any;
  const per = scoresList.map(s => (
    (s.problem_solving*w.problem_solving +
     s.communication*w.communication +
     s.teamwork*w.teamwork +
     s.culture_fit*w.culture_fit +
     s.leadership*w.leadership) / 10
  ));
  const avg = per.reduce((a,b)=>a+b,0) / per.length;
  return Math.round(avg * 100);
}

async function RescoreButton({ id }:{id:string}) {
  async function rescore() {
    'use server';
    await fetch(`${process.env.SITE_URL}/api/candidate/rescore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_id: id })
    });
  }
  return (
    <form action={rescore}>
      <button style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #ddd', background:'#fff' }}>
        Rescore
      </button>
    </form>
  );
}

export default async function Dashboard() {
  const sb = supabaseAdmin();
  const { data: candidates } = await sb
    .from('candidates')
    .select('id, full_name, email, status, interview_id, created_at')
    .order('created_at', { ascending: false });

  const interviewIds = Array.from(new Set((candidates||[]).map((c:any)=>c.interview_id)));
  const rubrics: Record<string, Rubric> = {};
  if (interviewIds.length) {
    const { data: intervs } = await sb.from('interviews').select('id, rubric').in('id', interviewIds);
    (intervs||[]).forEach((i:any)=> rubrics[i.id] = i.rubric);
  }

  const items: any[] = [];
  for (const c of (candidates||[])) {
    const { data: resps } = await sb
      .from('responses')
      .select('ai_scores')
      .eq('candidate_id', c.id);

    const scoresList: Scores[] = (resps||[])
      .map((r:any)=>r.ai_scores)
      .filter(Boolean);

    const fit = (rubrics[c.interview_id] && scoresList.length)
      ? overallFit(rubrics[c.interview_id], scoresList)
      : 0;

    items.push({ ...c, fit });
  }

  return (
    <div style={{ maxWidth: 960, margin:'0 auto' }}>
      <h1>Candidates</h1>
      <div>
        {items.map((c:any) => (
          <div key={c.id} style={{ border:'1px solid #eee', padding:12, borderRadius:8, marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <div>
              <div style={{ fontWeight:600 }}>{c.full_name || 'Unnamed'}</div>
              <div style={{ opacity:.8 }}>{c.email}</div>
              <div>Status: {c.status}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ minWidth:100, textAlign:'right' }}>
                <div style={{ fontWeight:700 }}>{c.fit}%</div>
                <div style={{ fontSize:12, opacity:.7 }}>Fit Score</div>
              </div>
              <RescoreButton id={c.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}