import { GoogleGenAI, Type } from "@google/genai";
import { ModuleData, ProblemSolvingChallenge, YouTubeVideo } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const transcribeFile = async (file: File): Promise<string> => {
    try {
        const filePart = await fileToGenerativePart(file);
        const transcriptionPrompt = { text: "Transcribe the audio from this file. Provide only the text of the transcription, without any extra commentary or formatting." };
        
        const transcriptionResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [filePart, transcriptionPrompt] },
        });

        const transcription = transcriptionResponse.text;
        if (!transcription || transcription.trim() === '') {
            throw new Error("Failed to transcribe the file. The transcription was empty.");
        }
        return transcription;
    } catch (error) {
        console.error("Error during transcription:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to transcribe file: ${error.message}`);
        }
        throw new Error("An unknown error occurred during transcription.");
    }
}

export const getYouTubeTranscript = async (video: YouTubeVideo): Promise<string> => {
    const prompt = `Based on the YouTube video titled "${video.title}" by the channel "${video.channelName}", please generate a detailed, plausible transcript or a comprehensive summary of its likely contents. This will be used for educational analysis, so capture the key topics, arguments, and examples that would likely be discussed in such a lecture.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error("Could not generate a plausible transcript for the video.");
        }
        return `A plausible transcript/summary for "${video.title}":\n\n${text}`;
    } catch (error) {
        console.error("Error generating YouTube transcript:", error);
        throw new Error("Failed to generate a transcript for the YouTube video.");
    }
};

const moduleGenerationPromptText = `You are an AI assistant for "LectureLab AI," a gamified, multimodal learning platform. Your task is to process the provided lecture transcription and generate a complete learning module in two parts.

PART 1: PRE-MODULE PREPARATION
1.  **Simple Summary:** Write a concise, high-level summary (3-4 sentences) of the entire lecture. This should be very easy to understand and suitable for a text-to-speech introduction.
2.  **Visual Task:** Based on the simple summary, create exactly 3 distinct items for a visual matching task. Each item must have a 'term' (a single key word or short phrase) and a corresponding 'image_prompt' (a clear, simple description for an AI image generator).

PART 2: DETAILED CONCEPT CHAPTERS
1.  **Key Concepts:** Identify and extract the top 5-10 most important key concepts. For each, write a concise 3-sentence summary.
2.  **Story-driven Scenes:** Create a short, imaginative story-style scene (max 200 words) set in a fictional "Concept Kingdom" that metaphorically represents the topic. The scene must include clear, vivid visual cues for image generation. Based on these cues, create a separate, concise 'image_prompt' field.
3.  **Interactive Challenges:**
    *   **Quizzes:** Generate exactly 3 quiz questions (multiple choice or short answer). For multiple-choice, provide an 'options' array; for short-answer, make 'options' an empty array. Provide the correct 'answer' and a 1-sentence 'explanation'.
    *   **Flashcards:** Create 2 distinct flashcards. Each must have a 'front' (a question or term) and a 'back' (the answer or definition).
4.  **Problem-Solving:** Devise a short 'problem_solving_challenge' with a 'scenario' (brief context) and a 'task' (what the user needs to do).
5.  **Gamification & Narration:** Devise a unique badge name and description for mastering the concept. Write a short narration script (max 2 sentences) for the story scene.`;

const moduleSchema = {
  type: Type.OBJECT,
  properties: {
    simple_summary: {
      type: Type.STRING,
      description: "A 3-4 sentence high-level summary of the entire lecture."
    },
    visual_task: {
      type: Type.ARRAY,
      description: "An array of 3 items for the visual matching task.",
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "A key word or short phrase." },
          image_prompt: { type: Type.STRING, description: "A simple visual prompt for an image generator." }
        },
        required: ['term', 'image_prompt']
      }
    },
    concepts: {
      type: Type.ARRAY,
      description: "Array of key concepts derived from the lecture.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Name of the key concept." },
          summary: { type: Type.STRING, description: "A three-sentence summary of the concept." },
          story_scene: { type: Type.STRING, description: "A story-style scene set in a 'Concept Kingdom'." },
          image_prompt: { type: Type.STRING, description: "A concise prompt for an AI image generator based on the scene." },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'answer', 'explanation']
            }
          },
          flashcards: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING, description: "The front side of the flashcard (question or term)." },
                back: { type: Type.STRING, description: "The back side of the flashcard (answer or definition)." }
              },
              required: ['front', 'back']
            }
          },
          badge: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['name', 'description']
          },
          narration: { type: Type.STRING, description: "A two-sentence narration script for the story scene." },
          problem_solving_challenge: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING, description: "A brief context for a problem." },
              task: { type: Type.STRING, description: "The task for the user to solve." }
            },
            required: ['scenario', 'task']
          }
        },
        required: ['title', 'summary', 'story_scene', 'image_prompt', 'quiz', 'flashcards', 'badge', 'narration', 'problem_solving_challenge']
      }
    }
  },
  required: ['simple_summary', 'visual_task', 'concepts']
};

export const generateModuleData = async (transcription: string): Promise<ModuleData> => {
  try {
    const fullPrompt = `${moduleGenerationPromptText}\n\nHere is the transcription:\n\n${transcription}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: moduleSchema,
        },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("The AI failed to generate the module from the transcription. This can happen with complex or lengthy content. Please try a shorter file.");
    }
    
    const cleanedJson = responseText.replace(/^```json\n|```$/g, '').trim();

    return JSON.parse(cleanedJson) as ModuleData;
  } catch (error) {
    console.error("Error generating module data:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate module concepts: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating module concepts.");
  }
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const generateImage = async (prompt: string): Promise<string> => {
    let retries = 3;
    let backoff = 1000;

    while (retries > 0) {
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A vibrant, digital art illustration for an educational module. Style: modern, clean, slightly abstract, cinematic lighting. Content: ${prompt}`,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                  aspectRatio: '16:9',
                },
            });

            if (!response.generatedImages || response.generatedImages.length === 0) {
                throw new Error("Image generation failed, no images returned.");
            }
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } catch (error) {
            if (error instanceof Error && error.message.includes('429') && retries > 0) {
                console.warn(`Rate limit hit for image generation. Retrying in ${backoff}ms... (${retries - 1} retries left)`);
                await delay(backoff);
                retries--;
                backoff *= 2; // Exponential backoff
            } else {
                console.error("Error generating image:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to generate image: ${error.message}`);
                }
                throw new Error("An unknown error occurred during image generation.");
            }
        }
    }
    
    // If all retries fail, throw an error.
    throw new Error("Failed to generate image after multiple retries due to rate limiting.");
};

