
import Link from 'next/link';
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

function Bar({ label, value }:{label:string, value:number}) {
  const width = Math.max(0, Math.min(10, value)) * 10; // 0..100
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize:12, opacity:.8, marginBottom:4 }}>{label} ({value.toFixed(1)}/10)</div>
      <div style={{ background:'#f1f1f1', borderRadius:6, height:10 }}>
        <div style={{ width: width + '%', height:10, borderRadius:6, background:'#111' }} />
      </div>
    </div>
  );
}

export default async function CandidateDetail({ params }:{ params:{ id: string }}) {
  const id = params.id;
  const sb = supabaseAdmin();

  const { data: cand } = await sb
    .from('candidates')
    .select('id, full_name, email, interview_id, status')
    .eq('id', id)
    .single();

  if (!cand) return <div style={{ maxWidth: 920, margin:'0 auto' }}>Candidate not found.</div>;

  const { data: interview } = await sb
    .from('interviews')
    .select('id, role_title, rubric')
    .eq('id', cand.interview_id)
    .single();

  const { data: resps } = await sb
    .from('responses')
    .select('id, scenario_id, ai_scores, ai_summary')
    .eq('candidate_id', id);

  // Fetch scenarios for labels
  const scenarioIds = Array.from(new Set((resps||[]).map((r:any)=>r.scenario_id)));
  let scenarios: Record<string, any> = {};
  if (scenarioIds.length) {
    const { data: scenRows } = await sb.from('scenarios').select('id, title, body').in('id', scenarioIds);
    (scenRows||[]).forEach((s:any)=> scenarios[s.id] = s);
  }

  const scoresList = (resps||[]).map((r:any)=>r.ai_scores).filter(Boolean) as Scores[];
  const fit = interview && scoresList.length ? overallFit(interview.rubric as any, scoresList) : 0;

  return (
    <div style={{ maxWidth: 960, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h1 style={{ margin:'8px 0' }}>{cand.full_name || 'Candidate'}</h1>
          <div style={{ opacity:.8 }}>{interview?.role_title}</div>
          <div>Status: {cand.status}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:24, fontWeight:700 }}>{fit}%</div>
          <div style={{ fontSize:12, opacity:.7 }}>Fit Score</div>
          <div style={{ marginTop:8 }}>
            <a href={`/api/candidate/export?id=${cand.id}`} style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, textDecoration:'none', color:'#111' }}>Export PDF</a>
          </div>
        </div>
      </div>

      <div style={{ border:'1px solid #eee', borderRadius:12, padding:16, marginBottom:16 }}>
        <h3 style={{ marginTop:0 }}>Subscores</h3>
        {scoresList.length ? (
          <div>
            {/* Average subscores across responses */}
            {(() => {
              const sums = { problem_solving:0, communication:0, teamwork:0, culture_fit:0, leadership:0 };
              scoresList.forEach(s => {
                sums.problem_solving += s.problem_solving||0;
                sums.communication += s.communication||0;
                sums.teamwork += s.teamwork||0;
                sums.culture_fit += s.culture_fit||0;
                sums.leadership += s.leadership||0;
              });
              const n = scoresList.length || 1;
              const avg = {
                problem_solving: sums.problem_solving/n,
                communication: sums.communication/n,
                teamwork: sums.teamwork/n,
                culture_fit: sums.culture_fit/n,
                leadership: sums.leadership/n,
              };
              return (
                <div>
                  <Bar label="Problem-solving" value={avg.problem_solving} />
                  <Bar label="Communication" value={avg.communication} />
                  <Bar label="Teamwork" value={avg.teamwork} />
                  <Bar label="Culture fit" value={avg.culture_fit} />
                  <Bar label="Leadership" value={avg.leadership} />
                </div>
              );
            })()}
          </div>
        ) : <div>No scores yet.</div>}
      </div>

      <div style={{ border:'1px solid #eee', borderRadius:12, padding:16 }}>
        <h3 style={{ marginTop:0 }}>Responses</h3>
        {(resps||[]).map((r:any) => (
          <div key={r.id} style={{ borderTop:'1px solid #f1f1f1', paddingTop:12, marginTop:12 }}>
            <div style={{ fontWeight:600 }}>{scenarios[r.scenario_id]?.title || 'Scenario'}</div>
            <div style={{ fontSize:12, opacity:.8, margin:'4px 0 8px' }}>{scenarios[r.scenario_id]?.body}</div>
            <div><b>AI Summary:</b> {r.ai_summary || 'Pending scoring…'}</div>
            {r.ai_scores && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:8, marginTop:8, fontSize:12 }}>
                <div>PS: {(r.ai_scores.problem_solving||0).toFixed(1)}/10</div>
                <div>Comm: {(r.ai_scores.communication||0).toFixed(1)}/10</div>
                <div>Team: {(r.ai_scores.teamwork||0).toFixed(1)}/10</div>
                <div>Culture: {(r.ai_scores.culture_fit||0).toFixed(1)}/10</div>
                <div>Lead: {(r.ai_scores.leadership||0).toFixed(1)}/10</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop:16 }}>
        <Link href="/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
