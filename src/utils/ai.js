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
  const systemPrompt = `You are a knowledgeable tutor helping readers understand concepts from any field.
You can explain topics from:
- Mathematics and Science (physics, chemistry, biology)
- Self-help and Personal Development (habits, mindset, productivity)
- Psychology and Social Sciences (behavior, relationships, society)
- History and Philosophy (events, ideas, thinkers)
- Literature and Arts (themes, analysis, context)
- Business and Economics (strategy, markets, finance)

Provide clear, concise explanations that:
- Use simple language first, then introduce technical terms
- Include helpful analogies or real-world examples when appropriate
- Are educational and encouraging
Keep responses under 150 words.`;

  const userMessage = context
    ? `Context: ${context}\n\nPlease explain: "${selectedText}"`
    : `Please explain this concept or idea: "${selectedText}"`;

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

// Analyze or solve a problem/question step by step
export async function solveProblem(problemText, context = '') {
  const systemPrompt = `You are an expert tutor helping readers analyze and understand complex ideas.
You can help with:
- Mathematical problems and calculations
- Scientific questions and experiments
- Analyzing arguments and philosophical questions
- Breaking down self-help strategies into actionable steps
- Understanding historical events and their causes
- Literary analysis and interpretation
- Business case studies and decision-making

Provide step-by-step analysis that:
- Breaks down the topic into clear steps or components
- Explains the reasoning behind each point
- Shows relevant details, examples, or evidence
- Highlights the key takeaway or conclusion
Use bullet points or numbered lists for clarity.`;

  const userMessage = context
    ? `Context: ${context}\n\nPlease analyze or explain this step by step: "${problemText}"`
    : `Please analyze or explain this step by step: "${problemText}"`;

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
    // Mathematics
    'derivative': 'A derivative measures how fast something changes. Think of it like a speedometer — it tells you your speed at any exact moment, not your average speed over a trip. Mathematically, it\'s the slope of the tangent line to a curve at any point.',
    'limit': 'A limit describes what value a function approaches as the input gets closer to a specific point. Like walking halfway to a wall, then half of that remaining distance, forever getting closer but mathematically defining the destination.',
    'integral': 'An integral is the reverse of a derivative. While derivatives measure instantaneous rates of change, integrals measure accumulation — like finding the total distance traveled from a speed function.',
    'function': 'A function is a rule that assigns exactly one output to each input. Think of it as a machine: you put something in, and you get something specific out.',

    // Self-Help & Personal Development
    'habit': 'A habit is a behavior that becomes automatic through repetition. Habits form through a loop: cue (trigger), routine (the behavior), and reward (the benefit). Building good habits requires making them obvious, attractive, easy, and satisfying.',
    'mindset': 'Mindset is your collection of beliefs about yourself and your abilities. A "growth mindset" believes abilities can be developed through effort, while a "fixed mindset" believes they\'re unchangeable. Your mindset shapes how you approach challenges.',
    'procrastination': 'Procrastination is delaying important tasks despite knowing the negative consequences. It\'s often caused by fear of failure, perfectionism, or feeling overwhelmed. Breaking tasks into smaller steps and starting with just 2 minutes can help overcome it.',
    'productivity': 'Productivity is about achieving meaningful results, not just staying busy. It involves prioritizing important tasks, eliminating distractions, and working in focused blocks. Quality of output matters more than hours worked.',
    'resilience': 'Resilience is the ability to recover from setbacks and adapt to challenges. It\'s built through developing strong relationships, maintaining perspective, practicing self-care, and viewing difficulties as opportunities for growth.',
    'motivation': 'Motivation is the drive that initiates and sustains goal-directed behavior. Intrinsic motivation (internal satisfaction) is more sustainable than extrinsic motivation (external rewards). Purpose, autonomy, and mastery are key drivers.',
    'self-discipline': 'Self-discipline is the ability to control impulses and stay focused on long-term goals. It\'s like a muscle that strengthens with use. Building routines, removing temptations, and starting small help develop it.',
    'emotional intelligence': 'Emotional intelligence (EQ) is the ability to recognize, understand, and manage emotions in yourself and others. It includes self-awareness, self-regulation, empathy, and social skills. High EQ often predicts success better than IQ.',

    // Psychology
    'cognitive bias': 'A cognitive bias is a systematic pattern of deviation from rational thinking. Our brains use mental shortcuts that can lead to errors in judgment. Examples include confirmation bias (favoring information that confirms beliefs) and anchoring (over-relying on first information received).',
    'anxiety': 'Anxiety is the body\'s natural response to perceived threats. While some anxiety is normal, excessive anxiety can be debilitating. It involves physical symptoms (racing heart, tension) and mental symptoms (worry, fear). Techniques like deep breathing and cognitive reframing can help manage it.',
    'depression': 'Depression is more than sadness — it\'s a persistent condition affecting mood, thoughts, and daily functioning. It involves changes in sleep, appetite, energy, and interest in activities. Professional help, social support, and healthy habits are important for recovery.',
    'self-esteem': 'Self-esteem is your overall sense of personal worth. It\'s built through accomplishments, positive relationships, and self-acceptance. Healthy self-esteem means valuing yourself while acknowledging areas for growth.',

    // Philosophy & Ideas
    'stoicism': 'Stoicism is a philosophy teaching that we can\'t control external events, only our responses to them. It emphasizes virtue, wisdom, and emotional resilience. Key practices include focusing on what you can control and accepting what you cannot.',
    'ethics': 'Ethics is the study of right and wrong behavior. It asks questions like "What should I do?" and "What kind of person should I be?" Different ethical frameworks include consequentialism (outcomes matter), deontology (rules matter), and virtue ethics (character matters).',
    'existentialism': 'Existentialism is a philosophy emphasizing individual freedom and responsibility. It argues that life has no inherent meaning — we must create our own purpose. This freedom can cause anxiety but also empowers authentic living.',

    // Business & Economics
    'compound interest': 'Compound interest is earning interest on both your principal and accumulated interest. It\'s why starting to save early matters so much — money grows exponentially over time. Einstein reportedly called it the "eighth wonder of the world."',
    'supply and demand': 'Supply and demand describes how prices are determined in markets. When demand exceeds supply, prices rise. When supply exceeds demand, prices fall. The equilibrium price is where supply meets demand.',
    'opportunity cost': 'Opportunity cost is what you give up when making a choice. Every decision has trade-offs — choosing one option means forgoing others. Understanding opportunity costs helps make better decisions.',

    // Literature & Writing
    'metaphor': 'A metaphor is a figure of speech that describes something by saying it IS something else. Unlike a simile (which uses "like" or "as"), a metaphor makes a direct comparison. "Life is a journey" is a metaphor that shapes how we think about experiences.',
    'theme': 'A theme is the central idea or underlying meaning in a work of literature. It\'s not the plot (what happens) but the deeper message about life, society, or human nature that the author explores through the story.',
    'irony': 'Irony is when there\'s a contrast between expectation and reality. Verbal irony says the opposite of what\'s meant. Situational irony is when outcomes differ from expectations. Dramatic irony is when the audience knows something characters don\'t.',

    // History
    'revolution': 'A revolution is a fundamental change in power or organizational structures, often occurring quickly. Revolutions can be political (French Revolution), industrial (technological change), or social (cultural shifts). They typically arise from widespread dissatisfaction with existing conditions.',
    'democracy': 'Democracy is a system of government where citizens exercise power through voting. It comes from Greek words meaning "rule by the people." Modern democracies typically include elections, civil liberties, and rule of law.',
    'colonialism': 'Colonialism is the practice of acquiring political control over another country, occupying it, and exploiting its resources and people. Its legacy continues to affect global economics, politics, and social structures today.'
  };

  for (const [key, explanation] of Object.entries(explanations)) {
    if (lowerText.includes(key)) {
      return explanation;
    }
  }

  return `This is an interesting concept worth exploring further. "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}" relates to important ideas in its field. For a detailed AI-powered explanation, ensure the API is configured in settings.`;
}

