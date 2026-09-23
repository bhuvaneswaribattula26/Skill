// src/lib/ai.ts — AI matching layer (Gemini preferred, fallback to null)
import { config } from '../config';

export interface MatchExplanation {
  userId: string;
  explanation: string;
}

async function explainWithGemini(pairs: { userA: string; userB: string; reason: string }[]): Promise<string[]> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const results: string[] = [];
  for (const pair of pairs) {
    const prompt = `You are SkillSwap Campus, a peer skill exchange platform. Write a single short sentence (max 20 words) explaining why ${pair.userA} and ${pair.userB} are a great match. Context: ${pair.reason}. Be friendly and direct.`;
    const result = await model.generateContent(prompt);
    results.push(result.response.text().trim());
  }
  return results;
}

export async function generateMatchExplanations(
  pairs: { userAName: string; userBName: string; reason: string }[]
): Promise<string[]> {
  if (!config.ai.geminiApiKey) {
    // Graceful fallback — no AI key
    return pairs.map(
      (p) => `${p.userAName} teaches what ${p.userBName} wants to learn, and vice versa — a natural swap!`
    );
  }

  try {
    return await explainWithGemini(
      pairs.map((p) => ({ userA: p.userAName, userB: p.userBName, reason: p.reason }))
    );
  } catch (err) {
    console.error('[AI] Gemini error:', (err as Error).message);
    return pairs.map(
      (p) => `${p.userAName} and ${p.userBName} have complementary skills — perfect for a swap!`
    );
  }
}

/**
 * Semantic skill similarity — uses Gemini to check if two skill names
 * mean the same thing (e.g. "ML" and "Machine Learning").
 * Falls back to simple string matching if no API key.
 */
export async function areSkillsSemanticallyEqual(skillA: string, skillB: string): Promise<boolean> {
  const a = skillA.toLowerCase().trim();
  const b = skillB.toLowerCase().trim();
  if (a === b) return true;

  if (!config.ai.geminiApiKey) {
    // Simple heuristic fallback
    const abbreviations: Record<string, string[]> = {
      ml: ['machine learning'],
      ai: ['artificial intelligence'],
      ds: ['data science'],
      js: ['javascript'],
      ts: ['typescript'],
      ux: ['user experience', 'ui/ux design', 'ux design'],
      ui: ['user interface', 'ui/ux design'],
    };
    return abbreviations[a]?.includes(b) || abbreviations[b]?.includes(a) || false;
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Do "${skillA}" and "${skillB}" refer to the same skill or topic? Reply with only "yes" or "no".`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim().toLowerCase().startsWith('yes');
  } catch {
    return false;
  }
}
