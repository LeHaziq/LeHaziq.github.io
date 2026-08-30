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
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-submission
    publicationStatus: published
    publicClaim: A submission enters the peer-review record.
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-reviewer-assignment
    publicationStatus: published
    publicClaim: Reviewer assignment connects that record to its reviewer.
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-review
    publicationStatus: published
    publicClaim: The review records the assessment for the submission.
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-decision
    publicationStatus: published
    publicClaim: A decision records the outcome of peer review.
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-revision
    publicationStatus: published
    publicClaim: Revision returns the submission for its next version.
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
  - id: workflow-camera-ready-upload
    publicationStatus: published
    publicClaim: Camera-ready upload completes the record.
    evidenceType: repository
    provenance: Approved source and workflow documentation review
    attribution: MyConference peer-review workflow led by Muhammad Haziq Aiman Anuar
    publicationApproved: true
    qualifier: Source and documentation snapshot verified 30 August 2026
assets: []
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
    steps:
      - stage: call-for-papers
        evidenceReference: workflow-call-for-papers
      - stage: submission
        evidenceReference: workflow-submission
      - stage: reviewer-assignment
        evidenceReference: workflow-reviewer-assignment
      - stage: review
        evidenceReference: workflow-review
      - stage: decision
        evidenceReference: workflow-decision
      - stage: revision
        evidenceReference: workflow-revision
      - stage: camera-ready-upload
        evidenceReference: workflow-camera-ready-upload
---

This readable record is the complete source for the first two MyConference evidence passes.
