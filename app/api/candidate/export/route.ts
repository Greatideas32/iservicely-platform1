
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const sb = supabaseAdmin();
    const { data: cand } = await sb
      .from('candidates')
      .select('id, full_name, email, interview_id, status, created_at')
      .eq('id', id).single();
    if (!cand) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: interview } = await sb
      .from('interviews')
      .select('role_title, rubric')
      .eq('id', cand.interview_id).single();

    const { data: resps } = await sb
      .from('responses')
      .select('scenario_id, ai_scores, ai_summary')
      .eq('candidate_id', id);

    const scenIds = Array.from(new Set((resps||[]).map((r:any)=>r.scenario_id)));
    const scenMap: Record<string, any> = {};
    if (scenIds.length) {
      const { data: scenRows } = await sb.from('scenarios').select('id, title, body').in('id', scenIds);
      (scenRows||[]).forEach((s:any)=> scenMap[s.id] = s);
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]); // Letter
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const draw = (text:string, x:number, y:number, size=12) => {
      page.drawText(text, { x, y, size, font, color: rgb(0,0,0) });
    };

    let y = 760;
    draw('Candidate Report', 50, y, 18); y -= 24;
    draw(`Name: ${cand.full_name || ''}`, 50, y); y -= 16;
    draw(`Email: ${cand.email || ''}`, 50, y); y -= 16;
    draw(`Role: ${interview?.role_title || ''}`, 50, y); y -= 20;

    // Aggregate scores
    const scoresList = (resps||[]).map((r:any)=>r.ai_scores).filter(Boolean) as any[];
    let fit = 0;
    if (interview?.rubric && scoresList.length) {
      const w:any = interview.rubric.dimensions;
      const per = scoresList.map((s:any)=>(
        (s.problem_solving*w.problem_solving +
         s.communication*w.communication +
         s.teamwork*w.teamwork +
         s.culture_fit*w.culture_fit +
         s.leadership*w.leadership) / 10
      ));
      fit = Math.round((per.reduce((a:number,b:number)=>a+b,0)/per.length) * 100);
    }
    draw(`Overall Fit: ${fit}%`, 50, y); y -= 24;

    draw('Responses:', 50, y); y -= 18;
    for (const r of (resps||[])) {
      const scen = scenMap[r.scenario_id] || {};
      const title = `• ${scen.title || 'Scenario'}`;
      draw(title, 60, y); y -= 16;
      const sum = r.ai_summary ? r.ai_summary.slice(0, 200) : 'Pending scoring…';
      draw(`   Summary: ${sum}`, 60, y); y -= 16;
      if (r.ai_scores) {
        draw(`   Scores: PS ${r.ai_scores.problem_solving||0}/10, Comm ${r.ai_scores.communication||0}/10, Team ${r.ai_scores.teamwork||0}/10, Culture ${r.ai_scores.culture_fit||0}/10, Lead ${r.ai_scores.leadership||0}/10`, 60, y); y -= 16;
      }
      y -= 6;
      if (y < 80) { y = 760; pdf.addPage([612,792]); }
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="candidate_${cand.id}.pdf"`
      }
    });
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
