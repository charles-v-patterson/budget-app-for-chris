import { FastifyInstance } from "fastify";
import { z } from "zod";
import { parseDate, prisma, toNumber } from "../lib/prisma.js";
import { validateBody } from "../lib/validate.js";

const createSchema = z.object({
  label: z.string().min(1),
  value: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  paid: z.boolean().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

function serialize(item: {
  id: string;
  label: string;
  value: { toNumber(): number } | null;
  dueDate: Date | null;
  paid: boolean;
  notes: string;
  createdAt: Date;
}) {
  return {
    ...item,
    value: item.value != null ? toNumber(item.value) : null,
    dueDate: item.dueDate ? item.dueDate.toISOString().slice(0, 10) : null,
  };
}

export async function taxRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const items = await prisma.taxItem.findMany({ orderBy: { createdAt: "asc" } });
    return items.map(serialize);
  });

  app.post("/", { preHandler: validateBody(createSchema) }, async (request, reply) => {
    const body = request.body as z.infer<typeof createSchema>;
    const item = await prisma.taxItem.create({
      data: {
        label: body.label,
        value: body.value ?? null,
        dueDate: body.dueDate ? parseDate(body.dueDate) : null,
        paid: body.paid ?? false,
        notes: body.notes ?? "",
      },
    });
    return reply.status(201).send(serialize(item));
  });

  app.patch("/:id", { preHandler: validateBody(updateSchema) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateSchema>;
    try {
      const item = await prisma.taxItem.update({
        where: { id },
        data: {
          ...body,
          dueDate: body.dueDate === undefined ? undefined : body.dueDate ? parseDate(body.dueDate) : null,
        },
      });
      return serialize(item);
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.taxItem.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });
}
