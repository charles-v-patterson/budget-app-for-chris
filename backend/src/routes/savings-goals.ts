import { FastifyInstance } from "fastify";
import { z } from "zod";
import { parseDate, prisma, toNumber } from "../lib/prisma.js";
import { validateBody } from "../lib/validate.js";

const createSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().optional(),
  targetDate: z.string().optional().nullable(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

const contributeSchema = z.object({
  amount: z.number().positive(),
});

function serialize(goal: {
  id: string;
  name: string;
  targetAmount: { toNumber(): number };
  currentAmount: { toNumber(): number };
  targetDate: Date | null;
  notes: string;
  createdAt: Date;
}) {
  const targetAmount = toNumber(goal.targetAmount);
  const currentAmount = toNumber(goal.currentAmount);
  return {
    ...goal,
    targetAmount,
    currentAmount,
    progress: targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0,
    targetDate: goal.targetDate ? goal.targetDate.toISOString().slice(0, 10) : null,
  };
}

export async function savingsGoalRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const goals = await prisma.savingsGoal.findMany({ orderBy: { createdAt: "asc" } });
    return goals.map(serialize);
  });

  app.post("/", { preHandler: validateBody(createSchema) }, async (request, reply) => {
    const body = request.body as z.infer<typeof createSchema>;
    const goal = await prisma.savingsGoal.create({
      data: {
        name: body.name,
        targetAmount: body.targetAmount,
        currentAmount: body.currentAmount ?? 0,
        targetDate: body.targetDate ? parseDate(body.targetDate) : null,
        notes: body.notes ?? "",
      },
    });
    return reply.status(201).send(serialize(goal));
  });

  app.patch("/:id", { preHandler: validateBody(updateSchema) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateSchema>;
    try {
      const goal = await prisma.savingsGoal.update({
        where: { id },
        data: {
          ...body,
          targetDate: body.targetDate === undefined ? undefined : body.targetDate ? parseDate(body.targetDate) : null,
        },
      });
      return serialize(goal);
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.savingsGoal.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  app.post("/:id/contribute", { preHandler: validateBody(contributeSchema) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { amount } = request.body as z.infer<typeof contributeSchema>;
    try {
      const goal = await prisma.savingsGoal.update({
        where: { id },
        data: { currentAmount: { increment: amount } },
      });
      return serialize(goal);
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });
}
