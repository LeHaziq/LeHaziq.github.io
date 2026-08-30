import { z } from "astro/zod";

const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

const stableId = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use a stable lowercase kebab-case identifier",
  );

const publicUrl = z
  .url("Enter a valid absolute URL")
  .refine(
    (value) => value.startsWith("https://") || value.startsWith("http://"),
    "Public links must use HTTP or HTTPS",
  );

const evidenceReferences = z
  .array(stableId)
  .min(1, "Reference at least one evidence record");

export const projectLinkSchema = z.object({
  label: requiredText("Link label"),
  destination: publicUrl,
  purpose: requiredText("Link purpose"),
  publicationApproved: z.literal(true, {
    error: "Project links require publication approval",
  }),
});

export const projectAssetSchema = z
  .object({
    id: stableId,
    path: z
      .string()
      .regex(
        /^src\/assets\/projects\/[a-z0-9][a-z0-9/_.-]*$/i,
        "Project assets must live under src/assets/projects",
      ),
    kind: z.enum(["image", "diagram", "runtime-capture"]),
    ownerOrProvenance: requiredText("Asset owner or provenance"),
    publicationApproved: z.literal(true, {
      error: "Project assets require publication approval",
    }),
    caption: z.string().trim(),
    alternativeText: z.string().trim(),
    evidenceReferences: z.array(stableId),
    fictionalDataCheck: z.enum(["confirmed", "not-applicable"]),
    decorative: z.boolean(),
  })
  .superRefine((asset, context) => {
    if (asset.kind === "runtime-capture" && asset.fictionalDataCheck !== "confirmed") {
      context.addIssue({
        code: "custom",
        path: ["fictionalDataCheck"],
        message: "Runtime captures require a confirmed fictional-data check",
      });
    }

    if (asset.decorative) {
      if (asset.alternativeText !== "" || asset.evidenceReferences.length > 0) {
        context.addIssue({
          code: "custom",
          message:
            "Decorative assets must have empty alternative text and carry no evidence claim",
        });
      }
      return;
    }

    if (asset.alternativeText === "") {
      context.addIssue({
        code: "custom",
        path: ["alternativeText"],
        message: "Informative assets require useful alternative text",
      });
    }

    if (asset.evidenceReferences.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["evidenceReferences"],
        message: "Informative assets must reference supporting evidence",
      });
    }
  });

export const evidenceSchema = z
  .object({
    id: stableId,
    publicationStatus: z.enum(["draft", "published"]),
    publicClaim: requiredText("Public claim"),
    evidenceType: z.enum([
      "resume",
      "repository",
      "runtime-capture",
      "diagram",
      "measurement",
      "public-page",
    ]),
    provenance: requiredText("Evidence provenance"),
    attribution: requiredText("Evidence attribution"),
    publicationApproved: z.boolean(),
    qualifier: z.string().trim().optional(),
    publicLink: publicUrl.optional(),
    assetReference: stableId.optional(),
    publicCaption: z.string().trim().optional(),
    alternativeText: z.string().trim().optional(),
  })
  .superRefine((evidence, context) => {
    if (evidence.publicationStatus === "published" && !evidence.publicationApproved) {
      context.addIssue({
        code: "custom",
        path: ["publicationApproved"],
        message: "Published evidence requires publication approval",
      });
    }

    if (
      ["repository", "runtime-capture", "measurement", "public-page"].includes(
        evidence.evidenceType,
      ) &&
      !evidence.qualifier
    ) {
      context.addIssue({
        code: "custom",
        path: ["qualifier"],
        message: `${evidence.evidenceType} evidence requires a date or snapshot qualifier`,
      });
    }
  });

const narrativeBlockSchema = z.object({
  type: z.literal("narrative"),
  heading: requiredText("Narrative heading"),
  evidenceReferences,
}).strict();

const workflowBlockSchema = z.object({
  type: z.literal("workflow"),
  heading: requiredText("Workflow heading"),
  stepEvidenceReferences: evidenceReferences,
}).strict();

const engineeringDecisionBlockSchema = z.object({
  type: z.literal("engineering-decision"),
  situation: requiredText("Decision situation"),
  choice: requiredText("Decision choice"),
  rationale: requiredText("Decision rationale"),
  result: requiredText("Decision result"),
  evidenceReferences,
});

const verifiedFactBlockSchema = z.object({
  type: z.literal("verified-fact"),
  evidenceReferences: z
    .array(stableId)
    .length(
      1,
      "Verified fact blocks reference exactly one evidence record",
    ),
});

const metricBlockSchema = z.object({
  type: z.literal("metric"),
  comparison: requiredText("Metric comparison"),
  unit: requiredText("Metric unit"),
  qualifier: requiredText("Metric date or snapshot qualifier"),
  evidenceReference: stableId,
});

const mediaBlockSchema = z.object({
  type: z.literal("media"),
  assetReference: stableId,
  caption: requiredText("Media caption"),
  alternativeText: requiredText("Media alternative text"),
  evidenceReferences,
});

