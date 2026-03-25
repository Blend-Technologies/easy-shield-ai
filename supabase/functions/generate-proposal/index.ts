// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      rfpContent,
      capabilityContent,
      companyName,
      projectTitle,
    } = await req.json() as {
      rfpContent?: string;
      capabilityContent?: string;
      companyName?: string;
      projectTitle?: string;
    };

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const company = (companyName ?? "Our Company").trim();
    const title   = (projectTitle  ?? "Government Contract Proposal").trim();

    // Cap document sizes to stay within token budget
    const rfp  = (rfpContent        ?? "").slice(0, 60_000);
    const caps = (capabilityContent ?? "").slice(0, 20_000);

    const systemPrompt = `You are an expert government contract proposal writer with over 20 years of experience winning federal contracts for IT services, cybersecurity, cloud, and professional services firms. You write proposals that sound like they were written by an experienced industry professional — clear, confident, and specific — never robotic or generic.

═══════════════════════════════════════════════
ABSOLUTE REQUIREMENTS — DO NOT VIOLATE THESE
═══════════════════════════════════════════════

1. COMPLETE REQUIREMENTS SCAN:
   Before writing a single word of the proposal, mentally scan the ENTIRE RFP for every occurrence of the following compliance keywords:
   "shall", "must", "will be required", "is required", "required to", "shall provide", "shall ensure", "shall maintain", "shall demonstrate", "shall submit", "offeror shall", "contractor shall", "mandatory", "is expected to", "will provide".

   Every such clause is a BINDING REQUIREMENT. Each one must appear in the Requirements Compliance Matrix AND be addressed in the body of the proposal. If you miss even ONE, the proposal is non-compliant and will be rejected.

2. INDIVIDUAL TREATMENT:
   Bullet points, numbered list items, sub-paragraphs, and appendix items each count as separate requirements if they contain "shall/must/required". Address EACH individually — do not group or summarize.

3. HUMAN WRITING STYLE:
   - Write in first-person plural: "we", "our team", "our approach"
   - Active voice throughout
   - Vary sentence length — short sentences for emphasis, longer ones for explanation
   - Confident and authoritative tone without arrogance
   - Avoid AI-sounding filler: "certainly", "absolutely", "it's important to note", "in conclusion", "in summary"
   - Avoid hollow adjectives: "robust", "seamless", "cutting-edge", "world-class" unless substantiated

4. SPECIFICITY:
   For every requirement response, explain specifically HOW the company will comply. Reference methodologies, tools, personnel types, certifications, or deliverables. Do not write "we will comply with this requirement" — explain the approach.

5. USE THE CAPABILITY STATEMENT:
   When capability statement content is provided, draw on it to populate past performance references, certifications, key personnel, and specific technical capabilities throughout the proposal.

6. ARCHITECTURE DIAGRAM PLACEHOLDER:
   Include a clearly marked placeholder section for the architecture diagram that looks professional and gives instructions for inserting the diagram.

═══════════════════════════════════════════════
OUTPUT STRUCTURE — FOLLOW EXACTLY
═══════════════════════════════════════════════

Output the full proposal in Markdown. Use the structure below — do not skip any section.

---

# ${company} — Technical Proposal
## ${title}

*Submitted in Response to [RFP Number/Title — extract from document or use "[RFP Reference]"]*
*Date of Submission: [Month Year]*
*CONFIDENTIAL AND PROPRIETARY*

---

## TABLE OF CONTENTS

1. Executive Summary
2. Requirements Compliance Matrix
3. Technical Approach
4. Solution Architecture
5. Management Approach & Key Personnel
6. Past Performance
7. Project Schedule & Milestones
8. Risk Management
9. Cost/Price Narrative (Placeholder)
10. Certifications & Representations

---

## SECTION 1 — EXECUTIVE SUMMARY

[Write 3–4 substantial paragraphs. Cover: (a) who ${company} is and what makes them uniquely qualified, (b) a clear statement of understanding of the Government's need and mission, (c) the core technical and management approach in brief, (d) key differentiators and why ${company} should be selected. Reference specific RFP section numbers. Do not use generic boilerplate — be specific to this opportunity.]

---

## SECTION 2 — REQUIREMENTS COMPLIANCE MATRIX

*This matrix documents ${company}'s compliance with every mandatory requirement identified in the Request for Proposal. Every "shall", "must", and "required" clause has been extracted and addressed below.*

[For EACH requirement found — and there must be one entry per distinct shall/must/required clause — output the following block:]

### REQ-[N]: [Short Descriptive Title]
| Field | Detail |
|---|---|
| **Requirement (Verbatim)** | "[exact quoted text from the RFP]" |
| **Source** | [Section/Para/Page reference from the RFP] |
| **${company}'s Approach** | [2–4 sentences: specific explanation of HOW the company will comply, referencing methodology, tools, personnel, deliverables, or certifications as appropriate] |
| **Compliance Status** | ✅ Full Compliance |

[Repeat the above block for EVERY requirement. Number them REQ-1, REQ-2, REQ-3 ... REQ-N continuously.]

---

## SECTION 3 — TECHNICAL APPROACH

[This is the largest and most critical section. Organize it by mirroring the RFP's own section structure. For each technical area or requirement area, write detailed subsections. Each subsection should:]
[- Cite the relevant RFP section]
[- Explain the methodology and approach in detail]
[- Reference specific tools, frameworks, standards (e.g., NIST, CMMI, ISO, ITIL, PMBOK) as appropriate]
[- Explain how past experience with similar work supports this approach]
[- Be 2–5 paragraphs minimum per major topic area]

[Aim for at least 8–12 subsections reflecting the RFP's structure. Each subsection should be labeled:]
### 3.[N] [Topic from RFP]

---

## SECTION 4 — SOLUTION ARCHITECTURE

### 4.1 Architecture Overview

[Write 2–3 paragraphs describing the proposed solution architecture at a high level, referencing the diagram placeholder below.]

### 4.2 Architecture Diagram

> ╔══════════════════════════════════════════════════════════════════╗
> ║           **[ ARCHITECTURE DIAGRAM — INSERT HERE ]**            ║
> ║                                                                  ║
> ║  A detailed Solution Architecture Diagram illustrating the       ║
> ║  proposed technical environment will be inserted here prior      ║
> ║  to final submission. The diagram will depict:                   ║
> ║                                                                  ║
> ║  • System components and service interactions                    ║
> ║  • Data flows and integration points                             ║
> ║  • Security boundaries and access control zones                  ║
> ║  • Cloud/on-premises infrastructure topology                     ║
> ║  • Redundancy and disaster recovery architecture                 ║
> ║                                                                  ║
> ║  To insert: Use the EZShieldAI Diagram Editor to build your      ║
> ║  architecture, export as image, and place here.                  ║
> ╚══════════════════════════════════════════════════════════════════╝

### 4.3 Key Architecture Decisions

[Write 3–5 subsections explaining key architectural decisions, technology choices, and how they address specific RFP requirements. Reference specific REQ-N entries from Section 2.]

---

## SECTION 5 — MANAGEMENT APPROACH & KEY PERSONNEL

### 5.1 Program Management Approach
[3–4 paragraphs on PM methodology, tools (e.g., Agile, PMBOK), reporting cadence, governance structure.]

### 5.2 Organizational Structure
[Describe the proposed organizational structure. If capability statement includes org details, use them.]

### 5.3 Key Personnel
[List proposed key personnel roles (e.g., Program Manager, Lead Engineer, QA Lead). For each role: title, brief qualifications required, and how they contribute to mission success. Use capability statement details if available.]

### 5.4 Staffing Plan & Workforce Development
[Approach to staffing, onboarding, cross-training, and knowledge retention.]

### 5.5 Quality Assurance Plan
[QA/QC methodology, standards compliance (ISO 9001 / CMMI etc.), defect tracking, and continuous improvement approach.]

---

## SECTION 6 — PAST PERFORMANCE

[Write 3–5 past performance narratives. If capability statement provides specific projects, use them. Otherwise, write appropriately structured placeholder narratives for similar work. Each narrative should include:]
### 6.[N]: [Project/Contract Name]
- **Customer:** [Organization name]
- **Contract Value:** [Dollar value or "Available upon request"]
- **Period of Performance:** [Dates]
- **Description:** [2–3 paragraph narrative describing scope, ${company}'s role, challenges overcome, and outcomes achieved]
- **Relevance to this Requirement:** [Explain specifically which current RFP requirements this experience directly supports]

---

## SECTION 7 — PROJECT SCHEDULE & MILESTONES

[Write a phase-based timeline with 4–6 phases. For each phase:]
### Phase [N]: [Phase Name] — [Duration, e.g., "Months 1–3"]
- **Objectives:** [List 3–5 key objectives for this phase]
- **Key Activities:** [List 5–8 specific activities]
- **Deliverables:** [List specific deliverables with delivery timeframes]
- **Milestones:** [List milestone events and completion criteria]

---

## SECTION 8 — RISK MANAGEMENT

### 8.1 Risk Management Approach
[2 paragraphs on risk management methodology.]

### 8.2 Risk Register

| Risk ID | Risk Description | Probability | Impact | Mitigation Strategy | Contingency Plan |
|---|---|---|---|---|---|
[List at least 6–8 identified risks relevant to this type of contract/work, with appropriate probabilities (Low/Med/High), impacts, and specific mitigations.]

---

## SECTION 9 — COST/PRICE NARRATIVE

*Note: A detailed Cost/Price Volume will be submitted as a separate document per RFP instructions. The following provides key cost drivers and assumptions.*

### 9.1 Pricing Approach
[2 paragraphs on pricing strategy — fixed price, T&M, IDIQ, etc. as implied by the RFP.]

### 9.2 Key Cost Drivers
[List 4–6 key cost drivers with brief explanation of how they were estimated.]

### 9.3 Cost Control Measures
[3–4 cost control mechanisms ${company} employs.]

---

## SECTION 10 — CERTIFICATIONS & REPRESENTATIONS

[List relevant certifications, small business status, regulatory compliance, and standard representations. Draw from capability statement if provided. Include:]
- Business Size Status (if mentioned in capability statement)
- Relevant Certifications (ISO, CMMI, FedRAMP, etc.)
- System for Award Management (SAM.gov) Registration
- Required Regulatory Compliances
- Non-Disclosure and Organizational Conflict of Interest statement

---

*${company} — Prepared exclusively in response to [RFP Reference] — CONFIDENTIAL*`;

    const userPrompt = `Please write a complete, professional government contract technical proposal using the information below.

**Company Name:** ${company}
**Project Title / Opportunity:** ${title}

${caps ? `**COMPANY CAPABILITY STATEMENT:**
\`\`\`
${caps}
\`\`\`
` : "No capability statement provided. Use professional placeholder content appropriate for a qualified contractor."}

**REQUEST FOR PROPOSAL (RFP):**
\`\`\`
${rfp || "No RFP document provided. Write a general government IT services proposal demonstrating proper structure and format."}
\`\`\`

CRITICAL INSTRUCTIONS:
1. Scan the ENTIRE RFP above for every "shall", "must", "required", "mandatory" clause. List ALL of them in Section 2 (Requirements Compliance Matrix) — miss none.
2. Each bullet, sub-item, and numbered item with "shall/must/required" is its own separate REQ-N entry.
3. Write the full proposal following exactly the 10-section structure in the system instructions.
4. Use the capability statement to populate past performance, key personnel qualifications, certifications, and company-specific technical details.
5. Write in a confident, professional, human tone. Active voice. No AI-sounding filler phrases.
6. Be specific in every response — reference methodology names, tools, standards, and deliverable types.

Begin the proposal now:`;

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicResp.ok) {
      const errBody = await anthropicResp.text();
      throw new Error(`Anthropic error (${anthropicResp.status}): ${errBody.slice(0, 400)}`);
    }

    // Transform Anthropic SSE stream → frontend token stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = anthropicResp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                const token = parsed.delta.text ?? "";
                if (token) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      } finally {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("generate-proposal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
