import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CatalogService {
  async getAllCatalogs() {
    const [difficulties, evaluationTypes] = await Promise.all([
      prisma.difficultyLevel.findMany({
        select: {
          id: true,
          slug: true,
          displayName: true,
          description: true,
        },
      }),
      prisma.evaluationType.findMany({
        select: {
          id: true,
          slug: true,
          displayName: true,
        },
      }),
    ]);

    return {
      difficulties,
      evaluationTypes,
    };
  }
}