export const evaluateSolution = async (conceptTitle: string, challenge: ProblemSolvingChallenge, userSolution: string): Promise<string> => {
    const prompt = `You are an AI teaching assistant. A student was given the following problem-solving challenge related to the concept of '${conceptTitle}'.

**Scenario:** ${challenge.scenario}
**Task:** ${challenge.task}

Here is the student's solution:
"${userSolution}"

Your task is to provide high-quality, explanatory feedback. Adopt a friendly, encouraging, and pedagogical tone. Structure your response as follows:
1.  **Acknowledge and Summarize:** Start by positively acknowledging their effort and briefly summarizing their approach in your own words.
2.  **What Went Well:** Identify the correct parts of their solution. Explain *why* these parts are correct and how they relate to the core concept.
3.  **Areas for Improvement:** Gently point out any incorrect parts or misconceptions. Do not just state that it's wrong; explain the underlying misunderstanding.
4.  **Guiding Hint:** Conclude with a thought-provoking question or a clear, actionable hint that guides them toward the correct path without giving away the final answer.

Ensure your feedback is detailed, constructive, and helps the student learn from their attempt. Respond only with the feedback text itself.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const feedback = response.text;
        if (!feedback) {
            throw new Error("The AI did not return any feedback.");
        }
        return feedback;
    } catch (error) {
        console.error("Error evaluating solution:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get feedback: ${error.message}`);
        }
        throw new Error("An unknown error occurred while evaluating the solution.");
    }
};

