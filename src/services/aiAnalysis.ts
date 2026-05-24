import { logAsyncError } from '@/types/async';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface AnalysisResult {
    grammar_score: number;
    fluency_score: number;
    relevance_score: number;
    confidence_score: number;
    overall_score: number;
    feedback: string;
    corrections: string[];
    improvements: string[];
    corrected_text: string;
}

export const analyzeAnswer = async (question: string, transcript: string, level: string): Promise<AnalysisResult> => {
    if (!transcript.trim()) {
        throw new Error('EMPTY_TRANSCRIPT');
    }

    if (!OPENAI_API_KEY) {
        if (import.meta.env.DEV) {
            console.warn("No OpenAI API Key found. Returning simulated results.");
        }
        return simulateAnalysis(transcript);
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert HR Interviewer. Analyze the candidate's answer based on their level: ${level}.
            Return JSON with:
            - grammar_score (0-10)
            - fluency_score (0-10)
            - relevance_score (0-10)
            - confidence_score (0-10) - inferred from text (hesitations, length)
            - feedback (one sentence summary)
            - corrections (array of specific grammar/phrasing corrections)
            - improvements (array of 2 short tips for next time)
            - corrected_text (improved version of their answer)`
                    },
                    {
                        role: "user",
                        content: `Question: "${question}"\nAnswer: "${transcript}"`
                    }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`AI_REQUEST_FAILED_${response.status}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('AI_EMPTY_RESPONSE');
        }
        const result = JSON.parse(content);

        // Calculate overall
        result.overall_score = Math.round((result.grammar_score + result.fluency_score + result.relevance_score + result.confidence_score) / 4);

        return result;

    } catch (error) {
        logAsyncError("ai.analyzeAnswer", error);
        throw new Error('AI_ANALYSIS_UNAVAILABLE');
    }
};

const simulateAnalysis = (text: string): AnalysisResult => {
    const wordCount = text.split(' ').length;
    const score = Math.min(10, Math.max(5, Math.floor(wordCount / 5)));

    return {
        grammar_score: score,
        fluency_score: score,
        relevance_score: score,
        confidence_score: score,
        overall_score: score,
        feedback: "Good attempt! (Simulated analysis - Add API Key for real AI feedback)",
        corrections: ["Practice speaking more fluidly."],
        improvements: ["Try to speak more confidently.", "Expand on your points."],
        corrected_text: text
    };
};

export interface WritingAnalysisResult {
    grammar_score: number;
    vocabulary_score: number;
    tone_score: number;
    overall_score: number;
    feedback: string;
    corrections: string[];
    better_version: string;
}

export const analyzeWriting = async (text: string, topic: string): Promise<WritingAnalysisResult> => {
    if (!text.trim()) {
        throw new Error('EMPTY_WRITING_TEXT');
    }

    if (!OPENAI_API_KEY) {
        return {
            grammar_score: 8,
            vocabulary_score: 7,
            tone_score: 8,
            overall_score: 8,
            feedback: "This is a simulated response. Connect OpenAI for real feedback.",
            corrections: ["Check your spelling."],
            better_version: "This is a simulated improved version of your text."
        };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert Writing Coach. Analyze the user's writing based on the topic: "${topic}".
                        Return JSON with:
                        - grammar_score (0-10)
                        - vocabulary_score (0-10)
                        - tone_score (0-10)
                        - overall_score (0-10)
                        - feedback (concise critique)
                        - corrections (list of specific fixable errors)
                        - better_version (a rewritten, professional version of the text)`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`AI_REQUEST_FAILED_${response.status}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('AI_EMPTY_RESPONSE');
        }
        return JSON.parse(content);

    } catch (error) {
        logAsyncError("ai.analyzeWriting", error);
        throw new Error('AI_ANALYSIS_UNAVAILABLE');
    }
};
export interface ConversationResponse {
    reply: string;
    feedback: 'good' | 'average' | 'bad';
    scores: {
        pronunciation: number;
        grammar: number;
        confidence: number;
    };
}

export const generateConversationResponse = async (
    history: { role: 'ai' | 'user', text: string }[],
    userText: string,
    zoneContext: string
): Promise<ConversationResponse> => {
    if (!OPENAI_API_KEY) {
        // Fallback simulation for demo purposes
        const isShort = userText.length < 5;
        return {
            reply: `(Simulated AI) That's interesting! tell me more about "${userText.substring(0, 10)}..."`,
            feedback: isShort ? 'bad' : 'good',
            scores: { pronunciation: 8, grammar: 7, confidence: 9 }
        };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a roleplay character in a language learning game.
                        Context: ${zoneContext}.
                        Your goal: Keep the conversation going naturally. Correct the user ONLY if they make a big mistake, otherwise just reply to the content.
                        
                        Return JSON with:
                        - reply: Your response as the character (keep it concise, 1-2 sentences).
                        - feedback: 'good', 'average', or 'bad' based on their grammar/relevance.
                        - scores: { pronunciation: 0-5, grammar: 0-5, confidence: 0-5 }`
                    },
                    ...history.map(h => ({ role: h.role === 'ai' ? 'assistant' : 'user', content: h.text })),
                    { role: "user", content: userText }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`AI_REQUEST_FAILED_${response.status}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('AI_EMPTY_RESPONSE');
        }
        return JSON.parse(content);

    } catch (error) {
        logAsyncError("ai.generateConversationResponse", error);
        throw new Error('AI_CONVERSATION_UNAVAILABLE');
    }
};
