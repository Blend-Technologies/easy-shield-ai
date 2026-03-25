// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Reference document text (baked in from uploaded PDFs) ────────────────────

const LOI_DESIGN_SAMPLE = `
EVANKOFF & TOOLE CORP — LETTER OF INTEREST / CAPABILITY STATEMENT

COMPANY PROFILE
Evankoff & Toole Corp is a Service-Disabled Veteran-Owned Small Business (SDVOSB) and 8(a) certified firm specializing in facility management, construction management, and base operations support services for the Department of Defense and federal civilian agencies. The company is headquartered in the United States and maintains experienced personnel with active security clearances across a range of facility and infrastructure programs.

CORE COMPETENCIES
- Facility Operations & Maintenance (O&M)
- Construction Management and General Contracting
- Base Operations Support Services (BOSS)
- Environmental Compliance and Remediation
- Quality Control and Safety Program Management
- Subcontractor and Vendor Management
- Project Scheduling (CPM / Primavera P6)
- Cost Estimating and Budget Management

PAST PERFORMANCE — HOMESTEAD AIR RESERVE BASE (ARB)
Contract 1: Facility Operations and Maintenance Support
Client: 482nd Fighter Wing, Homestead ARB, FL
Period of Performance: 2017-2020 | Value: $4.2M
Description: Provided full-scope O&M services for 42 facilities totaling 650,000 SF including HVAC, electrical, plumbing, and structural maintenance. Maintained 98% work order completion rate. Zero lost-time safety incidents across 36 months.

Contract 2: Base Infrastructure Repairs
Client: Air Force Civil Engineering, Homestead ARB, FL
Period of Performance: 2018-2021 | Value: $2.8M
Description: Performed infrastructure repair and minor construction projects including runway lighting upgrades, hangar door replacements, and utility line repairs. Delivered all projects on schedule with 0 contractor-caused delays.

Contract 3: Environmental Compliance Support
Client: 482nd Fighter Wing Environmental, Homestead ARB, FL
Period of Performance: 2019-2022 | Value: $1.1M
Description: Managed hazardous waste disposal, stormwater compliance, and SPCC plan updates. Zero regulatory violations. Reduced waste disposal costs by 15% through recycling program.

Contract 4: Quality Assurance / Quality Control (QA/QC) Services
Client: AFCEC, Homestead ARB
Period of Performance: 2020-2022 | Value: $750K
Description: Provided independent QC inspections for 12 concurrent construction projects. Developed QC plans, conducted daily inspections, and coordinated with AFCEC representatives. 100% acceptance rate on all deliverables.

Contract 5: Administrative and Logistics Support
Client: 482nd Mission Support Group, Homestead ARB
Period of Performance: 2019-2021 | Value: $900K
Description: Provided administrative, logistics, and supply chain support services. Managed property accountability for over 2,000 line items. Maintained 99.7% inventory accuracy.

Contract 6: Safety and Occupational Health Program Support
Client: Homestead ARB Safety Office
Period of Performance: 2018-2020 | Value: $600K
Description: Developed and implemented comprehensive safety programs including mishap prevention, hazard communication, and training. Achieved zero OSHA recordable incidents over 24 months.

Contract 7: Grounds Maintenance and Landscaping
Client: 482nd Civil Engineering Squadron, Homestead ARB
Period of Performance: 2017-2022 | Value: $1.3M
Description: Maintained 300+ acres of grounds including airfield environs, parade grounds, and installation perimeter. Performed pest control, irrigation, and tree trimming. 100% inspection scores.

Contract 8: Information Technology Infrastructure Support
Client: 482nd Communications Squadron, Homestead ARB
Period of Performance: 2021-2023 | Value: $1.9M
Description: Provided IT infrastructure support including network operations, help desk services, cybersecurity compliance monitoring, and hardware/software lifecycle management. Maintained 99.9% system uptime.

CERTIFICATIONS & REGISTRATIONS
- SDVOSB — VA Center for Verification and Evaluation (CVE) Verified
- 8(a) Small Disadvantaged Business — SBA Certified
- SAM.gov Active Registration
- NAICS Codes: 236220, 237310, 238210, 238220, 541330, 561210, 561720
`.trim();

