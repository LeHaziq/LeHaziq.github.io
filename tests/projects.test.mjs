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
        stepEvidenceReferences: ["fixture-evidence"],
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
