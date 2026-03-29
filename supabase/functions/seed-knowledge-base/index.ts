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

const BLEND_AI_LOW_CODE_PROPOSAL = `
BLEND AI TECHNOLOGIES, LLC — TECHNICAL PROPOSAL
RFP #25-03: LOW-CODE APPLICATION DEVELOPMENT SERVICES
Florida Department of Citrus

COVER PAGE
Company Name: Blend AI Technologies, LLC
UEI: N934SMF2Q3N8
CAGE Code: 18Q78
SAM.gov Registration: Active

VOLUME I — BUSINESS PROPOSAL

TAB A — EXECUTIVE SUMMARY

Blend AI Technologies, LLC (Blend AI) is pleased to submit this proposal in response to RFP #25-03, Low-Code Application Development Services, issued by the Florida Department of Citrus (FDOC). As a specialized technology firm with deep expertise in Microsoft Power Platform, Azure cloud architecture, and low-code application development, Blend AI is uniquely positioned to deliver the scalable, modern application infrastructure FDOC requires to advance its mission.

Blend AI brings a proven methodology combining Microsoft Power Platform (Power Apps, Power Automate, Power BI, Power Pages) with Azure Synapse Analytics, Azure Data Lake, and Azure DevOps to deliver enterprise-grade low-code solutions at a fraction of traditional development cost and timeline. Our team has successfully implemented similar solutions for state agencies, insurance carriers, and transportation authorities, consistently delivering on time and within budget.

Our proposed solution addresses every functional and technical requirement in RFP #25-03. We will deploy a four-environment strategy (Development, Test, UAT, Production) with full CI/CD pipeline automation, governed ALM practices, and role-based access controls aligned with Florida security standards. We commit to a Grand Total of $270,000 for the full scope of services as detailed in Tab E.

TAB B — SOLICITATION FORMS

Blend AI Technologies, LLC certifies compliance with all representations and certifications required by RFP #25-03. The company is registered and active in SAM.gov (UEI: N934SMF2Q3N8, CAGE: 18Q78) and meets all eligibility requirements. All solicitation forms are completed and executed as required.

TAB C — DISCLOSURES

Blend AI Technologies, LLC has no current or pending litigation, no organizational conflicts of interest, and no financial relationships that would create a conflict with performance of this contract. The company carries the required insurance coverages including general liability, professional liability (errors and omissions), and workers compensation. Full disclosure statements are provided as required attachments.

TAB D — CLIENT REFERENCES

Reference 1: Microsoft Corporation
Project: Power Platform Center of Excellence Implementation
Scope: Implemented a Power Platform CoE Starter Kit, established governance policies, and delivered Power Apps training for 500+ citizen developers. Deployed 25 production Power Apps solutions across Sales, HR, and Operations.
Outcome: Reduced application development cycle time by 65%. Achieved 98% user adoption within 90 days of go-live. Zero critical post-deployment defects in first 6 months.
Contact: [Microsoft Reference Contact, available upon request]

Reference 2: Zurich North America (Insurance)
Project: Claims Processing Automation — Power Platform + Azure
Scope: Designed and deployed a Power Apps-based claims intake portal integrated with Azure Logic Apps, Dataverse, and legacy claims management system via API layer. Automated 14 manual workflows using Power Automate.
Outcome: Reduced claims processing time from 5 business days to 6 hours. Eliminated 3 FTE worth of manual data entry. Achieved 99.9% data accuracy rate.
Contact: [Zurich NA Reference Contact, available upon request]

Reference 3: Department of Transportation
Project: Asset Management and Inspection Portal
Scope: Built a field inspection application using Power Apps (canvas and model-driven) with offline capability for 200+ field inspectors. Integrated with GIS systems, Azure SQL, and departmental ERP.
Outcome: Reduced inspection reporting time by 70%. Achieved full offline/online sync with zero data loss incidents. Delivered 3 weeks ahead of schedule.
Contact: [DOT Reference Contact, available upon request]

TAB E — PRICE SHEET

PRICE SUMMARY
Phase 1 — Discovery and Architecture Design: $35,000
Phase 2 — Application Development (Core Modules): $95,000
Phase 3 — Integration and Data Migration: $55,000
Phase 4 — Testing, UAT Support, and Security Review: $40,000
Phase 5 — Deployment, Training, and Documentation: $30,000
Phase 6 — Post-Go-Live Support (90 days): $15,000
Grand Total: $270,000

VOLUME II — TECHNICAL PROPOSAL

TAB A — TECHNICAL ARCHITECTURE

A.1 SOLUTION OVERVIEW — POWER PLATFORM + AZURE SYNAPSE

Blend AI proposes a modern, cloud-native low-code architecture built on Microsoft Power Platform and Azure services. The solution leverages Power Apps for user interface and workflow, Power Automate for process automation, Power BI for reporting and analytics, Azure Synapse Analytics for data warehousing and advanced analytics, Azure API Management for integration governance, and Azure Active Directory for identity and access management.

The architecture follows a hub-and-spoke model with a centralized Azure data platform (the hub) serving multiple departmental Power Platform solutions (the spokes). All data flows are governed through Azure API Management, ensuring security, auditability, and rate control. Azure Synapse Analytics serves as the single source of truth for analytical workloads, ingesting operational data via Azure Data Factory pipelines.

Power Platform's Dataverse (Common Data Service) serves as the transactional data store for Power Apps and Power Automate workflows, with a bidirectional sync to Azure Synapse for analytical queries. This separation of concerns ensures OLTP workloads do not degrade analytical performance.

A.2 FOUR-ENVIRONMENT STRATEGY

Blend AI implements a four-environment Application Lifecycle Management (ALM) strategy as required:

Environment 1 — Development (DEV): Individual developer sandboxes with no production data. Power Platform solutions are developed and unit-tested here. Azure DevOps pipelines trigger on each commit to the develop branch.

Environment 2 — Test (TEST): Shared integration testing environment. Automated test suites (Power Apps Test Studio, Selenium for Power Pages) execute on every pull request merge. Synthetic test data only.

Environment 3 — User Acceptance Testing (UAT): Mirror of production with anonymized production data. FDOC business stakeholders perform acceptance testing here. No code changes permitted — only configuration adjustments with Change Advisory Board (CAB) approval.

Environment 4 — Production (PROD): Hardened environment with full RBAC, audit logging, and DLP policies enforced. Deployments occur only via approved Azure DevOps release pipelines with mandatory sign-off from FDOC IT and the Project Manager.

A.3 AZURE INTEGRATION ARCHITECTURE

The integration layer uses Azure API Management (APIM) as the central gateway for all inbound and outbound service calls. REST APIs are versioned (v1, v2) with OpenAPI 3.0 specifications published to FDOC's developer portal. Azure Service Bus provides asynchronous messaging for high-volume event-driven workflows. Azure Logic Apps orchestrates complex multi-system integrations requiring conditional branching and error handling beyond Power Automate's native capabilities.

Legacy system integration uses Azure Integration Services with an adapter pattern: each legacy system exposes a standardized REST interface through a custom connector in Power Platform. SFTP-based batch integrations use Azure Data Factory with parameterized pipelines and email/Teams alerting on failure.

A.4 DATA MANAGEMENT STRATEGY

All data at rest is encrypted using AES-256 (Azure Storage Service Encryption). Data in transit is encrypted via TLS 1.2+. PII data fields are masked in non-production environments using Azure Purview data classification policies. Data retention policies are configured in Dataverse and Azure Synapse to comply with Florida public records law.

Azure Synapse Analytics uses dedicated SQL pools for FDOC's reporting workloads, with auto-pause configured for cost optimization during off-hours. Power BI Premium capacity is used for embedded analytics within Power Apps, eliminating per-user licensing requirements for read-only consumers.

A.5 API ARCHITECTURE

All APIs follow RESTful design principles with JSON payloads. API versioning uses URL path versioning (/api/v1/). Pagination uses cursor-based pagination for large datasets. All APIs require OAuth 2.0 bearer tokens issued by Azure Active Directory. Rate limiting is enforced at the APIM layer (1,000 requests/minute per subscription). Full API telemetry is collected in Azure Application Insights.

A.6 SECURITY ARCHITECTURE

Authentication: Azure Active Directory with Multi-Factor Authentication (MFA) enforced for all users. Conditional Access policies block access from non-compliant devices and non-Florida IP ranges for privileged operations.

Authorization: Role-Based Access Control (RBAC) with least-privilege principle. Dataverse security roles map to FDOC organizational units. Azure RBAC governs access to Azure resources with no standing elevated privileges — Just-In-Time (JIT) access via Azure PIM for administrative tasks.

Data Loss Prevention: Power Platform DLP policies block sensitive connectors in production environments. Azure Information Protection classifies documents automatically based on content.

A.7 PERFORMANCE AND SCALABILITY

Power Apps canvas applications are optimized for sub-3-second page load times using delegation, concurrent loading, and incremental data loading patterns. Dataverse is configured with appropriate indexing on all frequently-queried columns. Azure Synapse scales automatically from 100 DWU to 6,000 DWU based on query concurrency.

Load testing using Azure Load Testing is performed prior to UAT sign-off, simulating 500 concurrent users for a 30-minute soak test. Performance baselines are documented in the Performance Test Report deliverable.

A.8 ARCHITECTURE DIAGRAM

> [ARCHITECTURE DIAGRAM — Solution Architecture including Power Platform, Azure Synapse, API Management, and 4-Environment ALM flow. Provided as Exhibit A to this proposal.]

TAB B — AGILE DELIVERY

B.1 AGILE METHODOLOGY

Blend AI uses a Scaled Agile Framework (SAFe) adapted for government contracts. Work is organized in 2-week sprints within 8-week Program Increments (PIs). Each PI begins with a PI Planning session attended by FDOC stakeholders and Blend AI's full delivery team. Sprint reviews are open to all FDOC personnel. The Product Owner role is filled jointly by Blend AI's engagement manager and FDOC's designated Product Owner.

User stories follow the standard format: "As a [user type], I want [capability] so that [business value]." Each story has explicit acceptance criteria written in Gherkin (Given/When/Then) syntax, which are directly mapped to automated test cases.

B.2 SPRINT PLANNING AND EXECUTION

Sprint Planning: Held on the first Monday of each sprint. The team selects user stories from the prioritized backlog and breaks them into technical tasks. Capacity is calculated per developer based on available days minus leave and meeting overhead.

Daily Standups: 15-minute synchronous standups at 9:00 AM ET Monday through Friday. FDOC Project Manager is invited as observer. Blockers are escalated same-day.

Sprint Review: Held on the last Friday of each sprint. Working software is demonstrated to FDOC stakeholders. Feedback is captured and converted to backlog items for prioritization.

Sprint Retrospective: Internal Blend AI session immediately after Sprint Review. Three items to keep, three to stop, three to try. Action items are assigned owners and tracked to closure.

B.3 PROJECT GOVERNANCE

Project Steering Committee: Meets monthly. Attendees include FDOC Contract Manager, FDOC IT Director, Blend AI Account Executive, and Blend AI Project Manager. Reviews schedule, budget, risks, and strategic decisions.

Change Control: All scope changes require a formal Change Request (CR) submitted to FDOC Contract Manager. CRs include impact assessment (cost, schedule, risk) and require written approval before work begins. No unauthorized scope additions.

Status Reporting: Weekly status report delivered every Friday by 5:00 PM ET. Report includes sprint progress, burn-down chart, risk register, and upcoming milestones.

B.4 DELIVERY TIMELINE

Weeks 1-4: Discovery, requirements validation, architecture finalization, environment provisioning
Weeks 5-12: Phase 1 development (core Power Apps modules, data model)
Weeks 13-20: Phase 2 development (integrations, automation workflows, Power BI dashboards)
Weeks 21-24: UAT support, defect remediation, security review
Weeks 25-26: Production deployment, user training, documentation delivery
Weeks 27-38: Post-go-live support (90 days)

TAB C — DEVOPS AND QUALITY ASSURANCE

C.1 CI/CD PIPELINE

Blend AI implements a full Azure DevOps CI/CD pipeline for all Power Platform solutions using the Microsoft Power Platform Build Tools extension. The pipeline includes:

Build Stage: Power Platform solution export (managed), solution checker analysis (zero critical issues required), automated unit test execution, and artifact publication.

Release Stage: Automated deployment to TEST on successful build. Manual gate for UAT promotion requiring QA Lead sign-off. Manual gate for PROD promotion requiring FDOC IT approval and Blend AI Project Manager sign-off.

Branch Strategy: GitFlow — feature branches for all development work, develop branch for integration, release branches for UAT, main branch for production. No direct commits to main or release branches.

C.2 CODE QUALITY STANDARDS

All Power Fx formulas are peer-reviewed before merging. Solution Checker must report zero High or Critical issues. Power Apps canvas apps follow Microsoft's Canvas App Coding Standards v2. Dataverse table and column names follow PascalCase convention with functional prefixes. Power Automate flows use descriptive names, error handling on all HTTP actions, and scope-based error branches.

C.3 TESTING STRATEGY

Unit Testing: Power Apps Test Studio automated tests for all critical screen navigation paths and business logic. Minimum 80% coverage of user stories.

Integration Testing: Postman collections for all API endpoints. Azure API Management test console for connectivity validation.

UAT: FDOC business users execute acceptance tests against UAT environment. Defects tracked in Azure DevOps Boards. No UAT sign-off until all Critical and High defects are resolved.

Regression Testing: Full regression suite executed before every production deployment. Automated via Azure Pipelines. Results stored in Azure Test Plans.

C.4 RELEASE MANAGEMENT

Production releases occur on scheduled maintenance windows (Saturdays 10 PM – 2 AM ET) to minimize business disruption. Pre-release checklist includes: backup verification, rollback plan confirmed, go/no-go meeting with FDOC IT, hypercare team on standby.

Rollback procedure: Power Platform solutions can be rolled back to the previous managed solution within 15 minutes. Azure Synapse schema changes are versioned with pre-/post-deployment scripts tested in UAT.

C.5 PERFORMANCE TESTING

Load tests are executed in the UAT environment using Azure Load Testing. Scenarios include: normal load (100 concurrent users, 1-hour test), peak load (500 concurrent users, 30-minute soak test), and stress test (ramp to 1,000 users to identify breaking point). Performance acceptance criteria: P95 response time < 3 seconds for all API calls; zero error rate under normal load.

TAB D — SECURITY AND COMPLIANCE

D.1 SECURITY FRAMEWORK

Blend AI's security approach is aligned with NIST SP 800-53 Rev. 5 and Florida Department of Management Services security standards. We implement defense-in-depth with controls at the network, identity, application, and data layers.

D.2 DATA PROTECTION

All FDOC data is stored exclusively within Azure US regions (East US 2 / West US 2). Data never leaves the continental United States. Encryption at rest uses AES-256 via Azure Storage Service Encryption with Microsoft-managed keys, with FDOC option to use customer-managed keys (CMK) in Azure Key Vault. Encryption in transit uses TLS 1.2 minimum (TLS 1.3 preferred).

D.3 ACCESS CONTROL

Access to all FDOC systems follows Zero Trust principles: verify explicitly, least privilege access, assume breach. Azure Active Directory enforces MFA for all users. Privileged Identity Management (PIM) provides Just-In-Time elevated access for administrators. All access is logged to Azure Monitor Logs with 1-year retention.

D.4 VULNERABILITY MANAGEMENT

Microsoft Defender for Cloud is enabled on all Azure subscriptions with Secure Score targets of 80+. Container images (if applicable) are scanned via Azure Container Registry vulnerability scanning. Power Platform Solution Checker is run on every build. Third-party penetration testing is offered as an optional add-on service.

D.5 INCIDENT RESPONSE

Blend AI maintains a documented Incident Response Plan (IRP) aligned with NIST SP 800-61. Security incidents are reported to FDOC IT Security within 1 hour of detection. All incidents are tracked in Azure Sentinel with automated playbooks for common scenarios (credential compromise, data exfiltration attempts, DDoS). Post-incident reviews are conducted within 5 business days.

D.6 COMPLIANCE

Florida Data Center Standards, Florida Cybersecurity Standards (FCSF), and FDOC-specific data governance requirements are incorporated into all solution designs. Blend AI's solutions are designed to support Florida's public records law requirements including audit logging, data retention, and eDiscovery readiness.

D.7 SECURITY TRAINING

All Blend AI project team members complete annual security awareness training. Developers complete secure coding training (OWASP Top 10, Power Platform-specific security patterns) before project start. Security review is a mandatory gate in the sprint definition of done.

TAB E — ORGANIZATIONAL CAPABILITY

E.1 COMPANY OVERVIEW

Blend AI Technologies, LLC is a technology services firm specializing in low-code application development, AI/ML integration, and cloud architecture. Founded to bridge the gap between enterprise-grade technology and practical business outcomes, Blend AI combines deep Microsoft ecosystem expertise with modern AI capabilities to deliver solutions that are scalable, maintainable, and cost-effective.

E.2 TEAM STRUCTURE

Project Manager: Oversees delivery, stakeholder communication, risk management, and contract compliance. PMP-certified, 10+ years delivering Microsoft technology projects for government clients.

Solution Architect: Designs overall technical architecture, makes technology decisions, and ensures platform governance. Microsoft Certified: Azure Solutions Architect Expert + Power Platform Solution Architect Expert.

Lead Developer (Power Platform): Leads all Power Apps, Power Automate, and Dataverse development. Microsoft Certified: Power Platform Developer Associate.

Senior Developer (Azure Integration): Responsible for API development, Azure integration services, and data pipelines. Microsoft Certified: Azure Developer Associate + Azure Integration Services.

Data Engineer: Manages Azure Synapse, Power BI development, and data migration. Microsoft Certified: Azure Data Engineer Associate.

QA Engineer: Owns test strategy, test automation, and UAT facilitation. Azure DevOps certification, Power Apps Test Studio proficiency.

E.3 KEY PERSONNEL

All key personnel are named, available, and committed to this engagement from contract award through project completion. Resumes are provided as Attachment A. No personnel substitutions will be made without prior written approval from FDOC Contract Manager.

E.4 SUBCONTRACTING APPROACH

Blend AI intends to self-perform 100% of the work described in this proposal. No subcontractors are planned. In the event a subcontractor is needed, Blend AI will obtain written approval from FDOC before engagement.

E.5 PAST PERFORMANCE

Blend AI has successfully delivered 12 Power Platform implementations over the past 3 years, with a combined contract value exceeding $4.2M. Client satisfaction ratings average 4.8/5.0 across all engagements. Three representative past performance examples are provided in Tab D (Client References).

GLOSSARY

ALM — Application Lifecycle Management
API — Application Programming Interface
APIM — Azure API Management
CAB — Change Advisory Board
CI/CD — Continuous Integration / Continuous Deployment
CMK — Customer-Managed Keys
CoE — Center of Excellence
CR — Change Request
Dataverse — Microsoft Dataverse (Power Platform data platform)
DLP — Data Loss Prevention
DWU — Data Warehouse Units (Azure Synapse scaling unit)
FDOC — Florida Department of Citrus
GIS — Geographic Information System
IRP — Incident Response Plan
JIT — Just-In-Time (access)
MFA — Multi-Factor Authentication
NIST — National Institute of Standards and Technology
OLTP — Online Transaction Processing
PIM — Privileged Identity Management (Azure AD)
PI — Program Increment (SAFe)
PMP — Project Management Professional (PMI certification)
RBAC — Role-Based Access Control
RFP — Request for Proposals
SAFe — Scaled Agile Framework
SAM.gov — System for Award Management
SFTP — Secure File Transfer Protocol
TLS — Transport Layer Security
UAT — User Acceptance Testing
UEI — Unique Entity Identifier

ARCHITECTURE APPENDIX

> [ARCHITECTURE APPENDIX — Detailed architecture diagrams including:
> 1. Four-Environment ALM Flow Diagram
> 2. Azure Hub-and-Spoke Data Architecture
> 3. Power Platform + Azure Synapse Integration Map
> 4. API Gateway and Security Layer Diagram
> 5. CI/CD Pipeline Flow (Azure DevOps)
> Provided as Exhibit B to this proposal.]

PROPOSAL FORMAT NOTES:
Cover Page: Include company name, UEI, CAGE code, RFP number, issuing agency, submission date, and authorized signature block.
Volume Structure: Separate business and technical volumes. Number tabs alphabetically within each volume.
Section Numbering: Use tab letter + number (A.1, A.2, B.1) for technical sections.
Tables: Use for price sheets, compliance matrices, staffing matrices, and risk registers.
Architecture Diagrams: Always include a labeled placeholder block in the exact format: [ARCHITECTURE DIAGRAM — description. Provided as separate Exhibit X.]
Glossary: One definition per line using bold term + em-dash format. Never use a table for glossary entries.
Pricing: Always provide line-item breakdown by phase or deliverable, then a Grand Total line.
References: Include outcome metrics (percentages, time savings, error rates) for every past performance entry.
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
    // knowledge_base_chunks lives in Supabase (admin access, pgvector pre-enabled)
    const SUPABASE_DB_URL            = Deno.env.get("SUPABASE_DB_URL") ?? "";

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      throw new Error("Azure OpenAI credentials not configured.");
    }
    if (!SUPABASE_DB_URL) {
      throw new Error("SUPABASE_DB_URL not configured.");
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
      {
        name: "Low-Code Application Development Proposal — Blend AI Technologies (RFP #25-03, Florida Dept. of Citrus)",
        category: "low_code_technical_proposal",
        text: BLEND_AI_LOW_CODE_PROPOSAL,
      },
    ];

    const client = new Client(SUPABASE_DB_URL);
    await client.connect();

    let totalChunks = 0;

    try {
      // Clear existing entries for these categories (idempotent re-seed)
      await client.queryObject(
        `DELETE FROM knowledge_base_chunks WHERE category IN ('loi_capability_statement','sources_sought_template','technical_proposal_reference','low_code_technical_proposal')`,
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