function getFallbackSolution(problem) {
  const lowerProblem = problem.toLowerCase();

  // Check for math-related content
  if (lowerProblem.match(/[0-9x²³⁴⁵⁶⁷⁸⁹\+\-\*\/\=]/) && lowerProblem.match(/derivative|integral|equation|solve|calculate/)) {
    return `To solve this mathematical problem:

1. **Identify** the type of problem (algebra, calculus, etc.)
2. **Recall** the relevant formulas or rules
3. **Apply** the techniques step by step
4. **Simplify** your result
5. **Verify** by checking your answer

For detailed step-by-step solutions, ensure the AI API is configured.`;
  }

  // Self-help / Personal development
  if (lowerProblem.match(/habit|goal|motivation|productivity|success|improve|change/)) {
    return `To approach this personal development challenge:

1. **Define clearly** what you want to achieve
2. **Break it down** into smaller, actionable steps
3. **Identify obstacles** that might get in your way
4. **Create a system** rather than relying on willpower alone
5. **Track progress** and adjust your approach as needed
6. **Stay consistent** — small daily actions compound over time

**Key insight:** Focus on becoming the type of person who achieves this goal, not just the goal itself.`;
  }

  // Analysis / Critical thinking
  if (lowerProblem.match(/why|how|explain|analyze|understand|cause|effect|reason/)) {
    return `To analyze this topic:

1. **Identify** the key components or factors involved
2. **Examine** the relationships between these elements
3. **Consider** multiple perspectives or interpretations
4. **Look for** evidence supporting different viewpoints
5. **Draw conclusions** based on the analysis
6. **Reflect** on implications and applications

**Tip:** Ask "why" multiple times to get to deeper causes and meanings.`;
  }

  // Default general approach
  return `To explore this topic further:

1. **Break down** the main concept into its key parts
2. **Define** any important terms or ideas
3. **Look for** connections to things you already know
4. **Consider** real-world examples or applications
5. **Identify** what questions remain unanswered

For detailed AI-powered analysis, ensure the API is configured in settings.`;
}

