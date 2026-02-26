import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model, documentTexts, projectTitle, projectDescription, proposalType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Map user-friendly model names to gateway model IDs
    const modelMap: Record<string, string> = {
      "gemini-flash": "google/gemini-3-flash-preview",
      "gemini-pro": "google/gemini-2.5-pro",
      "gpt-5": "openai/gpt-5",
      "gpt-5-mini": "openai/gpt-5-mini",
      "gpt-5.2": "openai/gpt-5.2",
    };

    const selectedModel = modelMap[model] || "google/gemini-3-flash-preview";

    const documentsContext = documentTexts && documentTexts.length > 0
      ? `\n\nReference Documents:\n${documentTexts.map((d: { name: string; content: string }, i: number) => `--- Document ${i + 1}: ${d.name} ---\n${d.content}`).join("\n\n")}`
      : "";

    const systemPrompt = `You are an expert proposal writer specializing in enterprise and government contract proposals. You write compelling, professional, and thorough proposals that follow best practices for winning bids.

CRITICAL INSTRUCTION — Full RFP Coverage:
You MUST perform a COMPLETE and EXHAUSTIVE analysis of ALL uploaded reference documents. This means:

1. **Mandatory Requirements Scan**: Find EVERY sentence or clause containing "shall", "must", "will", "required", "mandatory", "expected", or "responsible for". These are binding requirements.

2. **Bullet Point & Enumerated Item Scan**: Find EVERY bullet point, numbered list item, lettered list item, or enumerated requirement in the RFP/SOW. Each one must be addressed individually — do NOT skip or summarize groups of bullets.

3. **Section-by-Section Coverage**: Go through EVERY section of the RFP document(s) systematically. Do not skip any section, appendix, or attachment content.

Structure your output with PROFESSIONAL formatting as follows:

---

# Requirements Compliance Matrix

For EACH requirement found (mandatory clauses AND bullet points), create a detailed entry:

### Requirement [number]: [Short descriptive title]
- **Original Text**: "[exact quote from document]"
- **Source**: [document name, section/page if identifiable]
- **Compliance Response**: [detailed, specific response explaining exactly HOW the offeror will comply, referencing specific methodologies, tools, personnel, certifications, or deliverables]
- **Compliance Status**: ✅ Full Compliance | ⚠️ Partial Compliance (with explanation) | ❌ Exception (with justification)

---

# Full Proposal

After the compliance matrix, write a complete, polished proposal with these sections. Each section should be substantial and detailed:

## 1. Executive Summary
A compelling overview that demonstrates understanding and positions the offeror as the ideal choice.

## 2. Understanding of Requirements
Demonstrate deep comprehension of the client's needs, challenges, and objectives. Reference specific RFP sections.

## 3. Technical Approach / Solution Overview
Detailed solution architecture and approach. Address every technical requirement from the RFP.

## 4. Methodology & Implementation Plan
Step-by-step methodology with phases, activities, and deliverables for each phase.

## 5. Team Qualifications & Experience
Relevant experience, certifications, past performance, and key personnel qualifications. Reference the applicant's resume or capability statement if provided.

## 6. Project Timeline & Milestones
Detailed timeline with milestones, dependencies, and deliverable dates presented in a clear format.

## 7. Pricing / Cost Proposal
Professional cost structure with line items, labor categories, and pricing notes. Use placeholder values marked as [TO BE DETERMINED] where specific numbers are needed.

## 8. Risk Mitigation Strategy
Identify potential risks and provide concrete mitigation strategies for each.

## 9. Conclusion & Call to Action
Strong closing that reinforces key differentiators and next steps.

---

FORMATTING RULES:
- Use proper markdown: # for H1, ## for H2, ### for H3
- Use **bold** for emphasis on key terms and compliance statuses
- Use bullet points (- ) for lists
- Use numbered lists (1. ) for sequential items
- Use horizontal rules (---) between major sections
- Use tables where appropriate for comparing items
- Every section must have substantive content — no placeholders or "TBD" sections except for pricing numbers
- Cross-reference compliance matrix entries within the proposal body using [See Requirement X]
- Be specific and data-driven; avoid vague language`;

    const userPrompt = `Please write a comprehensive ${proposalType || "enterprise"} proposal with the following details:

**Project Title**: ${projectTitle || "Untitled Project"}
**Project Description**: ${projectDescription || "No description provided."}
${documentsContext}

CRITICAL INSTRUCTIONS:
1. Scan ALL reference documents for EVERY "shall", "must", "will", "required", and "mandatory" clause. Address each one individually in the Requirements Compliance Matrix.
2. Scan ALL reference documents for EVERY bullet point, numbered item, and enumerated requirement. Address each one individually.
3. Do NOT skip any section of any uploaded document — cover the entire RFP systematically.
4. After the compliance matrix, write a full, professionally formatted proposal with all sections.
5. Use proper markdown formatting throughout with clear headers, bold text, bullet points, and section dividers.
6. Cross-reference compliance matrix entries in the proposal body.
7. Be thorough, specific, and leave no requirement unaddressed.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-proposal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
