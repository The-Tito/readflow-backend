import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import fs from "fs";
import { MIMEType } from "util";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class AIService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
  }

  async generateStudyMaterial(
    filePath: string,
    summaryDifficulty: string,
    typeEvaluation: string,
  ) {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    console.log(base64Data.toString());

    const prompt = `
      Actúa como un profesor experto. Analiza el siguiente documento académico.
      
      Nivel de dificultad deseado: ${summaryDifficulty}.
      
      Tu tarea es generar un JSON estricto con la siguiente estructura:
      {
        "title": "Un título corto y relevante para el documento",
        "summary": "Un resumen técnico y estructurado del contenido principal (máx 300 palabras)",
        "key_concepts": ["Concepto 1", "Concepto 2", "Concepto 3"],
        "questions": [
          {
            "question": "¿Pregunta 1?",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correct_answer": 0,
            "explanation": "Breve explicación de por qué es la correcta"
          },
          ... (Genera 5 preguntas de prueba)
        ]
      }
    `;

    const result = await this.model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
    ]);

    const responseText = result.response.text();

    return JSON.parse(responseText);
  }
}