function getFallbackQuiz(content) {
  const lowerContent = content.toLowerCase();

  // Math-related content
  if (lowerContent.match(/derivative|calculus|integral/)) {
    return [
      { q: 'What does the derivative represent geometrically?', a: 'The slope of the tangent line at a point' },
      { q: 'What is the derivative of x⁷ using the Power Rule?', a: '7x⁶' },
      { q: 'What is the derivative of any constant?', a: 'Zero (0)' }
    ];
  }

  // Self-help / Personal development
  if (lowerContent.match(/habit|routine|discipline|motivation|goal/)) {
    return [
      { q: 'What are the three parts of the habit loop?', a: 'Cue (trigger), Routine (behavior), and Reward (benefit)' },
      { q: 'Why is consistency more important than intensity?', a: 'Small daily actions compound over time, building lasting change' },
      { q: 'What is the difference between a goal and a system?', a: 'Goals are outcomes you want; systems are processes that lead to outcomes' }
    ];
  }

  // Psychology
  if (lowerContent.match(/psychology|mind|behavior|emotion|cognitive/)) {
    return [
      { q: 'What is cognitive bias?', a: 'A systematic pattern of deviation from rational thinking' },
      { q: 'What is the difference between fixed and growth mindset?', a: 'Fixed believes abilities are unchangeable; growth believes they can be developed' },
      { q: 'Why is emotional intelligence important?', a: 'It helps manage emotions and relationships, often predicting success better than IQ' }
    ];
  }

  // History / Social
  if (lowerContent.match(/history|revolution|war|society|political|government/)) {
    return [
      { q: 'What factors typically lead to major historical changes?', a: 'Economic pressures, social inequality, new ideas, and leadership' },
      { q: 'Why is understanding history important?', a: 'It helps us understand the present and make better decisions for the future' },
      { q: 'What is the relationship between cause and effect in history?', a: 'Events have multiple causes and consequences that connect across time' }
    ];
  }

  // Default general questions
  return [
    { q: 'What is the main idea presented in this passage?', a: 'Identify the central theme or argument the author is making' },
    { q: 'How does this concept connect to real-world situations?', a: 'Consider practical applications and examples from everyday life' },
    { q: 'What questions does this passage raise for further exploration?', a: 'Think about what the author leaves unexplained or what you\'d like to know more about' }
  ];
}

function getFallbackFlashcards(text) {
  const lowerText = text.toLowerCase();

  // Math
  if (lowerText.match(/derivative|calculus|integral/)) {
    return [
      { front: 'What is a derivative?', back: 'A measure of the rate of change of a function' },
      { front: 'Power Rule formula', back: 'd/dx[xⁿ] = nxⁿ⁻¹' },
      { front: 'Derivative of a constant', back: 'Zero (0)' }
    ];
  }

  // Self-help
  if (lowerText.match(/habit|goal|motivation|success/)) {
    return [
      { front: 'The Habit Loop', back: 'Cue → Routine → Reward' },
      { front: 'Key to building habits', back: 'Make it obvious, attractive, easy, and satisfying' },
      { front: 'Systems vs Goals', back: 'Systems are daily processes; goals are desired outcomes' }
    ];
  }

  // Psychology
  if (lowerText.match(/mindset|psychology|emotion|cognitive/)) {
    return [
      { front: 'Growth Mindset', back: 'Belief that abilities can be developed through effort and learning' },
      { front: 'Cognitive Bias', back: 'A systematic error in thinking that affects decisions and judgments' },
      { front: 'Emotional Intelligence', back: 'Ability to recognize, understand, and manage emotions' }
    ];
  }

  // Extract key terms from the text for generic flashcards
  const shortText = text.slice(0, 150);
  return [
    { front: 'Key concept', back: shortText + (text.length > 150 ? '...' : '') },
    { front: 'Why does this matter?', back: 'It provides important insight for understanding the broader topic' },
    { front: 'How can you apply this?', back: 'Reflect on how this connects to your own experience or goals' }
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
