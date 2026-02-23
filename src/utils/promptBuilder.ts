// REGLAS ADICIONALES POR TIPO DE EVALUACIÓN

const FILL_IN_THE_BLANK_RULES = `
Reglas adicionales para el tipo "Completar":
- Cada párrafo debe tener EXACTAMENTE 5 blanks marcados como [BLANK] distribuidos naturalmente en el texto.
- El array "blanks" debe tener EXACTAMENTE 5 objetos con "position" del 1 al 5 en orden de aparición.
- El array "word_bank" debe tener EXACTAMENTE 7 palabras: las 5 respuestas correctas (en el mismo orden que aparecen en el párrafo) más 2 palabras de distracción plausibles pero incorrectas.
- Los sets T0 y T48 deben usar párrafos y palabras COMPLETAMENTE DISTINTOS entre sí.
`;

const MULTIPLE_CHOICE_RULES = `
Reglas adicionales para el tipo "Opción Múltiple":
- Cada pregunta debe tener EXACTAMENTE 4 opciones en el array "options".
- "correct_answer" es el índice (0-3) de la opción correcta dentro del array "options".
- Los sets T0 y T48 deben tener preguntas COMPLETAMENTE DISTINTAS entre sí, sin repetir enunciados ni opciones.
`;

// SCHEMAS DE PREGUNTAS POR TIPO

const MULTIPLE_CHOICE_QUESTION_EXAMPLE = `{
        "questions": [
          {
            "question": "Pregunta de opción múltiple basada en el documento",
            "options": ["Opción A real", "Opción B real", "Opción C real", "Opción D real"],
            "correct_answer": 0,
            "explanation": "Explicación de por qué esa opción es correcta según el documento"
          }
        ]
      }`;

const FILL_IN_THE_BLANK_QUESTION_EXAMPLE = `{
        "questions": [
          {
            "paragraph": "Párrafo del documento con exactamente 5 palabras clave reemplazadas por [BLANK], distribuidas de forma [BLANK] a lo largo del [BLANK] para que el estudiante practique los [BLANK] del tema de manera [BLANK].",
            "blanks": [
              { "position": 1, "correct_answer": "palabra_correcta_1" },
              { "position": 2, "correct_answer": "palabra_correcta_2" },
              { "position": 3, "correct_answer": "palabra_correcta_3" },
              { "position": 4, "correct_answer": "palabra_correcta_4" },
              { "position": 5, "correct_answer": "palabra_correcta_5" }
            ],
            "word_bank": ["palabra_correcta_1", "palabra_correcta_2", "palabra_correcta_3", "palabra_correcta_4", "palabra_correcta_5", "distractor_1", "distractor_2"]
          }
        ]
      }`;

const QUESTION_SCHEMAS: Record<number, string> = {
  // Tipo 1: Opción Múltiple — genera dos sets distintos
  1: `
  "t0": ${MULTIPLE_CHOICE_QUESTION_EXAMPLE},
  "t48": ${MULTIPLE_CHOICE_QUESTION_EXAMPLE}
  `,

  // Tipo 2: Completar — genera dos sets de párrafos distintos
  2: `
  "t0": ${FILL_IN_THE_BLANK_QUESTION_EXAMPLE},
  "t48": ${FILL_IN_THE_BLANK_QUESTION_EXAMPLE}
  `,

  // Tipo 3: Redacción — solo criterios de evaluación
  3: `
  "evaluation_criteria": {
    "required_concepts": ["concepto_clave_1", "concepto_clave_2", "concepto_clave_3", "concepto_clave_4", "concepto_clave_5"],
    "minimum_concepts_to_pass": 3,
    "key_relationships": [
      "Descripción de la relación entre concepto A y concepto B",
      "Descripción de la relación entre concepto C y concepto D"
    ]
  }
  `,
};

const ADDITIONAL_RULES: Record<number, string> = {
  1: MULTIPLE_CHOICE_RULES,
  2: FILL_IN_THE_BLANK_RULES,
  3: "",
};

const QUESTION_COUNT_RULE: Record<number, string> = {
  1: "Genera exactamente 5 preguntas DISTINTAS en t0 y 5 preguntas DISTINTAS en t48. Ninguna pregunta debe repetirse entre sets.",
  2: "Genera exactamente 2 párrafos en t0 (cada uno con 5 blanks) y 2 párrafos DISTINTOS en t48. Ningún párrafo ni palabra debe repetirse entre sets.",
  3: "Extrae exactamente 5 conceptos clave del documento para 'required_concepts'. Estos serán usados para evaluar la síntesis libre del usuario.",
};

