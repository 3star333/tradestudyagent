import type { Prisma, TradeStudyStatus, TradeStudyAttachmentType } from "@prisma/client";

import { db } from "./db";

export type TradeStudyRecord = Prisma.TradeStudyGetPayload<{
  include: { attachments: true };
}>;

export type TradeStudyAttachment = TradeStudyRecord["attachments"][number];

let demoStudies: TradeStudyRecord[] = [
  {
    id: "airflow-vs-dbt",
    title: "Airflow vs dbt for data workflows",
    summary: "Compare orchestration vs transformation responsibilities across the stack.",
    status: "draft" as TradeStudyStatus,
    ownerId: "demo-user",
    data: {
      requirements: ["Open-source", "Managed option", "Strong scheduling"],
      options: ["Airflow", "Dagster", "dbt"],
      decision: "Use dbt for transforms with lightweight orchestration"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    attachments: [
      {
        id: "doc-1",
        tradeStudyId: "airflow-vs-dbt",
        fileId: "1-demo-doc",
        type: "doc" as const,
        title: "Draft comparison doc",
        createdAt: new Date()
      }
    ]
  },
  {
    id: "vector-db",
    title: "Vector database for AI agent",
    summary: "Weigh Pinecone, Weaviate, and pgvector for context storage.",
    status: "in_review" as TradeStudyStatus,
    ownerId: "demo-user",
    data: {
      criteria: ["Latency", "Cost", "Operations"],
      notes: "Awaiting benchmarks"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    attachments: []
  }
];

export async function listTradeStudies(userId?: string): Promise<TradeStudyRecord[]> {
  if (!process.env.DATABASE_URL) {
    return demoStudies;
  }

  try {
    return await db.tradeStudy.findMany({
      where: userId
        ? {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } }
            ]
          }
        : undefined,
      include: { attachments: true },
      orderBy: { updatedAt: "desc" }
    });
  } catch (err) {
    console.error("[listTradeStudies] falling back to stub data", err);
    return demoStudies;
  }
}

export async function getTradeStudyById(id: string): Promise<TradeStudyRecord | undefined> {
  if (!process.env.DATABASE_URL) {
    return demoStudies.find((study) => study.id === id);
  }

  try {
    const study = await db.tradeStudy.findUnique({
      where: { id },
      include: { attachments: true }
    });
    return study ?? undefined;
  } catch (err) {
    console.error("[getTradeStudyById] falling back to stub data", err);
    return demoStudies.find((study) => study.id === id);
  }
}

export async function attachFileToTradeStudy(params: {
  tradeStudyId: string;
  fileId: string;
  type: TradeStudyAttachmentType;
  title?: string | null;
}) {
  const { tradeStudyId, fileId, type, title } = params;

  if (!process.env.DATABASE_URL) {
    const study = demoStudies.find((s) => s.id === tradeStudyId);
    if (!study) return undefined;
    const attachment: TradeStudyAttachment = {
      id: `att-${Math.random().toString(36).slice(2, 8)}`,
      fileId,
      type,
      title: title ?? null,
      createdAt: new Date(),
      tradeStudyId
    } as TradeStudyAttachment;
    if (!study.attachments) {
      study.attachments = [];
    }
    study.attachments.push(attachment);
    study.updatedAt = new Date();
    demoStudies = [...demoStudies];
    return attachment;
  }

  try {
    return await db.tradeStudyAttachment.create({
      data: {
        fileId,
        type,
        title: title ?? null,
        tradeStudy: { connect: { id: tradeStudyId } }
      }
    });
  } catch (err) {
    console.error("[attachFileToTradeStudy] failed", err);
    throw err;
  }
}

export async function createTradeStudy(params: {
  ownerId: string;
  title: string;
  summary?: string | null;
  status?: TradeStudyStatus;
  data?: Record<string, unknown>;
}) {
  const { ownerId, title, summary = null, status = "draft", data = {} } = params;

  if (!process.env.DATABASE_URL) {
    const record: TradeStudyRecord = {
      id: `stub-${Math.random().toString(36).slice(2, 8)}`,
      title,
      summary,
      status,
      data: data as any,
      ownerId,
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    demoStudies = [record, ...demoStudies];
    return record;
  }

  return db.tradeStudy.create({
    data: { title, summary: summary ?? null, status, data: data as any, owner: { connect: { id: ownerId } } },
    include: { attachments: true }
  });
}

export async function updateTradeStudy(params: {
  tradeStudyId: string;
  title?: string;
  summary?: string | null;
  status?: TradeStudyStatus;
  data?: Record<string, unknown>;
}) {
  const { tradeStudyId, title, summary, status, data } = params;

  if (!process.env.DATABASE_URL) {
    demoStudies = demoStudies.map((s) =>
      s.id === tradeStudyId
        ? {
            ...s,
            title: title ?? s.title,
            summary: summary ?? s.summary,
            status: (status as TradeStudyStatus) ?? s.status,
            data: (data as any) ?? s.data,
            updatedAt: new Date()
          }
        : s
    );
    return demoStudies.find((s) => s.id === tradeStudyId);
  }

  return db.tradeStudy.update({
    where: { id: tradeStudyId },
    data: {
      title,
      summary: summary ?? undefined,
      status,
      data: data as any
    },
    include: { attachments: true }
  });
}