export const searchYouTube = async (query: string): Promise<YouTubeVideo[]> => {
    const prompt = `Find educational YouTube lectures or videos about "${query}". Return a JSON array of 8 results matching this schema: [{ "videoId": string, "title": string, "channelName": string }]. Do not include any text outside the JSON array.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error("The AI did not return any search results.");
        }
        
        // The model may return conversational text before or after the JSON array.
        // We find the first '[' and the last ']' to extract the JSON string robustly.
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
            console.error("AI response did not contain a valid JSON array:", text);
            throw new Error("The AI returned search results in an unexpected format. Please try rephrasing your search.");
        }
        
        const jsonString = text.substring(startIndex, endIndex + 1);

        try {
            return JSON.parse(jsonString) as YouTubeVideo[];
        } catch (e) {
            console.error("Failed to parse extracted JSON:", jsonString);
            throw new Error("The AI returned malformed JSON data from search results.");
        }

    } catch (error) {
        console.error("Error searching YouTube:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to search YouTube: ${error.message}`);
        }
        throw new Error("An unknown error occurred during the YouTube search.");
    }
};

export const summarizeAndUnderstand = async (transcript: string): Promise<string> => {
    const prompt = `Analyze the following transcript and provide a detailed summary for deep understanding. Structure your response in two parts:
1.  **Quick Summary:** A bulleted list of 3-4 key takeaways that cover the main topics.
2.  **Key Concepts:** A bulleted list of the most important concepts, terms, or arguments presented, each with a brief one-sentence explanation.
This is for a user trying to quickly grasp the core of the content.

Transcript:
---
${transcript}`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const summary = response.text;
        if (!summary) throw new Error("AI failed to generate a summary.");
        return summary;
    } catch (error) {
        console.error("Error in summarizeAndUnderstand:", error);
        throw new Error("Failed to generate summary and key concepts.");
    }
};

export const generateArticleIdeas = async (summary: string, category: string): Promise<string[]> => {
    const prompt = `Based on the following summary of a lecture, generate a list of 3 distinct and compelling article or blog post ideas with a specifically '${category}' tone.
- For 'Professional', think LinkedIn articles, whitepapers, or formal reports.
- For 'Casual Blog', think engaging, first-person stories, or listicles.
- For 'Educational', think clear, informative tutorials or "explain-it-like-I'm-10" articles.

For each idea, provide just a catchy title. Return the ideas as a JSON array of strings. Example: ["The Surprising History of...", "_ Ways to Apply...", "Why _ Matters More Than You Think"].

Summary:
---
${summary}`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const ideasText = response.text.replace(/^```json\n?|```$/g, '').trim();
        if (!ideasText) throw new Error("AI failed to generate article ideas.");
        return JSON.parse(ideasText) as string[];
    } catch (error) {
        console.error("Error in generateArticleIdeas:", error);
        throw new Error("Failed to generate article ideas.");
    }
};

export const writeArticle = async (idea: string, transcript: string): Promise<string> => {
    const prompt = `You are a skilled content writer. Write a well-structured, engaging, and informative article based on the following title/idea. Use the provided transcript as your primary source of information and context.

The article must follow standard writing guidelines:
1.  **Introduction:** Hook the reader and state the article's purpose.
2.  **Body Paragraphs:** Use subheadings (##) to organize key points. Develop each point with information from the transcript.
3.  **Conclusion:** Summarize the main takeaways and provide a final thought.

Use markdown for formatting (e.g., # Title, ## Subheading, * for lists). The article should be approximately 500-700 words.

Article Idea: "${idea}"

Source Transcript:
---
${transcript}`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const article = response.text;
        if (!article) throw new Error("AI failed to write the article.");
        return article;
    } catch (error) {
        console.error("Error in writeArticle:", error);
        throw new Error("Failed to write the article.");
    }
};