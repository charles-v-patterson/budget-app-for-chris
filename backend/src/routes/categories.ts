import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validateBody } from "../lib/validate.js";

const createSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["income", "expense"]),
  priority: z.enum(["High", "Medium", "Low"]).optional().nullable(),
});

const updateSchema = createSchema.partial();

export async function categoryRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const { kind } = request.query as { kind?: string };
    return prisma.category.findMany({
      where: kind ? { kind: kind as "income" | "expense" } : undefined,
      orderBy: { name: "asc" },
    });
  });

  app.post("/", { preHandler: validateBody(createSchema) }, async (request, reply) => {
    const body = request.body as z.infer<typeof createSchema>;
    try {
      const category = await prisma.category.create({ data: body });
      return reply.status(201).send(category);
    } catch {
      return reply.status(409).send({ error: "Category already exists" });
    }
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return reply.status(404).send({ error: "Not found" });
    return category;
  });

  app.patch("/:id", { preHandler: validateBody(updateSchema) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateSchema>;
    try {
      return await prisma.category.update({ where: { id }, data: body });
    } catch {
      return reply.status(404).send({ error: "Not found" });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.category.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "Not found or in use" });
    }
  });
}
