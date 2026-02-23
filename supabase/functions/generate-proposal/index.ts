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

CRITICAL INSTRUCTION — Requirement Compliance Matrix:
Before writing the proposal, you MUST scan ALL uploaded reference documents for every sentence or clause containing the words "shall", "must", "will", "required", or "mandatory". These are binding requirements from the RFP/SOW.

For EACH requirement found:
1. Quote the original requirement verbatim
2. Provide a comprehensive, specific response explaining exactly how the offeror will comply
3. Reference specific methodologies, tools, personnel, or deliverables where applicable

Structure your output as follows:

## Part 1: Requirements Compliance Matrix
For each requirement found in the documents, create a row:
- **Requirement [number]**: "[exact quote from document]"
  - **Source**: [document name, section if identifiable]
  - **Compliance Response**: [detailed response addressing how this requirement will be met]
  - **Compliance Status**: Full Compliance | Partial Compliance | Exception (with explanation)

## Part 2: Full Proposal
After the compliance matrix, write the complete proposal with these sections:
1. Executive Summary
2. Understanding of Requirements
3. Technical Approach / Solution Overview
4. Methodology & Implementation Plan
5. Team Qualifications & Experience
6. Project Timeline & Milestones
7. Pricing / Cost Proposal (structure only, with placeholders)
8. Risk Mitigation Strategy
9. Conclusion & Call to Action

Use professional language, be specific and data-driven where possible. Cross-reference the compliance matrix entries within the proposal body.`;

    const userPrompt = `Please write a ${proposalType || "enterprise"} proposal with the following details:

Project Title: ${projectTitle || "Untitled Project"}
Project Description: ${projectDescription || "No description provided."}
${documentsContext}

IMPORTANT: First, scan ALL reference documents above for every "shall", "must", "will", "required", and "mandatory" clause. Build a comprehensive Requirements Compliance Matrix addressing each one individually. Then write the full proposal. Format everything with clear headers and sections using markdown.`;

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