const SOURCES_SOUGHT_TEMPLATE = `
SOURCES SOUGHT RESPONSE TEMPLATE — EVANKOFF & TOOLE CORP

COMPANY INFORMATION
Company Name: Evankoff & Toole Corp
Business Type: Service-Disabled Veteran-Owned Small Business (SDVOSB), SBA 8(a)
SAM.gov Registration: Active
Primary NAICS: 236220 (Commercial and Institutional Building Construction)
Additional NAICS: 237310, 238210, 238220, 541330, 561210, 561720

CAPABILITY NARRATIVE
Evankoff & Toole Corp (E&T) is a professional services and construction management firm with over 15 years of experience supporting Department of Defense installations and federal civilian agencies. Our team brings deep expertise in facility operations, construction management, environmental compliance, and base support services.

E&T employs a workforce of 85+ full-time employees and 200+ qualified subcontractors with active or eligible security clearances. Our project managers hold PMP and CCM certifications; our safety professionals are OSHA 30-certified; and our environmental staff hold HAZWOPER and EPA certifications.

RELEVANT EXPERIENCE
Program 1 — Facility O&M, Homestead ARB
E&T maintained 42 facilities (650,000 SF) under a 3-year O&M contract at Homestead ARB. Delivered 98% work-order completion, zero safety incidents, and below-budget performance every year.

Program 2 — Construction Management, Multiple DoD Sites
Managed concurrent construction projects across 5 Air Force bases totaling $28M in construction value. All projects delivered on schedule and within budget. Achieved LEED Silver on two new construction projects.

Program 3 — Environmental Compliance, Homestead ARB
Managed all RCRA, SPCC, and Clean Water Act compliance activities for a major Air Force installation. Zero regulatory enforcement actions over 3-year contract period.

TEAMING APPROACH
E&T maintains established teaming relationships with large business primes (AECOM, Leidos, SAIC) and uses a structured subcontractor management program with defined communication protocols, quality checkpoints, and financial controls.

QUALITY MANAGEMENT
E&T's Quality Management System is based on ISO 9001:2015 principles. We maintain a three-tier QC program: preparatory, initial, and follow-up inspections. All deficiencies are tracked in a real-time database and resolved within 24 hours for minor items and 48 hours for significant items.

SAFETY
E&T's safety record: EMR of 0.72 (below industry average of 1.0). Our safety program includes daily tailgate meetings, weekly job site inspections, monthly safety stand-downs, and 24-hour incident reporting. We have maintained zero lost-time injuries on federal contracts for 7 consecutive years.

PROPOSAL FORMAT GUIDANCE
Executive Summary: Lead with company identity, contract number, and a clear statement of relevant experience. Include SDVOSB/8(a) status prominently.
Technical Approach: Use numbered sections mirroring RFP SOW structure. For each task, state the company shall perform the action and cite the applicable PWS paragraph.
Management Plan: Include org chart with named key personnel. Describe communication protocols, reporting cadence, and escalation procedures.
Staffing Plan: Use a staffing matrix with labor categories, hours, qualifications, and certifications. Reference relevant experience for each key position.
Past Performance: Three to five examples in CPAR format: contract number, agency, period of performance, dollar value, description, outcome/rating.
Quality Control Plan: Three-tier QC structure. Include inspection forms, deficiency tracking, and government interface procedures.
`.trim();

