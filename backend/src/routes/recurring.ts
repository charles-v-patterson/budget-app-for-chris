import { FastifyInstance } from "fastify";
import { z } from "zod";
import { advanceDueDate, parseDate, prisma, toNumber } from "../lib/prisma.js";
import { validateBody } from "../lib/validate.js";

const createSchema = z.object({
  kind: z.enum(["income", "expense"]),
  source: z.string().optional(),
  categoryId: z.string().uuid(),
  gross: z.number(),
  tax: z.number().optional(),
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  nextDueDate: z.string().optional(),
  active: z.boolean().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

function serialize(entry: {
  id: string;
  kind: string;
  source: string;
  categoryId: string;
  gross: { toNumber(): number };
  tax: { toNumber(): number };
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  nextDueDate: Date;
  active: boolean;
  notes: string;
  createdAt: Date;
  category?: { id: string; name: string; kind: string; priority: string | null };
}) {
  return {
    ...entry,
    gross: toNumber(entry.gross),
    tax: toNumber(entry.tax),
    startDate: entry.startDate.toISOString().slice(0, 10),
    endDate: entry.endDate ? entry.endDate.toISOString().slice(0, 10) : null,
    nextDueDate: entry.nextDueDate.toISOString().slice(0, 10),
  };
}

export async function recurringRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const { active } = request.query as { active?: string };
    const entries = await prisma.recurringEntry.findMany({
      where: active === "true" ? { active: true } : undefined,
      include: { category: true },
      orderBy: { nextDueDate: "asc" },
    });
    return entries.map(serialize);
  });

  app.post("/", { preHandler: validateBody(createSchema) }, async (request, reply) => {
    const body = request.body as z.infer<typeof createSchema>;
    const startDate = parseDate(body.startDate);
    const entry = await prisma.recurringEntry.create({
      data: {
        kind: body.kind,
        source: body.source ?? "",
        categoryId: body.categoryId,
        gross: body.gross,
        tax: body.tax ?? 0,
        frequency: body.frequency,
        startDate,
        endDate: body.endDate ? parseDate(body.endDate) : null,
        nextDueDate: body.nextDueDate ? parseDate(body.nextDueDate) : startDate,
        active: body.active ?? true,
        notes: body.notes ?? "",
      },
      include: { category: true },
    });
    return reply.status(201).send(serialize(entry));
  });

  app.patch("/:id", { preHandler: validateBody(updateSchema) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateSchema>;
    try {
      const entry = await prisma.recurringEntry.update({
        where: { id },
        data: {
          ...body,
          startDate: body.startDate ? parseDate(body.startDate) : undefined,
          endDate: body.endDate === undefined ? undefined : body.endDate ? parseDate(body.endDate) : null,
          nextDueDate: body.nextDueDate ? parseDate(body.nextDueDate) : undefined,
        },
        include: { category: true },
      });
      return serialize(entry);
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.recurringEntry.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  app.post("/:id/record", async (request, reply) => {
    const { id } = request.params as { id: string };
    const recurring = await prisma.recurringEntry.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!recurring) return reply.status(404).send({ error: "Not found" });

    const today = new Date();
    const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    let ledgerEntry;
    if (recurring.kind === "income") {
      ledgerEntry = await prisma.incomeEntry.create({
        data: {
          date: dateOnly,
          source: recurring.source,
          categoryId: recurring.categoryId,
          gross: recurring.gross,
          tax: recurring.tax,
          notes: recurring.notes ? `Recurring: ${recurring.notes}` : "Recurring",
        },
        include: { category: true },
      });
    } else {
      ledgerEntry = await prisma.expenseEntry.create({
        data: {
          date: dateOnly,
          source: recurring.source,
          categoryId: recurring.categoryId,
          gross: recurring.gross,
          tax: recurring.tax,
          notes: recurring.notes ? `Recurring: ${recurring.notes}` : "Recurring",
        },
        include: { category: true },
      });
    }

    const nextDueDate = advanceDueDate(recurring.nextDueDate, recurring.frequency);
    const updated = await prisma.recurringEntry.update({
      where: { id },
      data: { nextDueDate },
      include: { category: true },
    });

    return {
      ledgerEntry,
      recurring: serialize(updated),
    };
  });
}
