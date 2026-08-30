---
projectSlug: myconference
title: MyConference
projectType: featured
contextLabel: Featured project · Ongoing
timeframe: Ongoing
summary: MyConference is an ongoing, multi-tenant conference peer-review application. It covers the path from a call for papers and submission through reviewer assignment, review, decision, revision, and camera-ready upload.
role: Product and engineering lead for the current Laravel rebuild
attributionBoundary: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
technologies:
  - Laravel 13
  - PHP 8.3 or later
  - PostgreSQL 16
  - Blade
  - Tailwind CSS
  - Alpine.js
  - Vite
  - PHPUnit
  - Node tests
  - Playwright
displayOrder: 0
publicationStatus: published
links: []
evidence:
  - id: application-scope
    publicationStatus: published
    publicClaim: MyConference is an ongoing, multi-tenant conference peer-review application. It covers the path from a call for papers and submission through reviewer assignment, review, decision, revision, and camera-ready upload.
    evidenceType: repository
    provenance: Approved source and documentation review
    attribution: MyConference product scope led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: ownership-boundary
    publicationStatus: published
    publicClaim: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    evidenceType: repository
    provenance: Approved ownership statement corroborated by repository history
    attribution: Muhammad Haziq Aiman Anuar, with earlier prototype contributions and AI-assisted development acknowledged
    publicationApproved: true
    qualifier: Repository history and ownership statement verified 30 August 2026
  - id: peer-review-problem
    publicationStatus: published
    publicClaim: Multi-tenant peer review is the Portfolio's deepest evidence because it joins Organisations, Conference-scoped roles, confidential material, deadlines, and decisions in one application.
    evidenceType: repository
    provenance: Approved source, architecture, and workflow documentation review
    attribution: MyConference product and engineering work led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: verified-stack
    publicationStatus: published
    publicClaim: The verified implementation boundary is Laravel 13, PHP 8.3 or later, PostgreSQL 16 with forced row-level security, server-rendered Blade, Tailwind CSS, Alpine.js, Vite, PHPUnit against PostgreSQL, Node tests, and Playwright browser tests.
    evidenceType: repository
    provenance: Approved dependency, configuration, and test-suite review
    attribution: Current MyConference Laravel rebuild
    publicationApproved: true
    qualifier: Source snapshot verified 30 August 2026
  - id: accessibility-and-pilot
    publicationStatus: published
    publicClaim: MyConference has a self-assessed WCAG 2.2 AA baseline and operates as an Authorized pilot.
    evidenceType: public-page
    provenance: Approved implementation review and deployment verification
    attribution: MyConference accessibility baseline and pilot operation led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Baseline and Authorized pilot status verified 30 August 2026
  - id: workflow-call-for-papers
    publicationStatus: published
    publicClaim: The workflow opens with a call for papers.
    publicCaption: Call for papers
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-submission
    publicationStatus: published
    publicClaim: A submission enters the peer-review record.
    publicCaption: Submission
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-reviewer-assignment
    publicationStatus: published
    publicClaim: Reviewer assignment connects that record to its reviewer.
    publicCaption: Reviewer assignment
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-review
    publicationStatus: published
    publicClaim: The review records the assessment for the submission.
    publicCaption: Review
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-decision
    publicationStatus: published
    publicClaim: A decision records the outcome of peer review.
    publicCaption: Decision
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-revision
    publicationStatus: published
    publicClaim: Revision returns the submission for its next version.
    publicCaption: Revision
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-camera-ready-upload
    publicationStatus: published
    publicClaim: Camera-ready upload completes the record.
    publicCaption: Camera-ready upload
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: tenant-table-ownership
    publicationStatus: published
    publicClaim: Every tenant table carries organisation_id to record its Organisation ownership.
    evidenceType: repository
    provenance: Approved tenant-table source and schema review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: composite-tenant-keys
    publicationStatus: published
    publicClaim: Composite Conference and Organisation keys prevent mismatched pairs.
    evidenceType: repository
    provenance: Approved schema, constraint, and tenancy-test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: application-tenant-scopes
    publicationStatus: published
    publicClaim: Application scopes enforce the application-layer tenant boundary.
    evidenceType: repository
    provenance: Approved application scope and tenancy-test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: forced-row-level-security
    publicationStatus: published
    publicClaim: Forced PostgreSQL row-level security protects raw queries.
    evidenceType: repository
    provenance: Approved database policy and privilege-test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: missing-organisation-context
    publicationStatus: published
    publicClaim: Missing Organisation context returns no tenant rows.
    evidenceType: repository
    provenance: Approved missing-context source and test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: cross-tenant-not-found
    publicationStatus: published
    publicClaim: Cross-tenant requests return 404.
    evidenceType: repository
    provenance: Approved request-boundary source and test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: confidential-access
    publicationStatus: published
    publicClaim: Organisation ownership does not grant confidential access; an audited Conference Chair Role Assignment does.
    evidenceType: repository
    provenance: Approved role, policy, and confidential-access test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: decision-corrections
    publicationStatus: published
    publicClaim: Decision corrections add new Decision rows.
    evidenceType: repository
    provenance: Approved decision-history source and test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: revoked-role-assignments
    publicationStatus: published
    publicClaim: Revoked role assignments preserve their original rows.
    evidenceType: repository
    provenance: Approved role-assignment history source and test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: immutable-audit-events
    publicationStatus: published
    publicClaim: Audit events cannot be updated or deleted.
    evidenceType: repository
    provenance: Approved audit-event source, database, and test review
    attribution: I inherited an earlier prototype and led the current Laravel-based MyConference rebuild. I made the final product and engineering decisions while using AI-assisted development tools.
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: historical-test-optimization
    publicationStatus: published
    publicClaim: >-
      Reduced MyConference's passing serial PHP test run from 1,013 seconds to 664 seconds by matching database reset strategies to test behavior, while retaining migration-backed checks for schema and privilege changes. Both comparison runs passed; fresh migrations fell from 120 to 14, tests changed from 1,218 to 1,147 after duplicate removal, and assertions changed from 11,081 to 10,986 after duplicate removal.
    publicCaption: 34.5% lower
    evidenceType: measurement
    provenance: Approved dated serial PHP test-suite comparison
    attribution: MyConference PHP test-suite optimization led by Muhammad Haziq Aiman Anuar within the current Laravel rebuild.
    publicationApproved: true
    qualifier: Measured on 29 August 2026
  - id: conference-home-desktop-visual
    publicationStatus: published
    publicClaim: A fresh desktop-width runtime capture records the current MyConference Conference home with an unmistakably fictional Organisation, Conference, papers, counts, account, and 2099 dates.
    evidenceType: runtime-capture
    provenance: Fresh local capture of the current MyConference runtime using an isolated fictional dataset
    attribution: Current MyConference runtime interface led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Runtime captured 30 August 2026
    assetReference: conference-home-desktop
    publicCaption: Current Conference home at desktop width
    alternativeText: MyConference Conference overview at desktop width with fictional Clockwork Kites Guild data, four work items, three responsibility summaries, and 2099 deadlines.
  - id: conference-home-phone-visual
    publicationStatus: published
    publicClaim: A fresh phone-width runtime capture records the same fictional MyConference Conference home in its current responsive layout.
    evidenceType: runtime-capture
    provenance: Fresh local capture of the current MyConference runtime using the same isolated fictional dataset as the desktop capture
    attribution: Current MyConference responsive interface led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Runtime captured 30 August 2026
    assetReference: conference-home-phone
    publicCaption: Current Conference home at phone width
    alternativeText: MyConference Conference overview at phone width with fictional Clockwork Kites Guild data and the same 2099 work queue reflowed into one column.
  - id: tenant-isolation-visual
    publicationStatus: published
    publicClaim: The tenant-isolation diagram explains the approved application and database boundaries without adding claims beyond the verified MyConference evidence.
    evidenceType: diagram
    provenance: Original Portfolio diagram derived from the approved MyConference architecture evidence
    attribution: MyConference tenant-isolation decisions led by Muhammad Haziq Aiman Anuar; diagram authored for this Portfolio
    publicationApproved: true
    assetReference: tenant-isolation-diagram
    publicCaption: Tenant isolation, in layers
    alternativeText: Diagram showing Organisation context and Eloquent scopes before forced PostgreSQL row-level security; tenant tables carry organisation_id, composite Conference and Organisation keys must match, missing context returns no rows, cross-tenant requests return 404, and ownership alone does not grant confidential access, which requires an audited Conference Chair Role Assignment.
