import { PrismaClient, Document } from "@prisma/client";

const prisma = new PrismaClient();

export class DocumentService {
  async createDocument(data: {
    userId: number;
    documentHash: string;
    originalFilename: string;
  }): Promise<Document> {
    const newDocument = await prisma.document.create({
      data: {
        userId: data.userId,
        documentHash: data.documentHash,
        originalFilename: data.originalFilename,
      },
    });

    return newDocument;
  }

  // Chame agrega aquí tu método de:
  // async checkHashExists(hash: string) { ... }
  // para el verificado del hasheo
}