export const featuredBlockSchema = z.discriminatedUnion("type", [
  narrativeBlockSchema,
  workflowBlockSchema,
  engineeringDecisionBlockSchema,
  verifiedFactBlockSchema,
  metricBlockSchema,
  mediaBlockSchema,
], {
  error: "Unknown Featured project block type",
});

const commonProjectFields = {
  projectSlug: stableId,
  title: requiredText("Project title"),
  contextLabel: requiredText("Context label"),
  timeframe: requiredText("Timeframe"),
  summary: requiredText("Project summary"),
  role: requiredText("Haziq's role"),
  attributionBoundary: requiredText("Attribution boundary"),
  technologies: z.array(requiredText("Technology")).min(1),
  displayOrder: z.number().int().nonnegative(),
  publicationStatus: z.enum(["draft", "published"]),
  links: z.array(projectLinkSchema),
  evidence: z.array(evidenceSchema).min(1),
  assets: z.array(projectAssetSchema),
};

const academicProjectSchema = z.object({
  ...commonProjectFields,
  projectType: z.literal("academic"),
  academic: z.object({
    problem: requiredText("Academic project problem"),
    approach: requiredText("Academic project approach"),
    outcome: requiredText("Academic project outcome"),
    evidenceReferences,
  }),
});

const featuredProjectSchema = z.object({
  ...commonProjectFields,
  projectType: z.literal("featured"),
  blocks: z.array(featuredBlockSchema).min(1),
});

const myConferenceProhibitedClaimPatterns = [
  /\bpublic demo\b/i,
  /\bproduction customer\b/i,
  /\b(?:broad adoption|broadly adopted)\b/i,
  /\b(?:register|sign up|create an account)\b/i,
  /\b(?:public|open-source) (?:repository|repo|source code)\b/i,
  /\b(?:source )?(?:repository|repo|source code) (?:is )?(?:public|open-source)\b/i,
  /\b(?:(?:external|independent) accessibility audit|externally audited)\b/i,
  /\b(?:current(?:ly)? (?:green|passing) CI|CI (?:is )?(?:currently )?(?:green|passing|passes))\b/i,
  /\bCloudflare\b[\s\S]{0,100}\b(?:cannot|can't|does not|doesn't|never)\b[\s\S]{0,60}\b(?:access|read|see)\b[\s\S]{0,40}\b(?:PDFs?|submissions?)\b/i,
  /\bsole (?:author|authorship|creator|developer)\b/i,
  /\b(?:UMT|IMTC)\b/,
  /\b(?:fabricated (?:reviewer|review|manuscript) material|decorative (?:review|reviewer) marks?|manuscript[- ]rating material)\b/i,
  new RegExp(
    ["github\\.com", "LeHaziq", "Conference-Management-System"].join("\\/"),
    "i",
  ),
];

function claimsCurrentSuitePerformance(publicationText: string): boolean {
  const currentState = /\b(?:current(?:ly)?|latest|now|today|at present)\b/i;
  const testSuite =
    /\b(?:PHP\s+)?(?:test(?:-suite)?(?:\s+(?:run|suite|performance))?|suite)\b/i;
  const measuredResult =
    /\b(?:pass(?:ed|es|ing)?|runs?|takes?|seconds?|minutes?|hours?|performance|migrations?|assertions?)\b|\d/i;

  return publicationText
    .split(/(?<=[.!?])\s+|\n+/)
    .some(
      (claim) =>
        currentState.test(claim) &&
        testSuite.test(claim) &&
        measuredResult.test(claim),
    );
}

function featuredBlockPublicationText(
  block: z.infer<typeof featuredBlockSchema>,
): string[] {
  switch (block.type) {
    case "narrative":
    case "workflow":
      return [block.heading];
    case "engineering-decision":
      return [block.situation, block.choice, block.rationale, block.result];
    case "metric":
      return [block.comparison, block.unit, block.qualifier];
    case "media":
      return [block.caption, block.alternativeText];
    case "verified-fact":
      return [];
  }
}

function projectPublicationText(
  project:
    | z.infer<typeof featuredProjectSchema>
    | z.infer<typeof academicProjectSchema>,
): string {
  const sharedText = [
    project.title,
    project.contextLabel,
    project.timeframe,
    project.summary,
    project.role,
    project.attributionBoundary,
    ...project.technologies,
    ...project.links.flatMap((link) => [
      link.label,
      link.destination,
      link.purpose,
    ]),
    ...project.evidence.flatMap((evidence) => [
      evidence.publicClaim,
      evidence.publicLink ?? "",
      evidence.publicCaption ?? "",
      evidence.alternativeText ?? "",
    ]),
    ...project.assets.flatMap((asset) => [
      asset.caption,
      asset.alternativeText,
    ]),
  ];

  if (project.projectType === "featured") {
    return [
      ...sharedText,
      ...project.blocks.flatMap(featuredBlockPublicationText),
    ].join("\n");
  }

  return [
    ...sharedText,
    project.academic.problem,
    project.academic.approach,
    project.academic.outcome,
  ].join("\n");
}

