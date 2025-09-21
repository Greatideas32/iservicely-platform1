function Badge({ children }:{children:any}){
  return (<span style={{ marginLeft:8, padding:"2px 8px", borderRadius:999, fontSize:12, background:"#111", color:"#fff" }}>{children}</span>);
}

function Plan({ title, priceM, priceY, saveText, bullets, cta, highlight }:
 { title:string, priceM:string, priceY:string, saveText?:string, bullets:string[], cta:string, highlight?:boolean }) {
  return (
    <div style={{ border: highlight ? "2px solid #111" : "1px solid #ddd", borderRadius: 12, padding: 20, position:'relative' }}>
      <h3 style={{ marginTop: 0 }}>{title}{highlight && <Badge>Most Popular</Badge>}</h3>
      <div style={{ marginBottom:6 }}><b>{priceM}</b> /month</div>
      <div><b>{priceY}</b> /year {saveText && <span style={{ marginLeft:8, fontSize:12, padding:'2px 6px', borderRadius:6, background:'#f1f1f1' }}>{saveText}</span>}</div>
      <ul>{bullets.map((b,i)=>(<li key={i}>{b}</li>))}</ul>
      <a href="#" style={{ padding:"8px 12px", background:"#111", color:"#fff", textDecoration:"none", borderRadius:8 }}>{cta}</a>
    </div>
  )
}

export default function Pricing() {
  return (
    <div style={{ maxWidth: 960, margin:"0 auto" }}>
      <h1>Simple, Transparent Pricing for Every Business</h1>
      <p>No hidden fees. Choose the plan that fits your hiring needs.</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
        <Plan
          title="Small Business"
          priceM="$99.99"
          priceY="$999.99"
          saveText="Save 2 months"
          bullets={[
            "Up to 25 candidates/month",
            "Scenario question library",
            "AI scoring & fit analysis",
            "Basic HR dashboard"
          ]}
          cta="Start Free Trial"
        />
        <Plan
          title="Medium Business"
          priceM="$599.99"
          priceY="$5,999.99"
          saveText="Save 2 months"
          bullets={[
            "Up to 150 candidates/month",
            "Custom scenarios",
            "Team dashboards",
            "Advanced analytics",
            "Priority support"
          ]}
          cta="Start Free Trial"
          highlight
        />
        <Plan
          title="Large Business"
          priceM="$1,099"
          priceY="$10,999"
          saveText="Save 2 months"
          bullets={[
            "Up to 500 candidates/month",
            "ATS integrations",
            "Advanced reporting",
            "Branding (white‑label)",
            "Dedicated manager"
          ]}
          cta="Contact Sales"
        />
      </div>
    </div>
  );
}