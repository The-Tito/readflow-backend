import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import fs from "fs";
import {
  AIPromptBuilder,
  calculateEssayScore,
  EssayEvaluationResult,
  EssayScore,
} from "../utils/promptBuilder";

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
    summaryDifficultyName: string,
    evaluationTypeId: number,
  ) {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const prompt = AIPromptBuilder.buildStudyPrompt(
      summaryDifficultyName,
      evaluationTypeId,
    );

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

  async evaluateUserEssay(
    userEssay: string,
    requiredConcepts: string[],
    keyRelationships: string[],
    minimumConceptsToPass: number,
  ): Promise<EssayScore> {
    const prompt = AIPromptBuilder.buildEssayEvaluationPrompt(
      userEssay,
      requiredConcepts,
      keyRelationships,
    );

    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();
    const aiResult: EssayEvaluationResult = JSON.parse(responseText);

    // El score lo calcula el backend con fórmula fija
    return calculateEssayScore(
      aiResult,
      requiredConcepts,
      minimumConceptsToPass,
    );
  }
}
