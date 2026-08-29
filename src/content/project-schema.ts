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
    qualifierRequired: z.boolean(),
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

    if (evidence.qualifierRequired && !evidence.qualifier) {
      context.addIssue({
        code: "custom",
        path: ["qualifier"],
        message: "This public claim requires a date or snapshot qualifier",
      });
    }
  });

const narrativeBlockSchema = z.object({
  type: z.literal("narrative"),
  heading: requiredText("Narrative heading"),
  body: requiredText("Narrative body"),
  evidenceReferences,
});

const workflowBlockSchema = z.object({
  type: z.literal("workflow"),
  heading: requiredText("Workflow heading"),
  steps: z.array(requiredText("Workflow step")).min(1),
  evidenceReferences,
});

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
  evidenceReferences,
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
  slug: stableId,
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

export const projectSchema = z.discriminatedUnion("projectType", [
  featuredProjectSchema,
  academicProjectSchema,
]);

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

  return project.blocks.flatMap((block) =>
    block.type === "metric"
      ? [block.evidenceReference]
      : block.evidenceReferences,
  );
}

export function selectPublishedProjects(
  entries: ProjectEntry[],
): PublishedProject[] {
  const slugOwners = new Map<string, string>();

  for (const entry of entries) {
    const existingOwner = slugOwners.get(entry.data.slug);
    if (existingOwner) {
      throw new Error(
        `Duplicate project slug "${entry.data.slug}" in ${existingOwner} and ${entry.id}`,
      );
    }
    slugOwners.set(entry.data.slug, entry.id);

    const evidenceById = new Map(
      entry.data.evidence.map((evidence) => [evidence.id, evidence]),
    );
    const assetIds = new Set(entry.data.assets.map((asset) => asset.id));

    for (const evidenceId of referencedEvidence(entry.data)) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        throw new Error(
          `Project "${entry.data.slug}" references missing evidence "${evidenceId}"`,
        );
      }
      if (
        entry.data.publicationStatus === "published" &&
        evidence.publicationStatus !== "published"
      ) {
        throw new Error(
          `Project "${entry.data.slug}" references draft evidence "${evidenceId}"`,
        );
      }
    }

    for (const asset of entry.data.assets) {
      for (const evidenceId of asset.evidenceReferences) {
        const evidence = evidenceById.get(evidenceId);
        if (!evidence) {
          throw new Error(
            `Project "${entry.data.slug}" asset "${asset.id}" references missing evidence "${evidenceId}"`,
          );
        }
        if (
          entry.data.publicationStatus === "published" &&
          evidence.publicationStatus !== "published"
        ) {
          throw new Error(
            `Project "${entry.data.slug}" asset "${asset.id}" references draft evidence "${evidenceId}"`,
          );
        }
      }
    }

    for (const evidence of entry.data.evidence) {
      if (evidence.assetReference && !assetIds.has(evidence.assetReference)) {
        throw new Error(
          `Evidence "${evidence.id}" references missing asset "${evidence.assetReference}"`,
        );
      }
    }

    if (entry.data.projectType === "featured") {
      for (const block of entry.data.blocks) {
        if (block.type === "media" && !assetIds.has(block.assetReference)) {
          throw new Error(
            `Project "${entry.data.slug}" references missing asset "${block.assetReference}"`,
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
