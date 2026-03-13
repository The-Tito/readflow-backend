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

  async checkHashExists(
    userId: number,
    hash: string,
  ): Promise<Document | null> {
    return await prisma.document.findFirst({
      where: {
        userId,
        documentHash: hash,
      },
    });
  }
}
