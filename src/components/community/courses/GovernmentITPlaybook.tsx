import { useState } from "react";

const COLORS = {
  navy: "#1e3a5f",
  navyLight: "#2a4d7a",
  navyMid: "#335d8e",
  gold: "#c9a227",
  goldLight: "#e8c84a",
  red: "#b84233",
  redLight: "#d4695c",
  white: "#f0f0f0",
  textLight: "#dce4f0",
  textMuted: "#a8b8d0",
};

const GoldBar = ({ width = "60px", height = "3px", style = {} }: { width?: string; height?: string; style?: React.CSSProperties }) => (
  <div style={{ width, height, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)", borderRadius: 2, ...style }} />
);

const Icon = ({ type, size = 48 }: { type: string; size?: number }) => {
  const circle: React.CSSProperties = { width: size, height: size, borderRadius: "50%", border: "2px solid #c9a227", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(201,162,39,0.08)" };
  const icons: Record<string, React.ReactNode> = {
    shield: <div style={circle}><svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2"><path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z"/><path d="M9 12l2 2 4-4"/></svg></div>,
    server: <div style={circle}><svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="#c9a227"/><circle cx="6" cy="18" r="1" fill="#c9a227"/></svg></div>,
    cloud: <div style={circle}><svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/><path d="M12 14v4m0 0l-2-2m2 2l2-2"/></svg></div>,
    data: <div style={circle}><svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></div>,
    compliance: <div style={circle}><svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg></div>,
    target: <div style={circle}><svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>,
    calendar: <div style={circle}><svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg></div>,
    rocket: <div style={circle}><svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></svg></div>,
  };
  return <>{icons[type] || icons.shield}</>;
};

const NumberBadge = ({ num, size = 32 }: { num: number | string; size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: 6, background: "linear-gradient(135deg, #c9a227, #f0d060)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.5, color: COLORS.navy, flexShrink: 0 }}>{num}</div>
);

const PageWrapper = ({ children, pageNum }: { children: React.ReactNode; pageNum: number }) => (
  <div style={{ width: "100%", maxWidth: 680, margin: "0 auto", aspectRatio: "8.5/11", background: COLORS.navy, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", boxShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>
    {children}
    <div style={{ position: "absolute", bottom: 12, right: 20, color: COLORS.textMuted, fontSize: 11 }}>{pageNum} / 10</div>
  </div>
);

const CoverPage = () => (
  <PageWrapper pageNum={1}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
      <div style={{ position: "absolute", left: 0, top: 5, width: 5, height: "40%", background: "linear-gradient(180deg, #b84233, transparent)" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 40px 20px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #c9a227", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, background: "rgba(201,162,39,0.06)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="1.5"><path d="M12 2l8 4v6c0 5.52-3.58 10.25-8 11.5C7.58 22.25 4 17.52 4 12V6l8-4z"/><path d="M8 12l3 3 5-5" stroke="#f0d060"/></svg>
        </div>
        <div style={{ fontSize: 13, letterSpacing: 5, color: COLORS.gold, fontWeight: 600, marginBottom: 16, textTransform: "uppercase" }}>Strategic Guide for IT Leaders</div>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 8px", letterSpacing: -0.5 }}>
          GOVERNMENT<br/>
          <span style={{ background: "linear-gradient(135deg, #c9a227, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>IT & AI</span><br/>
          PLAYBOOK
        </h1>
        <GoldBar width="80px" height="3px" style={{ margin: "16px auto" }} />
        <p style={{ fontSize: 16, color: COLORS.textLight, maxWidth: 440, lineHeight: 1.6, margin: "12px 0 0" }}>
          How IT Companies Can Position, Compete & Win in the Government Technology Space
        </p>
        <div style={{ marginTop: 32, padding: "10px 28px", border: "1px solid #c9a227", borderRadius: 4, background: "rgba(201,162,39,0.06)" }}>
          <span style={{ fontSize: 12, color: COLORS.gold, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Free Strategy Playbook</span>
        </div>
      </div>
      <div style={{ padding: "16px 40px", background: "rgba(201,162,39,0.06)", borderTop: "1px solid rgba(201,162,39,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Blend AI Technologies</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>Enterprise AI & Data Solutions</div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, textAlign: "right" }}>
          <a href="https://ezshieldai.com" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.textMuted, textDecoration: "none" }}>ezshieldai.com</a><br/>contact@blendaitechnologies.com
        </div>
      </div>
      <div style={{ height: 5, background: "linear-gradient(90deg, #b84233, #c9a227, #f0d060)" }} />
    </div>
  </PageWrapper>
);

const OpportunityPage = () => (
  <PageWrapper pageNum={2}>
    <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
    <div style={{ padding: "32px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 12, letterSpacing: 4, color: COLORS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Chapter 01</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>THE <span style={{ color: COLORS.gold }}>OPPORTUNITY</span></h2>
      <GoldBar width="50px" style={{ marginBottom: 20 }} />
      <div style={{ background: COLORS.navyLight, borderRadius: 8, padding: "20px 24px", borderLeft: `4px solid ${COLORS.gold}`, marginBottom: 20 }}>
        <p style={{ fontSize: 15, color: "#fff", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
          "Government agencies are facing major IT challenges—but most companies don't know how to position themselves to solve them."
        </p>
      </div>
      <p style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.7, margin: "0 0 20px" }}>
        The U.S. federal government spends over <strong style={{ color: COLORS.gold }}>$700 billion annually</strong> on IT, and state & local agencies add billions more. With mandates around modernization, cybersecurity, and AI adoption, this market is growing faster than ever.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { num: "$700B+", label: "Annual Federal\nIT Spending" },
          { num: "40%", label: "Agencies Behind\non Modernization" },
          { num: "3x", label: "Growth in Gov\nAI Adoption" },
        ].map((s, i) => (
          <div key={i} style={{ background: COLORS.navyMid, borderRadius: 8, padding: "18px 12px", textAlign: "center", border: "1px solid rgba(201,162,39,0.15)" }}>
            <div style={{ fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg, #c9a227, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.num}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6, whiteSpace: "pre-line", lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.7, margin: "0 0 16px" }}>
        Yet the vast majority of IT companies remain focused exclusively on private-sector clients, leaving an enormous opportunity untapped. This playbook shows you exactly how to enter, compete, and win.
      </p>
      <div style={{ marginTop: "auto", background: "linear-gradient(135deg, rgba(184,66,51,0.12), rgba(201,162,39,0.08))", borderRadius: 8, padding: "14px 20px", border: "1px solid rgba(184,66,51,0.25)" }}>
        <p style={{ fontSize: 12, color: COLORS.redLight, margin: 0, fontWeight: 600 }}>{"⚡ The window is open now — but competition is increasing rapidly."}</p>
      </div>
    </div>
  </PageWrapper>
);

const ChallengesPage = () => {
  const challenges = [
    { icon: "server", title: "Outdated Legacy Systems", desc: "Aging infrastructure leads to high maintenance costs, downtime, and inefficiencies." },
    { icon: "shield", title: "Cybersecurity Threats", desc: "Increasing attacks and evolving threats put sensitive data and operations at risk." },
    { icon: "cloud", title: "Cloud Complexity", desc: "Managing multi-cloud environments while ensuring security, compliance, and cost efficiency." },
    { icon: "data", title: "Data Silos & Poor Data Quality", desc: "Disconnected systems and inconsistent data make it hard to drive insights." },
    { icon: "compliance", title: "Compliance & Regulatory Demands", desc: "Strict regulations, reporting requirements, and audits create constant pressure." },
  ];
  return (
    <PageWrapper pageNum={3}>
      <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
      <div style={{ padding: "32px 36px", flex: 1 }}>
        <div style={{ fontSize: 12, letterSpacing: 4, color: COLORS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Chapter 02</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>TOP 5 <span style={{ color: COLORS.gold }}>IT CHALLENGES</span> GOV AGENCIES FACE</h2>
        <GoldBar width="50px" style={{ marginBottom: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {challenges.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: COLORS.navyLight, borderRadius: 8, padding: "14px 16px", borderLeft: "3px solid #c9a227" }}>
              <NumberBadge num={i + 1} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
              <Icon type={c.icon} size={36} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(201,162,39,0.06)", borderRadius: 8, border: "1px solid rgba(201,162,39,0.15)" }}>
          <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: COLORS.gold }}>Key Insight:</strong> Each of these challenges represents a multi-billion dollar market segment that IT companies can target with the right positioning and solutions.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

const WhyFailPage = () => {
  const mistakes = [
    { title: "Treating Government Like Enterprise Sales", desc: "Government procurement follows strict, regulated processes—not typical B2B sales funnels." },
    { title: "Ignoring Compliance Requirements", desc: "FedRAMP, FISMA, NIST, CMMC—failing to understand these is an instant disqualifier." },
    { title: "Underestimating the Sales Cycle", desc: "Government contracts can take 6-18 months. Companies without patience lose out." },
    { title: "No Past Performance Record", desc: "Agencies value proven track records. Without them, you're invisible to evaluators." },
    { title: "Missing Set-Aside Opportunities", desc: "Small business and minority-owned set-asides are massive—most companies don't pursue them." },
  ];
  return (
    <PageWrapper pageNum={4}>
      <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
      <div style={{ padding: "32px 36px", flex: 1 }}>
        <div style={{ fontSize: 12, letterSpacing: 4, color: COLORS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Chapter 03</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>WHY MOST IT COMPANIES <span style={{ color: COLORS.red }}>FAIL</span></h2>
        <GoldBar width="50px" style={{ marginBottom: 20 }} />
        <p style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.6, margin: "0 0 16px" }}>
          The government market is lucrative, but these common mistakes keep most IT companies from ever winning a contract:
        </p>
        {mistakes.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(184,66,51,0.15)", border: "1px solid rgba(184,66,51,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <span style={{ color: COLORS.red, fontSize: 13, fontWeight: 800 }}>{"✕"}</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{m.title}</div>
              <div style={{ fontSize: 11.5, color: COLORS.textMuted, lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, padding: "14px 18px", background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.03))", borderRadius: 8, border: "1px solid rgba(201,162,39,0.2)" }}>
          <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: COLORS.gold }}>The good news?</strong> These mistakes are avoidable—and companies that get it right face far less competition than in the private sector.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

const BuyerMindsetPage = () => (
  <PageWrapper pageNum={5}>
    <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
    <div style={{ padding: "32px 36px", flex: 1 }}>
      <div style={{ fontSize: 12, letterSpacing: 4, color: COLORS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Chapter 04</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>THE GOVERNMENT <span style={{ color: COLORS.gold }}>{"BUYER'S MINDSET"}</span></h2>
      <GoldBar width="50px" style={{ marginBottom: 20 }} />
      <p style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.6, margin: "0 0 16px" }}>
        Government decision-makers think differently than private-sector buyers. Understanding their priorities is essential:
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Risk Aversion", desc: "They prioritize proven, low-risk solutions over innovation for its own sake.", icon: "shield" },
          { label: "Compliance First", desc: "Every solution must meet strict regulatory and security frameworks.", icon: "compliance" },
          { label: "Mission-Driven", desc: "ROI matters, but serving the public mission is the top priority.", icon: "target" },
          { label: "Budget Cycles", desc: "Funding is tied to fiscal years. Timing your outreach is critical.", icon: "calendar" },
        ].map((item, i) => (
          <div key={i} style={{ background: COLORS.navyLight, borderRadius: 8, padding: "14px 14px", border: "1px solid rgba(201,162,39,0.1)" }}>
            <Icon type={item.icon} size={32} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "8px 0 4px" }}>{item.label}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background: COLORS.navyMid, borderRadius: 8, padding: "16px 18px", borderLeft: "3px solid #c9a227" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold, marginBottom: 6 }}>Procurement Channels to Know:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["GSA Schedule", "GWACs", "BPAs", "SAM.gov", "State RFPs", "Subcontracting"].map((t, i) => (
            <span key={i} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: 20, color: COLORS.goldLight }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(184,66,51,0.08)", borderRadius: 8, border: "1px solid rgba(184,66,51,0.2)" }}>
        <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0 }}>
          <strong style={{ color: COLORS.redLight }}>Pro Tip:</strong> {"Build relationships with program managers and CIOs before RFPs are released. By the time an RFP is public, the winner is often already positioned."}
        </p>
      </div>
    </div>
  </PageWrapper>
);

const AIPage = () => (
  <PageWrapper pageNum={6}>
    <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
    <div style={{ padding: "32px 36px", flex: 1 }}>
      <div style={{ fontSize: 12, letterSpacing: 4, color: COLORS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Chapter 05</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{"AI & AUTOMATION: "}<span style={{ color: COLORS.gold }}>THE GAME CHANGER</span></h2>
      <GoldBar width="50px" style={{ marginBottom: 18 }} />
      <p style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.6, margin: "0 0 14px" }}>
        {"AI is no longer optional for government agencies. Executive orders and federal mandates are driving rapid adoption—creating the biggest opportunity in a generation."}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { title: "Citizen Services", desc: "AI chatbots and virtual assistants to handle inquiries at scale" },
          { title: "Fraud Detection", desc: "Machine learning models to identify anomalies in real-time" },
          { title: "Document Processing", desc: "Intelligent automation to process forms, permits, and applications" },
          { title: "Predictive Analytics", desc: "Forecasting resource needs, maintenance, and risk assessments" },
        ].map((c, i) => (
          <div key={i} style={{ background: COLORS.navyLight, borderRadius: 8, padding: "12px 14px", borderTop: "2px solid #c9a227" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background: COLORS.navyMid, borderRadius: 8, padding: "16px", border: "1px solid rgba(201,162,39,0.15)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>The AI Readiness Framework</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {["Assess", "Plan", "Pilot", "Scale", "Optimize"].map((step, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "100%", padding: "6px 0", background: `rgba(201,162,39,${0.1 + i * 0.08})`, borderRadius: 4, fontSize: 10, color: COLORS.goldLight, fontWeight: 700, textAlign: "center" }}>{step}</div>
              {i < 4 && <div style={{ color: COLORS.gold, fontSize: 10, marginTop: 2 }}>{"→"}</div>}
              {i === 4 && <div style={{ fontSize: 10, marginTop: 2, visibility: "hidden" }}>{"→"}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(201,162,39,0.06)", borderRadius: 8, border: "1px solid rgba(201,162,39,0.15)" }}>
        <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0 }}>
          <strong style={{ color: COLORS.gold }}>Market Signal:</strong> Agencies with AI mandates but no internal expertise are actively seeking private-sector partners right now.
        </p>
      </div>
    </div>
  </PageWrapper>
);

const PositioningPage = () => (
  <PageWrapper pageNum={7}>
    <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
    <div style={{ padding: "32px 36px", flex: 1 }}>
      <div style={{ fontSize: 12, letterSpacing: 4, color: COLORS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Chapter 06</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>POSITIONING YOUR COMPANY <span style={{ color: COLORS.gold }}>TO WIN</span></h2>
      <GoldBar width="50px" style={{ marginBottom: 18 }} />
      {[
        { num: "1", title: "Get Your Certifications", items: "FedRAMP, SOC 2, CMMC, ISO 27001 — these aren't optional, they're entry tickets." },
        { num: "2", title: "Register on SAM.gov", items: "Your company must be registered in the System for Award Management to bid on federal contracts." },
        { num: "3", title: "Pursue Set-Aside Programs", items: "8(a), HUBZone, WOSB, SDVOSB — if you qualify, these dramatically reduce competition." },
        { num: "4", title: "Build Past Performance", items: "Start with subcontracting or small state/local contracts to build a track record." },
        { num: "5", title: "Develop a Capability Statement", items: "A one-page document that is your 'resume' for government buyers. Make it sharp." },
        { num: "6", title: "Partner Strategically", items: "Team with established primes as a subcontractor to gain access and credibility." },
      ].map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
          <NumberBadge num={step.num} size={26} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{step.title}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>{step.items}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 8, padding: "12px 16px", background: "rgba(201,162,39,0.06)", borderRadius: 8, border: "1px solid rgba(201,162,39,0.15)" }}>
        <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0 }}>
          <strong style={{ color: COLORS.gold }}>Remember:</strong> {"You don't need to win a $50M contract on day one. Start small, build credibility, and scale."}
        </p>
      </div>
    </div>
  </PageWrapper>
);

const CaseStudyPage = () => (
  <PageWrapper pageNum={8}>
    <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
    <div style={{ padding: "32px 36px", flex: 1 }}>
      <div style={{ fontSize: 12, letterSpacing: 4, color: COLORS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Chapter 07</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>CASE STUDY <span style={{ color: COLORS.gold }}>FRAMEWORK</span></h2>
      <GoldBar width="50px" style={{ marginBottom: 18 }} />
      <p style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.6, margin: "0 0 16px" }}>
        Government evaluators love case studies. Use this proven framework to present your past work in a way that resonates:
      </p>
      {[
        { letter: "S", word: "SITUATION", color: COLORS.gold, desc: "What challenge did the agency or client face? Set the scene with context and scale." },
        { letter: "T", word: "TASK", color: COLORS.goldLight, desc: "What was your specific role and responsibility? What were you brought in to do?" },
        { letter: "A", word: "ACTION", color: COLORS.gold, desc: "What solutions did you implement? Be specific about technologies and methodologies." },
        { letter: "R", word: "RESULT", color: COLORS.goldLight, desc: "Quantify the impact. Cost savings, efficiency gains, uptime improvements — use numbers." },
      ].map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12, background: COLORS.navyLight, borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, #c9a227, #f0d060)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, color: COLORS.navy, flexShrink: 0 }}>{item.letter}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.word}</div>
            <div style={{ fontSize: 11.5, color: COLORS.textMuted, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, background: COLORS.navyMid, borderRadius: 8, padding: "14px 16px", border: "1px solid rgba(184,66,51,0.2)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.redLight, marginBottom: 6 }}>Metrics That Win Contracts:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Cost Reduction %", "Uptime Improvement", "Processing Speed", "Compliance Score", "User Adoption Rate"].map((m, i) => (
            <span key={i} style={{ fontSize: 10, padding: "3px 10px", background: "rgba(184,66,51,0.1)", border: "1px solid rgba(184,66,51,0.2)", borderRadius: 16, color: COLORS.redLight }}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  </PageWrapper>
);

const ActionPlanPage = () => (
  <PageWrapper pageNum={9}>
    <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
    <div style={{ padding: "32px 36px", flex: 1 }}>
      <div style={{ fontSize: 12, letterSpacing: 4, color: COLORS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Chapter 08</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>YOUR <span style={{ color: COLORS.gold }}>90-DAY</span> ACTION PLAN</h2>
      <GoldBar width="50px" style={{ marginBottom: 18 }} />
      {[
        { phase: "Days 1-30", title: "FOUNDATION", color: COLORS.gold, tasks: ["Register on SAM.gov and get your CAGE/UEI codes", "Identify applicable certifications and begin the process", "Research your target agencies and their upcoming procurements", "Develop your Government Capability Statement"] },
        { phase: "Days 31-60", title: "POSITIONING", color: COLORS.goldLight, tasks: ["Attend government industry days and networking events", "Identify 3-5 prime contractors for subcontracting partnerships", "Create government-specific case studies using the STAR framework", "Set up alerts on SAM.gov and GovWin for relevant opportunities"] },
        { phase: "Days 61-90", title: "EXECUTION", color: COLORS.gold, tasks: ["Submit your first proposal or teaming arrangement", "Schedule meetings with target agency program managers", "Refine your value proposition based on market feedback", "Build a 12-month government BD pipeline"] },
      ].map((phase, i) => (
        <div key={i} style={{ marginBottom: 14, background: COLORS.navyLight, borderRadius: 8, padding: "14px 16px", borderLeft: `3px solid ${phase.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>{phase.phase}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: phase.color, letterSpacing: 2 }}>{phase.title}</span>
          </div>
          {phase.tasks.map((t, j) => (
            <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${phase.color}`, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: COLORS.textLight, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </PageWrapper>
);

const CTAPage = () => (
  <PageWrapper pageNum={10}>
    <div style={{ height: 5, background: "linear-gradient(90deg, #c9a227, #f0d060, #c9a227)" }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 40px 20px", textAlign: "center" }}>
      <Icon type="rocket" size={64} />
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "20px 0 6px" }}>READY TO <span style={{ color: COLORS.gold }}>WIN</span>?</h2>
      <GoldBar width="60px" style={{ margin: "0 auto 16px" }} />
      <p style={{ fontSize: 14, color: COLORS.textLight, lineHeight: 1.7, maxWidth: 440, margin: "0 0 24px" }}>
        The government IT market is massive, growing, and underserved. Companies that position themselves correctly today will dominate for years to come.
      </p>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "0 0 16px" }}>
        Let us help you build your government strategy from the ground up.
      </p>
      <div style={{ padding: "16px 32px", background: "rgba(201,162,39,0.08)", borderRadius: 10, border: "1px solid rgba(201,162,39,0.2)", marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Want to join our free community?</div>
        <GoldBar width="40px" style={{ margin: "8px auto" }} />
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>JOIN US</div>
        <a href="https://www.ezshieldai.com/community/hub/b354ab80-823a-414b-8f77-7664ebdc5c7e" target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, fontWeight: 700, color: COLORS.gold, textDecoration: "none" }}>EZShield+AI</a>
      </div>
    </div>
    <div style={{ padding: "16px 40px", background: "rgba(201,162,39,0.06)", borderTop: "1px solid rgba(201,162,39,0.15)", textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Blend AI Technologies</div>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Enterprise AI & Data Solutions</div>
    </div>
    <div style={{ height: 5, background: "linear-gradient(90deg, #b84233, #c9a227, #f0d060)" }} />
  </PageWrapper>
);

const pages = [CoverPage, OpportunityPage, ChallengesPage, WhyFailPage, BuyerMindsetPage, AIPage, PositioningPage, CaseStudyPage, ActionPlanPage, CTAPage];

export default function GovernmentITPlaybook() {
  const [currentPage, setCurrentPage] = useState(0);
  const Page = pages[currentPage];
  return (
    <div style={{ background: "#142d4f", minHeight: "100%", padding: "20px 12px" }}>
      <Page />
      <div style={{ maxWidth: 680, margin: "16px auto 0", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} style={{ padding: "8px 16px", background: currentPage === 0 ? "rgba(255,255,255,0.05)" : "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: 6, color: currentPage === 0 ? "#555" : COLORS.gold, cursor: currentPage === 0 ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}>{"← Prev"}</button>
        {pages.map((_, i) => (
          <button key={i} onClick={() => setCurrentPage(i)} style={{ width: 28, height: 28, borderRadius: 6, background: i === currentPage ? "linear-gradient(135deg, #c9a227, #f0d060)" : "rgba(255,255,255,0.05)", border: i === currentPage ? "none" : "1px solid rgba(255,255,255,0.1)", color: i === currentPage ? COLORS.navy : COLORS.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{i + 1}</button>
        ))}
        <button onClick={() => setCurrentPage(Math.min(9, currentPage + 1))} disabled={currentPage === 9} style={{ padding: "8px 16px", background: currentPage === 9 ? "rgba(255,255,255,0.05)" : "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: 6, color: currentPage === 9 ? "#555" : COLORS.gold, cursor: currentPage === 9 ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}>{"Next →"}</button>
      </div>
    </div>
  );
}
