import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando el sembrado de datos (Seeding)...");

  // ---------------------------------------------------
  // 1. Sembrar Niveles de Dificultad (DifficultyLevel)
  // ---------------------------------------------------

  const difficulties = [
    {
      id: 1,
      slug: "BASIC",
      displayName: "Básico",
      description: "Initial and basic level of summary",
    },
    {
      id: 2,
      slug: "INTERMEDIATE",
      displayName: "Intermedio",
      description: "Intermediate level, no technical terms.",
    },
    {
      id: 3,
      slug: "ADVANCED",
      displayName: "Avanzado",
      description: "Advanced level, with technical terms and a specific focus.",
    },
  ];

  for (const diff of difficulties) {
    await prisma.difficultyLevel.upsert({
      where: { id: diff.id },
      update: {},
      create: {
        id: diff.id,
        slug: diff.slug,
        displayName: diff.displayName,
        description: diff.description,
      },
    });
  }

  console.log("Niveles de dificultad insertados.");

  const typeEvaluations = [
    {
      id: 1,
      slug: "MULTIPLE_CHOICE",
      displayName: "Opción Múltiple",
    },
    {
      id: 2,
      slug: "FILL_IN_THE_BLANKS",
      displayName: "Completar Espacios (Drag and Drop)",
    },
    {
      id: 3,
      slug: "FREE_WRITING",
      displayName: "Redacción libre",
    },
  ];

  for (const evalType of typeEvaluations) {
    await prisma.evaluationType.upsert({
      where: { id: evalType.id },
      update: {},
      create: {
        id: evalType.id,
        slug: evalType.slug,
        displayName: evalType.displayName,
      },
    });
  }
  console.log("Tipos de evaluación insertados.");
}

main()
  .catch((e) => {
    console.error("Error durante el seeding:", e);
    // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
