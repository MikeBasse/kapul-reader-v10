// AI Service for Kapul Reader
// Connects to backend proxy for Claude API (keeps API key secure on server)

// API Configuration - uses backend proxy
const API_CONFIG = {
  // Backend proxy endpoint (API key is stored server-side)
  endpoint: '/api/claude',
  statusEndpoint: '/api/status',
  configured: null // Will be checked from server
};

// Check if API is configured (checks server status)
export async function checkAPIStatus() {
  try {
    const response = await fetch(API_CONFIG.statusEndpoint);
    const data = await response.json();
    API_CONFIG.configured = data.configured;
    return data;
  } catch (error) {
    console.error('Failed to check API status:', error);
    API_CONFIG.configured = false;
    return { configured: false, model: 'unknown' };
  }
}

// Synchronous check (uses cached value)
export function isAPIConfigured() {
  return API_CONFIG.configured === true;
}

// Make API call to Claude via backend proxy
async function callClaudeAPI(messages, systemPrompt) {
  const response = await fetch(API_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: messages,
      system: systemPrompt
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

// Explain selected text
export async function explainText(selectedText, context = '') {
  const systemPrompt = `You are an expert tutor helping students understand academic concepts.
Provide clear, concise explanations that:
- Use simple language first, then introduce technical terms
- Include helpful analogies when appropriate
- Are educational and encouraging
Keep responses under 150 words.`;

  const userMessage = context
    ? `Context: ${context}\n\nPlease explain: "${selectedText}"`
    : `Please explain this concept: "${selectedText}"`;

  try {
    if (isAPIConfigured()) {
      return await callClaudeAPI(
        [{ role: 'user', content: userMessage }],
        systemPrompt
      );
    } else {
      return getFallbackExplanation(selectedText);
    }
  } catch (error) {
    console.error('AI Explain Error:', error);
    return getFallbackExplanation(selectedText);
  }
}

// Solve a problem step by step
export async function solveProblem(problemText, context = '') {
  const systemPrompt = `You are an expert tutor helping students solve academic problems.
Provide step-by-step solutions that:
- Break down the problem into clear steps
- Explain the reasoning behind each step
- Show all work and calculations
- Highlight the final answer
Use bullet points or numbered lists for clarity.`;

  const userMessage = context
    ? `Context: ${context}\n\nPlease solve this problem step by step: "${problemText}"`
    : `Please solve this problem step by step: "${problemText}"`;

  try {
    if (isAPIConfigured()) {
      return await callClaudeAPI(
        [{ role: 'user', content: userMessage }],
        systemPrompt
      );
    } else {
      return getFallbackSolution(problemText);
    }
  } catch (error) {
    console.error('AI Solve Error:', error);
    return getFallbackSolution(problemText);
  }
}

// Generate quiz questions from content
export async function generateQuiz(content, numQuestions = 3) {
  const systemPrompt = `You are an expert educator creating quiz questions.
Generate exactly ${numQuestions} questions based on the provided content.
Return ONLY a valid JSON array with this exact format:
[{"q": "question text", "a": "answer text"}]
No other text before or after the JSON.`;

  try {
    if (isAPIConfigured()) {
      const response = await callClaudeAPI(
        [{ role: 'user', content: `Create ${numQuestions} quiz questions from this content:\n\n${content}` }],
        systemPrompt
      );

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return getFallbackQuiz(content);
  } catch (error) {
    console.error('AI Quiz Error:', error);
    return getFallbackQuiz(content);
  }
}

// Generate flashcards from selected text
export async function generateFlashcards(text, numCards = 3) {
  const systemPrompt = `You are an expert educator creating flashcards for study.
Generate exactly ${numCards} flashcards based on the provided content.
Return ONLY a valid JSON array with this exact format:
[{"front": "question or term", "back": "answer or definition"}]
No other text before or after the JSON.`;

  try {
    if (isAPIConfigured()) {
      const response = await callClaudeAPI(
        [{ role: 'user', content: `Create ${numCards} flashcards from this content:\n\n${text}` }],
        systemPrompt
      );

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return getFallbackFlashcards(text);
  } catch (error) {
    console.error('AI Flashcard Error:', error);
    return getFallbackFlashcards(text);
  }
}

// Summarize content
export async function summarizeContent(content) {
  const systemPrompt = `You are an expert at creating concise summaries.
Summarize the key points in 2-3 bullet points.
Focus on the most important concepts and takeaways.`;

  try {
    if (isAPIConfigured()) {
      return await callClaudeAPI(
        [{ role: 'user', content: `Summarize this content:\n\n${content}` }],
        systemPrompt
      );
    }
    return 'Summary: ' + content.slice(0, 200) + '...';
  } catch (error) {
    console.error('AI Summarize Error:', error);
    return 'Summary: ' + content.slice(0, 200) + '...';
  }
}

// Fallback responses when API is not available
function getFallbackExplanation(text) {
  const lowerText = text.toLowerCase();

  const explanations = {
    'derivative': 'A derivative measures how fast something changes. Think of it like a speedometer — it tells you your speed at any exact moment, not your average speed over a trip. Mathematically, it\'s the slope of the tangent line to a curve at any point.',
    'limit': 'A limit describes what value a function approaches as the input gets closer to a specific point. Like walking halfway to a wall, then half of that remaining distance, forever getting closer but mathematically defining the destination.',
    'power rule': 'The Power Rule: To find the derivative of xⁿ, multiply by the exponent n, then subtract 1 from the exponent. So the derivative of x⁵ is 5x⁴.',
    'integral': 'An integral is the reverse of a derivative. While derivatives measure instantaneous rates of change, integrals measure accumulation — like finding the total distance traveled from a speed function.',
    'function': 'A function is a rule that assigns exactly one output to each input. Think of it as a machine: you put something in, and you get something specific out.',
    'slope': 'Slope measures the steepness of a line. It\'s calculated as "rise over run" — how much the line goes up (or down) for each unit it moves horizontally.',
    'tangent': 'A tangent line touches a curve at exactly one point and has the same slope as the curve at that point. It represents the instantaneous direction of the curve.'
  };

  for (const [key, explanation] of Object.entries(explanations)) {
    if (lowerText.includes(key)) {
      return explanation;
    }
  }

  return `This concept relates to understanding how mathematical or scientific principles work. The term "${text.slice(0, 50)}" is fundamental to deeper learning. Select specific terms for more detailed explanations.`;
}

function getFallbackSolution(problem) {
  const solutions = {
    '5x³ - 2x² + 4x - 1': `Applying the Power Rule to each term:

• 5x³ → d/dx[5x³] = 5 × 3x² = 15x²
• -2x² → d/dx[-2x²] = -2 × 2x = -4x
• 4x → d/dx[4x] = 4
• -1 → d/dx[-1] = 0 (constant)

**Answer: f'(x) = 15x² - 4x + 4**`,
    '(x² + 1)(x - 3)': `Using the Product Rule: (fg)' = f'g + fg'

Let f(x) = x² + 1, so f'(x) = 2x
Let g(x) = x - 3, so g'(x) = 1

Apply Product Rule:
= (2x)(x - 3) + (x² + 1)(1)
= 2x² - 6x + x² + 1

**Answer: 3x² - 6x + 1**`
  };

  for (const [key, solution] of Object.entries(solutions)) {
    if (problem.includes(key)) {
      return solution;
    }
  }

  return `To solve this problem:

1. Identify the type of problem and relevant rules
2. Apply the appropriate mathematical techniques
3. Simplify your result step by step
4. Verify your answer

Select a specific problem from the text for a detailed solution.`;
}

function getFallbackQuiz(content) {
  // Generate generic quiz based on content keywords
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('derivative')) {
    return [
      { q: 'What does the derivative represent geometrically?', a: 'The slope of the tangent line at a point' },
      { q: 'What is the derivative of x⁷ using the Power Rule?', a: '7x⁶' },
      { q: 'What is the derivative of any constant?', a: 'Zero (0)' }
    ];
  }

  if (lowerContent.includes('integral')) {
    return [
      { q: 'What is integration the reverse operation of?', a: 'Differentiation' },
      { q: 'What does a definite integral represent?', a: 'The area under a curve between two points' },
      { q: 'What is the integral of xⁿ?', a: 'xⁿ⁺¹/(n+1) + C' }
    ];
  }

  return [
    { q: 'What is the main concept discussed in this section?', a: 'Review the key terms and definitions presented' },
    { q: 'How would you apply this concept to a real problem?', a: 'Identify the relevant formula and substitute values' },
    { q: 'What are the prerequisites for understanding this topic?', a: 'Basic mathematical foundations and terminology' }
  ];
}

function getFallbackFlashcards(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('derivative')) {
    return [
      { front: 'What is a derivative?', back: 'A measure of the rate of change of a function' },
      { front: 'Power Rule formula', back: 'd/dx[xⁿ] = nxⁿ⁻¹' },
      { front: 'Derivative of a constant', back: 'Zero (0)' }
    ];
  }

  return [
    { front: 'Key concept from selection', back: text.slice(0, 100) },
    { front: 'Why is this important?', back: 'It forms the foundation for advanced topics' },
    { front: 'How to apply this?', back: 'Practice with example problems' }
  ];
}

// Note: API key is now managed server-side for security
// These functions are kept for backwards compatibility but do nothing on client
export function setAPIKey(key) {
  // API key is managed server-side, this is a no-op
  console.warn('setAPIKey is deprecated - API key is now managed server-side');
}

export async function getAPIStatus() {
  return await checkAPIStatus();
}