const MACC_TECHNICAL_PROPOSAL = `
MIAMI WIIPICA LLC — MACC TECHNICAL PROPOSAL
Solicitation FA2860-20-R-0045 | Multiple Award Construction Contract (MACC)
Homestead Air Reserve Base, Florida

SECTION 1 — MANAGEMENT PLAN

1.1 QUALITY CONTROL PROGRAM
Miami Wiipica LLC (MWL) implements a three-tier Quality Control (QC) system in strict conformance with USACE EM 385-1-1 and the project-specific QC Plan. Our QC Manager, Cecil Whitlock (30+ years federal construction QC experience, CQM certified), has direct authority to stop work and reject non-conforming materials.

Three-Tier Inspection System:
Preparatory Phase: Conducted before each definable feature of work (DFOW). The QC Manager and Superintendent review drawings, specs, submittals, equipment, and materials.
Initial Phase: Conducted at the start of each DFOW. Verifies all preparatory actions have been completed. Establishes baseline standards for workmanship.
Follow-Up Phase: Conducted daily. Confirms work continues to meet established standards. Documents deviations and corrective actions.

QC Documentation:
- Daily QC Reports (DQRs) submitted by 0800 the following business day
- Deficiency Log maintained in real-time; all deficiencies assigned corrective action with due date
- Rework items closed out with photo documentation before work proceeds
- Government QAR notified of all preparatory and initial phase meetings 24 hours in advance

1.2 SAFETY PROGRAM
MWL's Accident Prevention Plan (APP) is prepared by Harry Brown, our Site Safety and Health Officer (SSHO), who holds OSHA 30-hour Construction certification and 40-hour HAZWOPER. MWL's EMR is 0.68.

Key safety elements:
- Daily safety briefings (tailgate meetings) at project start
- Competent persons identified for all high-hazard operations (excavation, confined space, electrical, fall protection)
- Activity Hazard Analyses (AHAs) prepared for each DFOW and approved by SSHO before work begins
- All incidents (including near-misses) reported to Contracting Officer within 24 hours
- Monthly safety stand-downs; quarterly full-program audits

1.3 SUBCONTRACTOR MANAGEMENT
Troy Bollinger, Deputy Program Manager, manages all subcontractor relationships. MWL uses a three-phase subcontractor oversight system:

Pre-Award: Subcontractors must submit proof of insurance, SAM.gov registration, qualified personnel certifications, and references.
Performance: Weekly progress meetings with subcontractors. Monthly invoicing reviews. Non-performance triggers a formal written cure notice within 48 hours.
Closeout: Subcontractors must submit all required closeout documents before final payment.

1.4 ORGANIZATIONAL STRUCTURE
Program Manager: Jeremy Woodward, PMP, CCM — overall contract accountability
Deputy PM / Subcontracts: Troy Bollinger — subcontractor oversight, schedule management
QC Manager: Cecil Whitlock, CQM — quality assurance, government interface, deficiency resolution
SSHO: Harry Brown, OSHA 30, HAZWOPER 40 — safety compliance, AHAs, incident reporting
Site Superintendent: Charles McGill — daily field operations, crew coordination, schedule adherence
Estimator / Cost Control: Lance Herman — cost management, change order analysis, EVM reporting
Procurement Manager: Chris Basham — material procurement, vendor qualification, supply chain
Administrative Manager: Todd Henry — contract administration, invoicing, correspondence

SECTION 2 — STAFFING PLAN

2.1 STAFFING PHILOSOPHY
MWL staffs projects with a blend of core full-time employees and project-specific hires. All key personnel are pre-identified and available within 14 days of NTP. We maintain a qualified labor pool of 150+ craftspeople across South Florida.

2.2 KEY PERSONNEL HIRING CRITERIA MATRIX

Position: Project Manager
Required: PMP or CCM certification, 10+ years federal construction, current SECRET clearance eligibility, experience with AFCEC contracts
Preferred: P.E. or Architect licensure, prior Homestead ARB experience, CPM scheduling proficiency

Position: QC Manager
Required: CQM certified (USACE), 8+ years QC management on DoD projects, familiarity with UFGS specs and RFI/submittal processes
Preferred: Prior Air Force installation experience, EM 385-1-1 instructor certification

Position: Site Safety and Health Officer
Required: OSHA 30-hour Construction, HAZWOPER 40-hour, 5+ years DoD safety, EMR below 1.0
Preferred: CHST or CSP certification, Air Force installation safety experience

Position: Site Superintendent
Required: 15+ years construction superintendent experience, 5+ years federal/DoD, CPM scheduling literacy
Preferred: Journeyman trade license (electrical or mechanical)

Position: Estimator
Required: 10+ years construction cost estimating, proficiency in RS Means and PACES
Preferred: Certified Professional Estimator (AACE), DoD MILCON experience

2.3 STAFFING LEVELS BY PHASE
Mobilization Phase: 4 staff (PM, QC, SSHO, Superintendent)
Construction Phase: 8-25 staff depending on concurrent task orders
Closeout Phase: 4 staff (PM, QC, Superintendent, Admin)

SECTION 3 — PERFORMANCE EXECUTION PLAN

3.1 PRE-CONSTRUCTION PHASE (Days 1-30 after NTP)
Day 1-3: Attend kick-off meeting with Contracting Officer and AFCEC Engineering. Obtain base access credentials for all personnel and vehicles.
Day 1-7: Submit QC Plan, APP, and preliminary CPM schedule for government review and approval.
Day 7-14: Conduct site survey and utility locates. Establish site logistics (trailer, laydown, traffic control, security fencing).
Day 14-21: Submit first round of submittals based on critical path items.
Day 21-30: Obtain all required permits. Government approval of QC Plan and APP required before any construction activity.

Deliverables (Pre-Construction):
- QC Plan (approved by QC Manager and submitted to Contracting Officer)
- Accident Prevention Plan (APP) with Activity Hazard Analyses
- Baseline CPM Schedule (P6 format, minimum 3-week lookahead)
- Submittal Register
- Site-Specific Safety Plan
- Environmental Protection Plan

3.2 CONSTRUCTION PHASE
Schedule Management: MWL uses Primavera P6 for all scheduling. A 3-week lookahead schedule is updated weekly and shared with the AFCEC QAR. Monthly schedule updates are submitted to the Contracting Officer. Any activity projected to slip more than 5 days triggers a Recovery Schedule within 72 hours.

Progress Meetings: Weekly progress meetings with Contracting Officer and QAR. MWL provides meeting minutes within 24 hours. Action items tracked in a shared register.

Change Order Management: MWL responds to all Request for Proposals (RFPs) within 10 business days. Proposals are submitted in PACES/MII format with backup cost data. Unauthorized work will not be performed without written Contracting Officer authorization.

Material Management: All materials are tracked in MWL's Material Management System. Approved submittals are on file before materials are delivered. Hazardous materials stored per SPCC and RCRA requirements.

Environmental Compliance: MWL coordinates with Homestead ARB Environmental Office for all work involving soil disturbance, hazardous materials, or stormwater impacts. SWPPP maintained and inspected weekly.

3.3 CLOSEOUT PHASE (Final 30 days)
Punch List: QC Manager and Government QAR conduct joint punch list walk at 90% completion. All items resolved before substantial completion request.
As-Built Drawings: Redline as-builts maintained throughout project. Final as-builts delivered in AutoCAD and PDF format within 10 days of substantial completion.
O&M Manuals: Submitted in three-ring binders and electronic format. Include manufacturer data, warranties, spare parts lists, and maintenance schedules.
Warranties: All warranties commence on date of substantial completion. Warranty register provided to QAR.
Training: Operator training on all new or modified systems provided to base facilities personnel before final acceptance.
Final Inspection: MWL requests final inspection from Contracting Officer after all punch list items resolved and all closeout documents submitted.

3.4 PERFORMANCE METRICS AND REPORTING
MWL commits to the following performance standards on all task orders:
- Schedule Compliance: 95% of milestones met on original planned dates
- QC Deficiency Resolution: 100% of minor deficiencies resolved within 24 hours; significant deficiencies within 48 hours
- Safety: Zero OSHA recordable incidents; EMR maintained below 0.80
- Submittal Response: 100% of submittals turned around within specified review period
- Government Correspondence: All CO correspondence answered within 2 business days
- Cost Performance: Cost at Completion within +/-3% of negotiated contract value
- Customer Satisfaction: Target CPARS rating of Exceptional or Very Good on all performance categories

PROPOSAL FORMAT NOTES:
Section numbering: Use X.Y format (1.1, 1.2, etc.) matching the RFP SOW paragraph structure.
Tables: Use for staffing matrices, schedule milestones, performance metrics, and risk registers.
Personnel: Always name key personnel with their certifications and years of experience.
Commitments: Use specific numbers and dates — "within 24 hours," "0.68 EMR," "98% completion rate."
SOW traceability: Every proposal section should reference the applicable PWS or SOW paragraph.
Compliance statements: Use "Company shall comply with [requirement]" format to create explicit compliance trails.
Architecture/Diagrams: For IT or engineering proposals, include a labeled placeholder: "[INSERT SOLUTION ARCHITECTURE DIAGRAM — Provided as separate Exhibit A]"
`.trim();

