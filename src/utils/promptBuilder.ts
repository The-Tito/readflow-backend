// REGLAS ADICIONALES POR TIPO DE EVALUACIÓN

const FILL_IN_THE_BLANK_RULES = `
Reglas adicionales para el tipo "Completar":
- Cada párrafo debe tener EXACTAMENTE 5 blanks marcados como [BLANK] distribuidos naturalmente en el texto.
- El array "blanks" debe tener EXACTAMENTE 5 objetos con "position" del 1 al 5 en orden de aparición.
- El array "word_bank" debe tener EXACTAMENTE 7 entradas: las 5 respuestas correctas (en el mismo orden de aparición en el párrafo) más 2 palabras de distracción plausibles pero incorrectas.
- CRÍTICO: Si una misma palabra aparece más de una vez en los blanks, debes incluirla tantas veces como aparezca en el word_bank. Ejemplo: si "plataforma" es la respuesta de 3 blanks, el word_bank debe contener "plataforma" 3 veces. El word_bank es una lista con repeticiones permitidas, NO un conjunto de palabras únicas.
- Para evitar repeticiones, PREFIERE elegir 5 palabras distintas para los blanks de cada párrafo. Solo repite una palabra si es absolutamente necesario para el contexto.
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
            "paragraph": "El [BLANK] es fundamental para el aprendizaje porque permite consolidar el [BLANK] a través de la práctica. Un buen [BLANK] incluye técnicas de revisión espaciada que fortalecen la [BLANK] y mejoran la [BLANK] a largo plazo.",
            "blanks": [
              { "position": 1, "correct_answer": "estudio" },
              { "position": 2, "correct_answer": "conocimiento" },
              { "position": 3, "correct_answer": "estudio" },
              { "position": 4, "correct_answer": "memoria" },
              { "position": 5, "correct_answer": "retención" }
            ],
            "word_bank": ["estudio", "conocimiento", "estudio", "memoria", "retención", "distractor_1", "distractor_2"]
          }
        ]
      }`;
// NOTA: el word_bank repite "estudio" 2 veces porque aparece en 2 blanks.
// Cada entrada del word_bank corresponde 1 a 1 con cada blank en orden de aparición.
// PREFERENCIA: elige párrafos donde las 5 palabras blanks sean distintas para evitar repeticiones.`