export const projectSchema = z
  .discriminatedUnion("projectType", [
    featuredProjectSchema,
    academicProjectSchema,
  ])
  .superRefine((project, context) => {
    if (
      project.projectSlug !== "myconference" ||
      project.publicationStatus !== "published"
    ) {
      return;
    }

    const publicationText = projectPublicationText(project);
    if (
      myConferenceProhibitedClaimPatterns.some((pattern) =>
        pattern.test(publicationText),
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Prohibited MyConference publication claim",
      });
    }

    if (claimsCurrentSuitePerformance(publicationText)) {
      context.addIssue({
        code: "custom",
        message:
          "Historical MyConference metrics cannot claim current suite performance",
      });
    }

    if (
      project.links.some((link) => {
        const hostname = new URL(link.destination).hostname.toLowerCase();
        return hostname === "myconference.my" || hostname === "www.myconference.my";
      })
    ) {
      context.addIssue({
        code: "custom",
        path: ["links"],
        message:
          "MyConference pilot link requires recorded promotion approval",
      });
    }
  });

export type Project = z.infer<typeof projectSchema>;
export type PublishedProject = Project & {
  publicationStatus: "published";
};

interface ProjectEntry {
  id: string;
  data: Project;
}

function referencedEvidence(project: Project): string[] {
  if (project.projectType === "academic") {
    return project.academic.evidenceReferences;
  }

  return project.blocks.flatMap((block) => {
    if (block.type === "metric") {
      return [block.evidenceReference];
    }
    if (block.type === "workflow") {
      return block.stepEvidenceReferences;
    }
    return block.evidenceReferences;
  });
}

function assertEvidenceReference(
  project: Project,
  evidenceById: Map<string, Project["evidence"][number]>,
  evidenceId: string,
  owner: string,
): void {
  const evidence = evidenceById.get(evidenceId);
  if (!evidence) {
    throw new Error(`${owner} references missing evidence "${evidenceId}"`);
  }
  if (
    project.publicationStatus === "published" &&
    evidence.publicationStatus !== "published"
  ) {
    throw new Error(`${owner} references draft evidence "${evidenceId}"`);
  }
}

export function selectPublishedProjects(
  entries: ProjectEntry[],
): PublishedProject[] {
  const slugOwners = new Map<string, string>();

  for (const entry of entries) {
    const existingOwner = slugOwners.get(entry.data.projectSlug);
    if (existingOwner) {
      throw new Error(
        `Duplicate project slug "${entry.data.projectSlug}" in ${existingOwner} and ${entry.id}`,
      );
    }
    slugOwners.set(entry.data.projectSlug, entry.id);

    const evidenceById = new Map(
      entry.data.evidence.map((evidence) => [evidence.id, evidence]),
    );
    const assetIds = new Set(entry.data.assets.map((asset) => asset.id));

    for (const evidenceId of referencedEvidence(entry.data)) {
      assertEvidenceReference(
        entry.data,
        evidenceById,
        evidenceId,
        `Project "${entry.data.projectSlug}"`,
      );
    }

    for (const asset of entry.data.assets) {
      for (const evidenceId of asset.evidenceReferences) {
        assertEvidenceReference(
          entry.data,
          evidenceById,
          evidenceId,
          `Project "${entry.data.projectSlug}" asset "${asset.id}"`,
        );
      }
    }

    for (const evidence of entry.data.evidence) {
      if (evidence.assetReference && !assetIds.has(evidence.assetReference)) {
        throw new Error(
          `Project "${entry.data.projectSlug}" evidence "${evidence.id}" references missing asset "${evidence.assetReference}"`,
        );
      }
    }

    if (entry.data.projectType === "featured") {
      const verifiedFactClaims = new Map<string, string>();

      for (const block of entry.data.blocks) {
        if (block.type === "verified-fact") {
          const [evidenceId] = block.evidenceReferences;
          const evidence = evidenceById.get(evidenceId);
          if (!evidence) {
            continue;
          }
          const claimKey = evidence.publicClaim
            .trim()
            .replace(/\s+/g, " ")
            .toLocaleLowerCase("en");
          if (verifiedFactClaims.has(claimKey)) {
            throw new Error(
              `Project "${entry.data.projectSlug}" duplicates Verified fact claim "${evidence.publicClaim}"`,
            );
          }
          verifiedFactClaims.set(claimKey, evidenceId);
        }

        if (block.type === "workflow") {
          for (const evidenceId of block.stepEvidenceReferences) {
            const evidence = evidenceById.get(evidenceId);
            if (!evidence?.publicCaption) {
              throw new Error(
                `Project "${entry.data.projectSlug}" workflow evidence "${evidenceId}" requires a public caption`,
              );
            }
          }
        }

        if (block.type === "media" && !assetIds.has(block.assetReference)) {
          throw new Error(
            `Project "${entry.data.projectSlug}" references missing asset "${block.assetReference}"`,
          );
        }
      }
    }
  }

  return entries
    .filter(
      (entry): entry is ProjectEntry & { data: PublishedProject } =>
        entry.data.publicationStatus === "published",
    )
    .map(({ data }) => ({
      ...data,
      evidence: data.evidence.filter(
        (evidence) => evidence.publicationStatus === "published",
      ),
    }))
    .sort((left, right) => left.displayOrder - right.displayOrder);
}