// ── Chunking ──────────────────────────────────────────────────────────────────
function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks.filter((c) => c.length > 50);
}

// ── Azure OpenAI embedding ────────────────────────────────────────────────────
async function generateEmbedding(
  text: string,
  endpoint: string,
  apiKey: string,
  deployment: string,
  apiVersion: string,
): Promise<number[]> {
  const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ input: text.slice(0, 8000) }),
  });
  if (!resp.ok) throw new Error(`Azure embedding error (${resp.status}): ${await resp.text()}`);
  const data = await resp.json();
  return data.data[0].embedding as number[];
}

// ── Main Handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const AZURE_OPENAI_ENDPOINT      = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY       = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_API_VERSION          = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const AZURE_POSTGRES_URL         = Deno.env.get("AZURE_POSTGRES_URL") ?? "";

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      throw new Error("Azure OpenAI credentials not configured.");
    }
    if (!AZURE_POSTGRES_URL) {
      throw new Error("AZURE_POSTGRES_URL not configured.");
    }

    // Reference documents baked into this function
    const REFERENCE_DOCUMENTS = [
      {
        name: "LOI Design Sample — Evankoff & Toole Corp",
        category: "loi_capability_statement",
        text: LOI_DESIGN_SAMPLE,
      },
      {
        name: "Sources Sought Template — Evankoff & Toole Corp",
        category: "sources_sought_template",
        text: SOURCES_SOUGHT_TEMPLATE,
      },
      {
        name: "MACC Technical Proposal — Miami Wiipica LLC (FA2860-20-R-0045)",
        category: "technical_proposal_reference",
        text: MACC_TECHNICAL_PROPOSAL,
      },
    ];

    const client = new Client(AZURE_POSTGRES_URL);
    await client.connect();

    let totalChunks = 0;

    try {
      // Clear existing entries for these categories (idempotent re-seed)
      await client.queryObject(
        `DELETE FROM knowledge_base_chunks WHERE category IN ('loi_capability_statement','sources_sought_template','technical_proposal_reference')`,
      );

      for (const doc of REFERENCE_DOCUMENTS) {
        const chunks = chunkText(doc.text, 1500, 200);
        console.log(`Seeding "${doc.name}": ${chunks.length} chunks`);

        for (let i = 0; i < chunks.length; i++) {
          const embedding = await generateEmbedding(
            chunks[i], AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
            AZURE_EMBEDDING_DEPLOYMENT, AZURE_API_VERSION,
          );
          const embeddingStr = `[${embedding.join(",")}]`;

          await client.queryObject(
            `INSERT INTO knowledge_base_chunks (document_name, category, content, chunk_index, embedding)
             VALUES ($1, $2, $3, $4, $5::vector)`,
            [doc.name, doc.category, chunks[i], i, embeddingStr],
          );
          totalChunks++;
        }
      }

      console.log(`Seeded ${totalChunks} total chunks from ${REFERENCE_DOCUMENTS.length} reference documents.`);
      return new Response(
        JSON.stringify({
          success: true,
          totalChunks,
          documents: REFERENCE_DOCUMENTS.map((d) => d.name),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } finally {
      await client.end();
    }
  } catch (e) {
    console.error("seed-knowledge-base error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
