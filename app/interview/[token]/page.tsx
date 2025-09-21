'use client'
import { useEffect, useState } from 'react';

export default function CandidatePage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [interview, setInterview] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/interview-meta?token=${token}`);
      const data = await res.json();
      if (data.error) { setStatus(data.error); return; }
      setInterview(data.interview);
      setScenarios(data.scenarios);
    })();
  }, [token]);

  const submitOne = async (scenario_id: string) => {
    const answer_text = answers[scenario_id] || '';
    const r = await fetch('/api/candidate/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, scenario_id, answer_text })
    });
    const j = await r.json();
    setStatus(j.ok ? 'Submitted!' : (j.error || 'Error'));
  };

  if (!interview) return <div>Loading… {status}</div>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1>{interview.role_title} – Scenario Interview</h1>
      {scenarios.map((s: any) => (
        <div key={s.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>{s.title}</div>
          <p style={{ opacity: .8 }}>{s.body}</p>
          <textarea
            rows={6}
            value={answers[s.id] || ''}
            onChange={(e)=>setAnswers({ ...answers, [s.id]: e.target.value })}
            style={{ width: "100%", borderRadius: 8, padding: 8 }}
            placeholder="Type your answer here…"
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={()=>submitOne(s.id)} style={{ padding: "8px 12px", borderRadius: 8, background:"#111", color:"#fff" }}>Submit</button>
          </div>
        </div>
      ))}
      <div style={{ color: "green" }}>{status}</div>
    </div>
  );
}