// BUILDER PRINCIPAL

export class AIPromptBuilder {
  static buildStudyPrompt(
    summaryDifficultyName: string,
    evaluationTypeId: number,
  ): string {
    const questionSchema =
      QUESTION_SCHEMAS[evaluationTypeId] ?? QUESTION_SCHEMAS[1];

    const additionalRules = ADDITIONAL_RULES[evaluationTypeId] ?? "";
    const questionCountRule =
      QUESTION_COUNT_RULE[evaluationTypeId] ?? QUESTION_COUNT_RULE[1];

    return `
Actúa como un profesor universitario experto. Analiza el documento proporcionado.

Parámetros de la sesión:
- Nivel de dificultad: ${summaryDifficultyName}

Tu tarea es generar ÚNICAMENTE un objeto JSON válido con esta estructura exacta.
No incluyas explicaciones, comentarios, ni bloques de código Markdown (\`\`\`json).
No repitas los valores de ejemplo; genera contenido real basado en el documento.

{
  "title": "Título corto y relevante extraído del documento",
  "summary": "Resumen estructurado del contenido principal (máx 300 palabras, nivel ${summaryDifficultyName})",
  "key_concepts": ["Concepto clave 1", "Concepto clave 2", "Concepto clave 3"],
  ${questionSchema}
}

Reglas estrictas:
1. ${questionCountRule}
2. Adapta la complejidad al nivel: ${summaryDifficultyName}.
3. Basa TODO el contenido ÚNICAMENTE en el documento proporcionado.
4. La salida debe ser JSON parseable directamente con JSON.parse(). Cualquier otro formato es incorrecto.
${additionalRules}
    `.trim();
  }

  // PROMPT PARA EVALUAR REDACCIÓN (segunda llamada a Gemini)

  static buildEssayEvaluationPrompt(
    userEssay: string,
    requiredConcepts: string[],
    keyRelationships: string[],
  ): string {
    return `
Actúa como un evaluador académico objetivo.

Se le pidió al estudiante que escribiera una síntesis del documento que estudió.
A continuación se presentan los conceptos clave que debería haber mencionado y la síntesis del estudiante.

Conceptos requeridos: ${JSON.stringify(requiredConcepts)}
Relaciones clave esperadas: ${JSON.stringify(keyRelationships)}

Síntesis del estudiante:
"""
${userEssay}
"""

Tu tarea es generar ÚNICAMENTE un objeto JSON válido con esta estructura exacta.
No incluyas explicaciones, comentarios, ni bloques de código Markdown (\`\`\`json).

{
  "concepts_found": ["lista de conceptos del array requerido que SÍ aparecen en la síntesis, aunque sea con sinónimos o paráfrasis"],
  "concepts_missing": ["lista de conceptos del array requerido que NO aparecen en la síntesis"],
  "relationships_identified": ["lista de relaciones clave que el estudiante identificó correctamente"],
  "feedback": "Retroalimentación constructiva en 2-3 oraciones: qué hizo bien y qué le faltó mencionar"
}

Reglas estrictas:
1. Evalúa por comprensión conceptual, no por coincidencia exacta de palabras. Un sinónimo o paráfrasis válida cuenta como concepto encontrado.
2. "concepts_found" + "concepts_missing" deben sumar exactamente ${requiredConcepts.length} elementos en total.
3. La salida debe ser JSON parseable directamente con JSON.parse().
    `.trim();
  }
}

// SCORING DE REDACCIÓN

export interface EssayEvaluationResult {
  concepts_found: string[];
  concepts_missing: string[];
  relationships_identified: string[];
  feedback: string;
}

export interface EssayScore {
  score: number; // 0.0 - 10.0
  maxPossibleScore: number; // Siempre 10.0
  passed: boolean;
  aiFeedback: EssayEvaluationResult;
}

export function calculateEssayScore(
  aiResult: EssayEvaluationResult,
  requiredConcepts: string[],
  minimumConceptsToPass: number,
): EssayScore {
  const totalConcepts = requiredConcepts.length;
  const foundCount = aiResult.concepts_found.length;

  // Fórmula: proporción de conceptos encontrados * 10, redondeado a 1 decimal
  const score = parseFloat(((foundCount / totalConcepts) * 10).toFixed(1));
  const passingScore = parseFloat(
    ((minimumConceptsToPass / totalConcepts) * 10).toFixed(1),
  );

  return {
    score,
    maxPossibleScore: 10.0,
    passed: score >= passingScore,
    aiFeedback: aiResult,
  };
}