assets:
  - id: conference-home-desktop
    path: src/assets/projects/myconference/conference-home-desktop.png
    kind: runtime-capture
    ownerOrProvenance: Fresh current-runtime capture prepared for Muhammad Haziq Aiman Anuar on 30 August 2026
    publicationApproved: true
    caption: Current Conference home at desktop width
    alternativeText: MyConference Conference overview at desktop width with fictional Clockwork Kites Guild data, four work items, three responsibility summaries, and 2099 deadlines.
    evidenceReferences:
      - conference-home-desktop-visual
    fictionalDataCheck: confirmed
    decorative: false
  - id: conference-home-phone
    path: src/assets/projects/myconference/conference-home-phone.png
    kind: runtime-capture
    ownerOrProvenance: Fresh current-runtime capture prepared for Muhammad Haziq Aiman Anuar on 30 August 2026
    publicationApproved: true
    caption: Current Conference home at phone width
    alternativeText: MyConference Conference overview at phone width with fictional Clockwork Kites Guild data and the same 2099 work queue reflowed into one column.
    evidenceReferences:
      - conference-home-phone-visual
    fictionalDataCheck: confirmed
    decorative: false
  - id: tenant-isolation-diagram
    path: src/assets/projects/myconference/tenant-isolation.svg
    kind: diagram
    ownerOrProvenance: Original Portfolio diagram authored from approved MyConference architecture evidence
    publicationApproved: true
    caption: Tenant isolation, in layers
    alternativeText: Diagram showing Organisation context and Eloquent scopes before forced PostgreSQL row-level security; tenant tables carry organisation_id, composite Conference and Organisation keys must match, missing context returns no rows, cross-tenant requests return 404, and ownership alone does not grant confidential access, which requires an audited Conference Chair Role Assignment.
    evidenceReferences:
      - tenant-isolation-visual
      - tenant-table-ownership
      - composite-tenant-keys
      - application-tenant-scopes
      - forced-row-level-security
      - missing-organisation-context
      - cross-tenant-not-found
      - confidential-access
    fictionalDataCheck: not-applicable
    decorative: false
