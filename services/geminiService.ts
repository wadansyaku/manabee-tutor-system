import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SummaryJson, HomeworkJson, QuizJson } from "../types";

// NOTE: In a real app, never expose API keys on the client.
// This is for demonstration purposes within the "Build" environment.
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Schemas for Structured Output

const summarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    lesson_goal: { type: Type.STRING, description: "The main goal of this lesson" },
    what_we_did: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of topics covered" },
    what_went_well: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Things the student did well" },
    issues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Areas where the student struggled" },
    next_actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action items for next time" },
    parent_message: { type: Type.STRING, description: "A polite message to the guardian (max 200 chars)" },
    quiz_focus: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key topics to quiz on" },
  },
  required: ["lesson_goal", "what_we_did", "what_went_well", "issues", "next_actions", "parent_message", "quiz_focus"]
};

const homeworkSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          due_days_from_now: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ["practice", "review", "challenge"] },
          estimated_minutes: { type: Type.INTEGER }
        },
        required: ["title", "due_days_from_now", "type", "estimated_minutes"]
      }
    }
  }
};

const quizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["mcq", "short"] },
          q: { type: Type.STRING },
          choices: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
          explain: { type: Type.STRING }
        },
        required: ["type", "q", "answer", "explain"]
      }
    }
  }
};

export const generateLessonContent = async (transcript: string, studentContext: string) => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing");
    throw new Error("API Key is missing. Please set it in the environment.");
  }

  // We run these in parallel for efficiency
  const summaryPromise = ai.models.generateContent({
    model: MODEL_NAME,
    contents: `
      Based on the following lesson transcript and student context, generate a structured summary.
      Student Context: ${studentContext}
      Transcript: ${transcript}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: summarySchema,
      temperature: 0.3, // Lower temperature for factual summary
    }
  });

  const homeworkPromise = ai.models.generateContent({
    model: MODEL_NAME,
    contents: `
      Based on the issues and covered topics in this transcript, suggest 3-5 specific homework items.
      Student Context: ${studentContext}
      Transcript: ${transcript}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: homeworkSchema,
      temperature: 0.5,
    }
  });

  const quizPromise = ai.models.generateContent({
    model: MODEL_NAME,
    contents: `
      Create a mini-quiz (3-5 questions) based on the material covered in this transcript to test understanding.
      Include a mix of Multiple Choice (mcq) and Short Answer (short).
      Student Context: ${studentContext}
      Transcript: ${transcript}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: quizSchema,
      temperature: 0.5,
    }
  });

  try {
    const [summaryRes, homeworkRes, quizRes] = await Promise.all([summaryPromise, homeworkPromise, quizPromise]);

    const summaryText = summaryRes.text;
    const homeworkText = homeworkRes.text;
    const quizText = quizRes.text;

    if (!summaryText || !homeworkText || !quizText) {
      throw new Error("Incomplete response from AI");
    }

    return {
      summary: JSON.parse(summaryText) as SummaryJson,
      homework: JSON.parse(homeworkText) as HomeworkJson,
      quiz: JSON.parse(quizText) as QuizJson
    };

  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};