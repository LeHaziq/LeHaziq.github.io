import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

import {
  featuredBlockSchema,
  projectSchema,
  selectPublishedProjects,
} from "../src/content/project-schema.ts";

const execFileAsync = promisify(execFile);
const repositoryRoot = new URL("../", import.meta.url);
const generatedRootPage = new URL("../dist/index.html", import.meta.url);
const projectFixturePath = new URL(
  "../src/content/projects/test-fixture.md",
  import.meta.url,
);

function academicProject(overrides = {}) {
  return {
    projectSlug: "fixture-project",
    title: "Fixture project",
    projectType: "academic",
    contextLabel: "Academic project · UiTM · 2026",
    timeframe: "2026",
    summary: "A fixture project used at the public authoring boundary.",
    role: "Academic researcher",
    attributionBoundary: "Fixture evidence only.",
    technologies: ["Fixture technology"],
    displayOrder: 99,
    publicationStatus: "published",
    links: [],
    evidence: [
      {
        id: "fixture-evidence",
        publicationStatus: "published",
        publicClaim: "A fixture claim.",
        evidenceType: "resume",
        provenance: "Approved fixture",
        attribution: "Muhammad Haziq Aiman Anuar",
        publicationApproved: true,
      },
    ],
    assets: [],
    academic: {
      problem: "A fixture problem.",
      approach: "A fixture approach.",
      outcome: "A fixture outcome.",
      evidenceReferences: ["fixture-evidence"],
    },
    ...overrides,
  };
}

function validationMessages(result) {
  assert.equal(result.success, false);
  return result.error.issues.map((issue) => issue.message).join("\n");
}

function markdownRecord(project) {
  return `---\n${JSON.stringify(project, null, 2)}\n---\n\nTest fixture.\n`;
}

async function build() {
  return execFileAsync("npm", ["run", "build"], { cwd: repositoryRoot });
}

async function expectBuildFailure(project, expectedMessage) {
  await writeFile(projectFixturePath, markdownRecord(project));

  try {
    await assert.rejects(build(), (error) => {
      assert.match(`${error.stdout}\n${error.stderr}`, expectedMessage);
      return true;
    });
  } finally {
    await rm(projectFixturePath, { force: true });
  }
}