const QUESTION_SCHEMAS: Record<number, string> = {
  1: `
  "t0": ${MULTIPLE_CHOICE_QUESTION_EXAMPLE},
  "t48": ${MULTIPLE_CHOICE_QUESTION_EXAMPLE}
  `,
  2: `
  "t0": ${FILL_IN_THE_BLANK_QUESTION_EXAMPLE},
  "t48": ${FILL_IN_THE_BLANK_QUESTION_EXAMPLE}
  `,
  3: `
  "evaluation_criteria": {
    "required_concepts": ["concepto_clave_1", "concepto_clave_2", "concepto_clave_3", "concepto_clave_4", "concepto_clave_5"],
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
  1: "Genera exactamente 10 preguntas DISTINTAS en t0 y 10 preguntas DISTINTAS en t48. Ninguna pregunta debe repetirse entre sets.",
  2: "Genera exactamente 2 párrafos en t0 (cada uno con 5 blanks) y 2 párrafos DISTINTOS en t48. Ningún párrafo ni palabra debe repetirse entre sets.",
  3: "Extrae exactamente 5 conceptos clave del documento para 'required_concepts'. Estos serán usados para evaluar la síntesis libre del usuario.",
};

// ── Configuración del resumen por nivel de dificultad ──────────────────────
const SUMMARY_CONFIG: Record<
  string,
  { minWords: number; maxWords: number; instructions: string }
> = {
  Básico: {
    minWords: 200,
    maxWords: 400,
    instructions: `
- Usa lenguaje simple y accesible, evita tecnicismos innecesarios.
- Explica los conceptos como si el lector no tuviera conocimiento previo del tema.
- Prioriza los puntos más importantes y fáciles de entender.
- Usa oraciones cortas y directas.`,
  },
  Intermedio: {
    minWords: 400,
    maxWords: 700,
    instructions: `
- Usa lenguaje claro pero introduce la terminología específica del tema.
- Cubre los puntos principales y secundarios del documento.
- Explica las relaciones entre los conceptos.
- Mantén un equilibrio entre profundidad y accesibilidad.`,
  },
  Avanzado: {
    minWords: 700,
    maxWords: 1200,
    instructions: `
- Usa terminología técnica y especializada del dominio.
- Cubre en profundidad todos los conceptos, argumentos y evidencias del documento.
- Analiza las relaciones causales y las implicaciones de los temas tratados.
- Incluye matices, excepciones y casos especiales mencionados en el documento.
- El resumen debe ser suficientemente completo para que el estudiante pueda responder preguntas avanzadas sin releer el documento original.`,
  },
};

// ── BUILDER PRINCIPAL ──────────────────────────────────────────────────────

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

    const summaryConfig =
      SUMMARY_CONFIG[summaryDifficultyName] ?? SUMMARY_CONFIG["Intermedio"];

    return `
Actúa como un profesor universitario experto en síntesis y evaluación académica.
Analiza exhaustivamente el documento proporcionado en su totalidad antes de generar la respuesta.

Parámetros de la sesión:
- Nivel de dificultad: ${summaryDifficultyName}

Tu tarea es generar ÚNICAMENTE un objeto JSON válido con esta estructura exacta.
No incluyas explicaciones, comentarios, ni bloques de código Markdown (\`\`\`json).
No repitas los valores de ejemplo; genera contenido real basado en el documento.

{
  "title": "Título descriptivo y relevante extraído del tema principal del documento",
  "summary": "Resumen completo del documento siguiendo las instrucciones de nivel indicadas abajo",
  "key_concepts": ["Concepto clave 1", "Concepto clave 2", "Concepto clave 3"],
  ${questionSchema}
}

── INSTRUCCIONES PARA EL RESUMEN ──────────────────────────────────────────
Extensión requerida: entre ${summaryConfig!!.minWords} y ${summaryConfig!!.maxWords} palabras.
El resumen debe cubrir PROPORCIONALMENTE el contenido del documento. Si el documento es extenso,
asegúrate de cubrir todas las secciones importantes, no solo la introducción.
Estructura recomendada:
1. Introducción: contexto y objetivo del documento
2. Desarrollo: puntos principales, conceptos, datos y argumentos
3. Conclusión: síntesis final y relevancia del tema
IMPORTANTE: Separa cada párrafo con un salto de línea doble (\\n\\n) dentro del string JSON.
Cada sección debe ser un párrafo independiente. No escribas el resumen como un bloque continuo de texto.
${summaryConfig!!.instructions}

── REGLAS GENERALES ────────────────────────────────────────────────────────
1. ${questionCountRule}
2. Adapta la complejidad de las preguntas al nivel: ${summaryDifficultyName}.
3. Basa TODO el contenido ÚNICAMENTE en el documento proporcionado. No inventes información.
4. La salida debe ser JSON parseable directamente con JSON.parse(). Cualquier otro formato es incorrecto.
${additionalRules}
    `.trim();
  }

  // ── PROMPT PARA EVALUAR REDACCIÓN ──────────────────────────────────────────

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

// ── SCORING DE REDACCIÓN ───────────────────────────────────────────────────

const ESSAY_PASSING_THRESHOLD = 0.6; // 60% de conceptos requeridos

export interface EssayEvaluationResult {
  concepts_found: string[];
  concepts_missing: string[];
  relationships_identified: string[];
  feedback: string;
}

export interface EssayScore {
  score: number;
  maxPossibleScore: number;
  passed: boolean;
  aiFeedback: EssayEvaluationResult;
}

export function calculateEssayScore(
  aiResult: EssayEvaluationResult,
  requiredConcepts: string[],
): EssayScore {
  const totalConcepts = requiredConcepts.length;
  const foundCount = aiResult.concepts_found.length;
  const minimumToPass = Math.ceil(totalConcepts * ESSAY_PASSING_THRESHOLD);

  const score = parseFloat(((foundCount / totalConcepts) * 100).toFixed(1));
  const passingScore = parseFloat(
    ((minimumToPass / totalConcepts) * 100).toFixed(1),
  );

  return {
    score,
    maxPossibleScore: 100.0,
    passed: score >= passingScore,
    aiFeedback: aiResult,
  };
}
