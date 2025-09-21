export const metadata = { title: "HR Scenario Interviews" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <nav style={{ padding: "12px 20px", borderBottom: "1px solid #eee", display:"flex", gap:16 }}>
          <a href="/" style={{ fontWeight: 600, textDecoration:"none", color:"#111" }}>HR Scenario</a>
          <a href="/pricing" style={{ textDecoration:"none", color:"#111" }}>Pricing</a>
          <a href="/dashboard" style={{ marginLeft: "auto", textDecoration:"none", color:"#111" }}>Dashboard</a>
        </nav>
        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