blocks:
  - type: narrative
    heading: "MyConference: ownership and problem"
    evidenceReferences:
      - application-scope
      - ownership-boundary
      - peer-review-problem
      - verified-stack
      - accessibility-and-pilot
  - type: workflow
    heading: "MyConference: workflow"
    stepEvidenceReferences:
      - workflow-call-for-papers
      - workflow-submission
      - workflow-reviewer-assignment
      - workflow-review
      - workflow-decision
      - workflow-revision
      - workflow-camera-ready-upload
  - type: engineering-decision
    situation: Tenant data had to remain isolated across application and database access paths.
    choice: Every tenant table carries organisation_id; composite Conference and Organisation keys prevent mismatches; application scopes enforce the application boundary; and forced PostgreSQL row-level security protects raw queries.
    rationale: The application and database boundaries cover different access paths.
    result: Missing Organisation context returns no tenant rows, and cross-tenant requests return 404.
    evidenceReferences:
      - tenant-table-ownership
      - composite-tenant-keys
      - application-tenant-scopes
      - forced-row-level-security
      - missing-organisation-context
      - cross-tenant-not-found
  - type: verified-fact
    evidenceReferences:
      - tenant-table-ownership
  - type: verified-fact
    evidenceReferences:
      - composite-tenant-keys
  - type: verified-fact
    evidenceReferences:
      - application-tenant-scopes
  - type: verified-fact
    evidenceReferences:
      - forced-row-level-security
  - type: verified-fact
    evidenceReferences:
      - missing-organisation-context
  - type: verified-fact
    evidenceReferences:
      - cross-tenant-not-found
  - type: engineering-decision
    situation: Organisation ownership and access to confidential Conference material are separate responsibilities.
    choice: Organisation ownership does not grant confidential access. An audited Conference Chair Role Assignment grants it.
    rationale: Conference-scoped assignments keep privileged access explicit and reviewable.
    result: Confidential access follows the audited role assignment, not tenant ownership.
    evidenceReferences:
      - confidential-access
  - type: verified-fact
    evidenceReferences:
      - confidential-access
  - type: engineering-decision
    situation: Operational corrections and revocations had to preserve the earlier record.
    choice: Decision corrections add new Decision rows, revoked role assignments preserve their original rows, and audit events cannot be updated or deleted.
    rationale: Append-only history keeps the sequence of actions available for audit.
    result: The current state can change without erasing the earlier decision, assignment, or event.
    evidenceReferences:
      - decision-corrections
      - revoked-role-assignments
      - immutable-audit-events
  - type: verified-fact
    evidenceReferences:
      - decision-corrections
  - type: verified-fact
    evidenceReferences:
      - revoked-role-assignments
  - type: verified-fact
    evidenceReferences:
      - immutable-audit-events
  - type: metric
    comparison: 1,013 seconds to 664 seconds
    unit: seconds
    qualifier: Measured on 29 August 2026
    evidenceReference: historical-test-optimization
  - type: media
    assetReference: conference-home-desktop
    presentation: lead
  - type: media
    assetReference: conference-home-phone
    presentation: phone
  - type: media
    assetReference: tenant-isolation-diagram
    presentation: supporting
---

This readable record is the complete source for the MyConference evidence passes, historical optimization, and approved visual evidence.