test("the Portfolio publishes the first MyConference evidence pass", async () => {
  const rootPage = await readFile(generatedRootPage, "utf8");
  const introductionIndex = rootPage.indexOf("introduction-section");
  const featuredIndex = rootPage.indexOf('id="myconference"');
  const academicIndex = rootPage.indexOf('class="academic-projects"');
  const featuredEnd = rootPage.indexOf("</section>", featuredIndex);
  const featuredPass = rootPage.slice(featuredIndex, featuredEnd);

  assert.ok(featuredIndex > introductionIndex);
  assert.ok(academicIndex > featuredIndex);
  assert.match(
    featuredPass,
    /<h2[^>]*>MyConference: ownership and problem<\/h2>/,
  );
  assert.match(
    featuredPass,
    /MyConference is an ongoing, multi-tenant conference peer-review application\. It covers the path from a call for papers and submission through reviewer assignment, review, decision, revision, and camera-ready upload\./,
  );
  assert.match(
    featuredPass,
    /I inherited an earlier prototype and led the current Laravel-based MyConference rebuild\. I made the final product and engineering decisions while using AI-assisted development tools\./,
  );
  assert.match(featuredPass, /Portfolio(?:'|&#39;)s deepest evidence/);
  assert.match(featuredPass, /Organisations/);
  assert.match(featuredPass, /Conference-scoped roles/);
  assert.match(featuredPass, /confidential material/);
  assert.match(featuredPass, /deadlines/);
  assert.match(featuredPass, /decisions/);
  assert.match(featuredPass, /Laravel/);
  assert.match(featuredPass, /PHP/);
  assert.match(featuredPass, /PostgreSQL/);
  assert.match(featuredPass, /Blade/);
  assert.match(featuredPass, /Tailwind CSS/);
  assert.match(featuredPass, /Alpine\.js/);
  assert.match(featuredPass, /Vite/);
  assert.match(featuredPass, /PHPUnit/);
  assert.match(featuredPass, /Node tests/);
  assert.match(featuredPass, /Playwright/);
  assert.match(featuredPass, /self-assessed WCAG 2\.2 AA baseline/);
  assert.match(featuredPass, /Authorized pilot/);
  assert.doesNotMatch(featuredPass, /myconference\.my|UMT|IMTC/);
  for (const evidenceId of [
    "application-scope",
    "ownership-boundary",
    "peer-review-problem",
    "verified-stack",
    "accessibility-and-pilot",
  ]) {
    assert.match(
      featuredPass,
      new RegExp(`id="myconference-evidence-${evidenceId}"`),
    );
  }
});

test("the Portfolio publishes the complete MyConference workflow in document order", async () => {
  const rootPage = await readFile(generatedRootPage, "utf8");
  const ownershipIndex = rootPage.indexOf('id="myconference"');
  const workflowIndex = rootPage.indexOf('id="myconference-workflow"');
  const academicIndex = rootPage.indexOf('class="academic-projects"');
  const workflowEnd = rootPage.indexOf("</section>", workflowIndex);
  const workflowPass = rootPage.slice(workflowIndex, workflowEnd);
  const stages = [
    "Call for papers",
    "Submission",
    "Reviewer assignment",
    "Review",
    "Decision",
    "Revision",
    "Camera-ready upload",
  ];

  assert.ok(workflowIndex > ownershipIndex);
  assert.ok(academicIndex > workflowIndex);
  assert.match(
    workflowPass,
    /<h2[^>]*>MyConference: workflow<\/h2>/,
  );
  assert.match(workflowPass, /<ol class="workflow-list">/);

  let previousStageIndex = -1;
  for (const stage of stages) {
    const stageIndex = workflowPass.indexOf(`<h3>${stage}</h3>`);
    assert.ok(stageIndex > previousStageIndex, `${stage} is out of order`);
    previousStageIndex = stageIndex;
  }

  assert.doesNotMatch(
    workflowPass,
    /<script\b|<button\b|<details\b|role="tab"|aria-expanded=/i,
  );
});

test("the project schema rejects prohibited MyConference publication claims", () => {
  const privateSourceUrl = [
    "https://github.com",
    "LeHaziq",
    "Conference-Management-System",
  ].join("/");
  const prohibitedClaims = [
    "MyConference is a public demo.",
    "MyConference serves a production customer.",
    "MyConference has broad adoption.",
    "Register for MyConference today.",
    "The public repository proves the implementation.",
    "MyConference passed an external accessibility audit.",
    "MyConference has current green CI.",
    "MyConference CI currently passes.",
    "Cloudflare cannot access submission PDFs.",
    "I am the sole author of MyConference.",
    "The Authorized pilot is operated with UMT for IMTC.",
    "Decorative review marks prove reviewer activity.",
    `The source repository is ${privateSourceUrl}.`,
  ];

  for (const publicClaim of prohibitedClaims) {
    const project = {
      ...academicProject(),
      projectSlug: "myconference",
      projectType: "featured",
      evidence: [
        {
          ...academicProject().evidence[0],
          publicClaim,
        },
      ],
      blocks: [
        {
          type: "narrative",
          heading: "Ownership and problem",
          evidenceReferences: ["fixture-evidence"],
        },
      ],
    };
    delete project.academic;

    assert.match(
      validationMessages(projectSchema.safeParse(project)),
      /Prohibited MyConference publication claim/,
      publicClaim,
    );
  }

  const projectWithPilotLink = {
    ...academicProject(),
    projectSlug: "myconference",
    projectType: "featured",
    links: [
      {
        label: "Pilot",
        destination: "https://myconference.my/",
        purpose: "Authorized pilot",
        publicationApproved: true,
      },
    ],
    blocks: [
      {
        type: "narrative",
        heading: "Ownership and problem",
        evidenceReferences: ["fixture-evidence"],
      },
    ],
  };
  delete projectWithPilotLink.academic;

  assert.match(
    validationMessages(projectSchema.safeParse(projectWithPilotLink)),
    /MyConference pilot link requires recorded promotion approval/,
  );

  projectWithPilotLink.links[0] = {
    label: "Source",
    destination: privateSourceUrl,
    purpose: "Public source proof",
    publicationApproved: true,
  };

  assert.match(
    validationMessages(projectSchema.safeParse(projectWithPilotLink)),
    /Prohibited MyConference publication claim/,
  );
});

test("the generated Portfolio omits prohibited MyConference claims", async () => {
  const rootPage = await readFile(generatedRootPage, "utf8");
  const privateSourcePattern = new RegExp(
    ["github\\.com", "LeHaziq", "Conference-Management-System"].join("\\/"),
    "i",
  );
  const prohibitedOutput = [
    /public demo/i,
    /production customer/i,
    /(?:broad adoption|broadly adopted)/i,
    /\b(?:register|sign up|create an account)\b/i,
    /(?:public|open-source) (?:repository|repo|source code)/i,
    /(?:(?:external|independent) accessibility audit|externally audited)/i,
    /(?:current(?:ly)? (?:green|passing) CI|CI (?:is )?(?:currently )?(?:green|passing|passes))/i,
    /Cloudflare[^.]+(?:PDF|submission)/i,
    /sole (?:author|authorship|creator|developer)/i,
    /\b(?:UMT|IMTC)\b/,
    /(?:fabricated (?:reviewer|review|manuscript) material|decorative (?:review|reviewer) marks?|manuscript[- ]rating material)/i,
    /myconference\.my/i,
    privateSourcePattern,
  ];

  for (const pattern of prohibitedOutput) {
    assert.doesNotMatch(rootPage, pattern);
  }
});

test("the Portfolio publishes the Academic projects in the approved order", async () => {
  const rootPage = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );

  const convnextIndex = rootPage.indexOf(
    "Facial Action Unit Detection using ConvNeXt V2",
  );
  const attendanceIndex = rootPage.indexOf(
    "AI-Driven Automated Attendance Tracking System",
  );

  assert.match(rootPage, /Academic projects/);
  assert.ok(convnextIndex > -1);
  assert.ok(attendanceIndex > convnextIndex);
  assert.match(rootPage, /Computer Vision Research Project · UiTM · 2026/);
  assert.match(
    rootPage,
    /Fine-tuned ConvNeXt V2 Base on DISFA with ImageNet-FCMAE pretraining, subject-disjoint three-fold cross-validation, and class-imbalance handling\./,
  );
  assert.match(rootPage, /Reported held-out means/);
  assert.match(rootPage, /35\.1%/);
  assert.match(rootPage, /mean AU-F1/);
  assert.match(rootPage, /46\.8%/);
  assert.match(rootPage, /mean micro-F1/);
  assert.match(rootPage, /Final Year Project · UiTM · 2024/);
  assert.match(
    rootPage,
    /A Python desktop system for real-time face detection and recognition, schedules, enrolment records, attendance logs, and attendance queries\./,
  );

  const attendanceEntry = rootPage.slice(
    attendanceIndex,
    rootPage.indexOf("</article>", attendanceIndex),
  );
  const technologies = [
    ...attendanceEntry.matchAll(/<li>([^<]+)<\/li>/g),
  ].map((match) => match[1]);

  assert.deepEqual(technologies, [
    "Python",
    "OpenCV",
    "Tkinter",
    "YOLOv8n",
    "FaceNet",
    "MySQL",
  ]);
  assert.equal(
    [...rootPage.matchAll(/<p class="project-type">Academic project<\/p>/g)]
      .length,
    2,
  );
  assert.doesNotMatch(
    rootPage,
    /PyTorch|commercial deployment|public paper|repository|model card|demo|diagram|screenshot/i,
  );
});

test("the project schema rejects missing required fields", () => {
  const project = academicProject();
  delete project.summary;

  const messages = validationMessages(projectSchema.safeParse(project));

  assert.match(messages, /Project summary is required|expected string/i);
});

test("the schema represents every approved Featured project block", () => {
  const project = academicProject({
    projectType: "featured",
    links: [
      {
        label: "Pilot",
        destination: "https://example.com/pilot",
        purpose: "pilot",
        publicationApproved: true,
      },
    ],
    assets: [
      {
        id: "tenant-diagram",
        path: "src/assets/projects/tenant-diagram.svg",
        kind: "diagram",
        ownerOrProvenance: "Original Portfolio diagram",
        publicationApproved: true,
        caption: "Tenant isolation boundaries.",
        alternativeText: "A tenant isolation boundary diagram.",
        evidenceReferences: ["fixture-evidence"],
        fictionalDataCheck: "not-applicable",
        decorative: false,
      },
    ],
    blocks: [
      {
        type: "narrative",
        heading: "Ownership and problem",
        evidenceReferences: ["fixture-evidence"],
      },
      {
        type: "workflow",
        heading: "Review workflow",
        steps: [
          { stage: "call-for-papers", evidenceReference: "fixture-evidence" },
          { stage: "submission", evidenceReference: "fixture-evidence" },
          { stage: "reviewer-assignment", evidenceReference: "fixture-evidence" },
          { stage: "review", evidenceReference: "fixture-evidence" },
          { stage: "decision", evidenceReference: "fixture-evidence" },
          { stage: "revision", evidenceReference: "fixture-evidence" },
          { stage: "camera-ready-upload", evidenceReference: "fixture-evidence" },
        ],
      },
      {
        type: "engineering-decision",
        situation: "Tenant data needed isolation.",
        choice: "Apply database and application boundaries.",
        rationale: "Each layer covers a different access path.",
        result: "Cross-tenant requests return no protected data.",
        evidenceReferences: ["fixture-evidence"],
      },
      {
        type: "verified-fact",
        evidenceReferences: ["fixture-evidence"],
      },
      {
        type: "metric",
        comparison: "1013 to 664",
        unit: "seconds",
        qualifier: "Measured 29 August 2026",
        evidenceReference: "fixture-evidence",
      },
      {
        type: "media",
        assetReference: "tenant-diagram",
        caption: "Tenant isolation boundaries.",
        alternativeText: "A tenant isolation boundary diagram.",
        evidenceReferences: ["fixture-evidence"],
      },
    ],
  });
  delete project.academic;

  assert.equal(projectSchema.safeParse(project).success, true);
});

test("Featured workflow blocks reject stages outside the approved order", () => {
  const steps = [
    { stage: "call-for-papers", evidenceReference: "fixture-evidence" },
    { stage: "submission", evidenceReference: "fixture-evidence" },
    { stage: "reviewer-assignment", evidenceReference: "fixture-evidence" },
    { stage: "review", evidenceReference: "fixture-evidence" },
    { stage: "decision", evidenceReference: "fixture-evidence" },
    { stage: "revision", evidenceReference: "fixture-evidence" },
    { stage: "camera-ready-upload", evidenceReference: "fixture-evidence" },
  ];
  [steps[3], steps[4]] = [steps[4], steps[3]];

  const result = featuredBlockSchema.safeParse({
    type: "workflow",
    heading: "Review workflow",
    steps,
  });

  assert.match(validationMessages(result), /approved workflow order/i);
});

test("Featured workflow blocks keep public claims in evidence records", () => {
  const result = featuredBlockSchema.safeParse({
    type: "workflow",
    heading: "Review workflow",
    steps: [
      {
        stage: "call-for-papers",
        evidenceReference: "fixture-evidence",
        claim: "A duplicated public claim.",
      },
    ],
  });

  assert.match(validationMessages(result), /Unrecognized key.*claim/);
});

test("Featured narrative blocks keep public claims in evidence records", () => {
  const result = featuredBlockSchema.safeParse({
    type: "narrative",
    heading: "Ownership and problem",
    body: "A duplicated public claim.",
    evidenceReferences: ["fixture-evidence"],
  });

  assert.match(validationMessages(result), /Unrecognized key.*body/);
});

test("the project schema rejects unknown Featured project blocks", () => {
  const project = {
    ...academicProject(),
    projectType: "featured",
    blocks: [
      {
        type: "testimonial",
        evidenceReferences: ["fixture-evidence"],
      },
    ],
  };
  delete project.academic;

  const messages = validationMessages(projectSchema.safeParse(project));

  assert.match(messages, /Unknown Featured project block type/);
});

test("the project schema rejects invalid or unapproved links", () => {
  const invalidLink = academicProject({
    links: [
      {
        label: "Source",
        destination: "private-repository",
        purpose: "source",
        publicationApproved: true,
      },
    ],
  });
  const unapprovedLink = academicProject({
    links: [
      {
        label: "Source",
        destination: "https://example.com/source",
        purpose: "source",
        publicationApproved: false,
      },
    ],
  });

  assert.match(
    validationMessages(projectSchema.safeParse(invalidLink)),
    /valid absolute URL/,
  );
  assert.match(
    validationMessages(projectSchema.safeParse(unapprovedLink)),
    /Project links require publication approval/,
  );
});

test("the project schema rejects claims missing required qualifiers", () => {
  const project = academicProject();
  project.evidence[0].evidenceType = "measurement";

  const messages = validationMessages(projectSchema.safeParse(project));

  assert.match(messages, /measurement evidence requires a date or snapshot qualifier/);
});

test("the project schema rejects unapproved assets", () => {
  const project = academicProject({
    assets: [
      {
        id: "fixture-image",
        path: "src/assets/projects/fixture.png",
        kind: "image",
        ownerOrProvenance: "Approved fixture",
        publicationApproved: false,
        caption: "Fixture image.",
        alternativeText: "A fixture image.",
        evidenceReferences: ["fixture-evidence"],
        fictionalDataCheck: "not-applicable",
        decorative: false,
      },
    ],
  });

  const messages = validationMessages(projectSchema.safeParse(project));

  assert.match(messages, /Project assets require publication approval/);
});

test("project publication rejects duplicate slugs", () => {
  const first = projectSchema.parse(academicProject());
  const second = projectSchema.parse(academicProject({ title: "Second fixture" }));

  assert.throws(
    () =>
      selectPublishedProjects([
        { id: "first.md", data: first },
        { id: "second.md", data: second },
      ]),
    /Duplicate project slug "fixture-project" in first\.md and second\.md/,
  );
});

test("project publication rejects missing evidence references", () => {
  const project = projectSchema.parse(
    academicProject({
      academic: {
        problem: "A fixture problem.",
        approach: "A fixture approach.",
        outcome: "A fixture outcome.",
        evidenceReferences: ["missing-evidence"],
      },
    }),
  );

  assert.throws(
    () => selectPublishedProjects([{ id: "fixture.md", data: project }]),
    /references missing evidence "missing-evidence"/,
  );
});

test("project publication rejects workflow references to draft evidence", () => {
  const project = projectSchema.parse({
    ...academicProject(),
    projectType: "featured",
    evidence: [
      ...academicProject().evidence,
      {
        id: "draft-workflow-evidence",
        publicationStatus: "draft",
        publicClaim: "Draft workflow claim.",
        evidenceType: "repository",
        provenance: "Unapproved fixture",
        attribution: "Fixture only",
        publicationApproved: false,
        qualifier: "Fixture snapshot",
      },
    ],
    blocks: [
      {
        type: "workflow",
        heading: "Review workflow",
        steps: [
          { stage: "call-for-papers", evidenceReference: "draft-workflow-evidence" },
          { stage: "submission", evidenceReference: "fixture-evidence" },
          { stage: "reviewer-assignment", evidenceReference: "fixture-evidence" },
          { stage: "review", evidenceReference: "fixture-evidence" },
          { stage: "decision", evidenceReference: "fixture-evidence" },
          { stage: "revision", evidenceReference: "fixture-evidence" },
          { stage: "camera-ready-upload", evidenceReference: "fixture-evidence" },
        ],
      },
    ],
    academic: undefined,
  });

  assert.throws(
    () => selectPublishedProjects([{ id: "fixture.md", data: project }]),
    /references draft evidence "draft-workflow-evidence"/,
  );
});

test("project publication rejects assets with missing evidence references", () => {
  const project = projectSchema.parse(
    academicProject({
      assets: [
        {
          id: "fixture-image",
          path: "src/assets/projects/fixture.png",
          kind: "image",
          ownerOrProvenance: "Approved fixture",
          publicationApproved: true,
          caption: "Fixture image.",
          alternativeText: "A fixture image.",
          evidenceReferences: ["missing-evidence"],
          fictionalDataCheck: "not-applicable",
          decorative: false,
        },
      ],
    }),
  );

  assert.throws(
    () => selectPublishedProjects([{ id: "fixture.md", data: project }]),
    /asset "fixture-image" references missing evidence "missing-evidence"/,
  );
});

test("project publication excludes draft projects and evidence", () => {
  const published = projectSchema.parse(
    academicProject({
      evidence: [
        ...academicProject().evidence,
        {
          id: "draft-evidence",
          publicationStatus: "draft",
          publicClaim: "This draft claim must not publish.",
          evidenceType: "resume",
          provenance: "Unapproved fixture",
          attribution: "Muhammad Haziq Aiman Anuar",
          publicationApproved: false,
        },
      ],
    }),
  );
  const draft = projectSchema.parse(
    academicProject({
    projectSlug: "draft-project",
      publicationStatus: "draft",
    }),
  );

  const result = selectPublishedProjects([
    { id: "published.md", data: published },
    { id: "draft.md", data: draft },
  ]);

  assert.deepEqual(result.map((project) => project.projectSlug), ["fixture-project"]);
  assert.deepEqual(
    result[0].evidence.map((evidence) => evidence.id),
    ["fixture-evidence"],
  );
});

test("a draft project may reference its draft evidence without publishing", () => {
  const project = projectSchema.parse(
    academicProject({
      projectSlug: "draft-project",
      publicationStatus: "draft",
      evidence: [
        {
          id: "draft-evidence",
          publicationStatus: "draft",
          publicClaim: "This draft claim must not publish.",
          evidenceType: "resume",
          provenance: "Unapproved fixture",
          attribution: "Muhammad Haziq Aiman Anuar",
          publicationApproved: false,
        },
      ],
      academic: {
        problem: "A draft fixture problem.",
        approach: "A draft fixture approach.",
        outcome: "A draft fixture outcome.",
        evidenceReferences: ["draft-evidence"],
      },
    }),
  );

  assert.deepEqual(
    selectPublishedProjects([{ id: "draft.md", data: project }]),
    [],
  );
});

test("Astro excludes draft projects and draft evidence from generated output", async () => {
  const draftClaim = "Unpublished evidence must stay out of generated output.";
  const project = academicProject({
    projectSlug: "draft-build-fixture",
    title: "Unpublished Academic project",
    publicationStatus: "draft",
    evidence: [
      {
        id: "draft-evidence",
        publicationStatus: "draft",
        publicClaim: draftClaim,
        evidenceType: "resume",
        provenance: "Unapproved fixture",
        attribution: "Muhammad Haziq Aiman Anuar",
        publicationApproved: false,
      },
    ],
    academic: {
      problem: "A draft fixture problem.",
      approach: "A draft fixture approach.",
      outcome: "A draft fixture outcome.",
      evidenceReferences: ["draft-evidence"],
    },
  });
  await writeFile(projectFixturePath, markdownRecord(project));

  try {
    await build();
    const output = await readFile(generatedRootPage, "utf8");
    assert.doesNotMatch(output, /Unpublished Academic project/);
    assert.doesNotMatch(output, new RegExp(draftClaim));
  } finally {
    await rm(projectFixturePath, { force: true });
  }
});

test("Astro rejects invalid project records with useful errors", async (context) => {
  await context.test("duplicate slugs", async () => {
    await expectBuildFailure(
      academicProject({
        projectSlug: "convnext-v2-facial-action-unit-detection",
      }),
      /Duplicate project slug "convnext-v2-facial-action-unit-detection"/,
    );
  });

  await context.test("missing required fields", async () => {
    const project = academicProject();
    delete project.summary;
    await expectBuildFailure(project, /summary.*Required/i);
  });

  await context.test("unknown Featured project blocks", async () => {
    const project = {
      ...academicProject(),
      projectType: "featured",
      blocks: [
        {
          type: "testimonial",
          evidenceReferences: ["fixture-evidence"],
        },
      ],
    };
    delete project.academic;
    await expectBuildFailure(project, /Unknown Featured project block type/);
  });

  await context.test("invalid links", async () => {
    await expectBuildFailure(
      academicProject({
        links: [
          {
            label: "Source",
            destination: "private-repository",
            purpose: "source",
            publicationApproved: true,
          },
        ],
      }),
      /Enter a valid absolute URL/,
    );
  });

  await context.test("missing evidence references", async () => {
    await expectBuildFailure(
      academicProject({
        academic: {
          problem: "A fixture problem.",
          approach: "A fixture approach.",
          outcome: "A fixture outcome.",
          evidenceReferences: ["missing-evidence"],
        },
      }),
      /references missing evidence "missing-evidence"/,
    );
  });

  await context.test("claims missing qualifiers", async () => {
    const project = academicProject();
    project.evidence[0].evidenceType = "measurement";
    await expectBuildFailure(
      project,
      /measurement evidence requires a date or snapshot qualifier/,
    );
  });

  await context.test("unapproved links", async () => {
    await expectBuildFailure(
      academicProject({
        links: [
          {
            label: "Source",
            destination: "https://example.com/source",
            purpose: "source",
            publicationApproved: false,
          },
        ],
      }),
      /Project links require publication approval/,
    );
  });

  await context.test("unapproved assets", async () => {
    await expectBuildFailure(
      academicProject({
        assets: [
          {
            id: "fixture-image",
            path: "src/assets/projects/fixture.png",
            kind: "image",
            ownerOrProvenance: "Approved fixture",
            publicationApproved: false,
            caption: "Fixture image.",
            alternativeText: "A fixture image.",
            evidenceReferences: ["fixture-evidence"],
            fictionalDataCheck: "not-applicable",
            decorative: false,
          },
        ],
      }),
      /Project assets require publication approval/,
    );
  });
});

test("a routine project addition needs only one Markdown record", async () => {
  const fixture = new URL(
    "../src/content/projects/disposable-project.md",
    import.meta.url,
  );
  const marker = "Disposable valid Academic project";

  await writeFile(
    fixture,
    `---
projectSlug: disposable-valid-project
title: ${marker}
projectType: academic
contextLabel: Academic project · UiTM · 2026
timeframe: "2026"
summary: A temporary project used to verify the authoring path.
role: Academic researcher
attributionBoundary: Approved test fixture only.
technologies:
  - Fixture technology
displayOrder: 999
publicationStatus: published
links: []
evidence:
  - id: disposable-evidence
    publicationStatus: published
    publicClaim: A temporary project used to verify the authoring path.
    evidenceType: resume
    provenance: Approved test fixture
    attribution: Muhammad Haziq Aiman Anuar
    publicationApproved: true
assets: []
academic:
  problem: A temporary authoring problem.
  approach: Add one valid Markdown record.
  outcome: The content collection publishes the project without a presentation edit.
  evidenceReferences:
    - disposable-evidence
---

This file is removed before the test finishes.
`,
  );

  try {
    await build();
    const withFixture = await readFile(
      new URL("../dist/index.html", import.meta.url),
      "utf8",
    );
    assert.match(withFixture, new RegExp(marker));
  } finally {
    await rm(fixture, { force: true });
  }

  await build();
  const withoutFixture = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(withoutFixture, new RegExp(marker));
});
