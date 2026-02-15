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
  const systemPrompt = `You are an expert secondary school tutor specializing in Mathematics and Science.
You help students understand topics in:
- Mathematics (algebra, geometry, trigonometry, calculus, statistics, number theory)
- Physics (mechanics, electricity, magnetism, waves, thermodynamics, optics)
- Chemistry (atomic structure, bonding, reactions, organic chemistry, stoichiometry)
- Biology (cell biology, genetics, ecology, human anatomy, evolution, microbiology)

Provide clear, concise explanations that:
- Use simple language appropriate for secondary school students (grades 7-12)
- Introduce technical terms with clear definitions
- Include helpful analogies, diagrams described in text, or real-world examples
- Show relevant formulas or equations when applicable
- Are educational and encouraging
Keep responses under 150 words.`;

  const userMessage = context
    ? `Context: ${context}\n\nPlease explain: "${selectedText}"`
    : `Please explain this math or science concept: "${selectedText}"`;

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
    return `**AI Error:** ${error.message}\n\nShowing offline explanation instead:\n\n${getFallbackExplanation(selectedText)}`;
  }
}

// Analyze or solve a problem/question step by step
export async function solveProblem(problemText, context = '') {
  const systemPrompt = `You are an expert secondary school tutor specializing in solving Mathematics and Science problems.
You help students with:
- Mathematical problems (algebra, equations, geometry, trigonometry, calculus, statistics)
- Physics problems (motion, forces, energy, circuits, waves)
- Chemistry problems (balancing equations, stoichiometry, molecular structure, reactions)
- Biology questions (genetics problems, ecology analysis, anatomy, cell processes)

Provide step-by-step solutions that:
- Identify the type of problem and relevant concepts
- List known values, unknowns, and relevant formulas
- Show each calculation or reasoning step clearly
- Include units and proper notation
- Verify the answer makes sense (check units, magnitude, direction)
- Highlight common mistakes students should avoid
Use numbered steps for clarity. Write formulas and equations clearly.`;

  const userMessage = context
    ? `Context: ${context}\n\nPlease solve this step by step: "${problemText}"`
    : `Please solve this math or science problem step by step: "${problemText}"`;

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
    return `**AI Error:** ${error.message}\n\nShowing offline solution instead:\n\n${getFallbackSolution(problemText)}`;
  }
}

// Generate quiz questions from content
export async function generateQuiz(content, numQuestions = 3) {
  const systemPrompt = `You are an expert secondary school teacher creating quiz questions for Mathematics and Science.
Generate exactly ${numQuestions} questions based on the provided content.
Focus on testing understanding of mathematical concepts, scientific principles, formulas, and problem-solving skills.
Include numerical problems where appropriate.
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
  const systemPrompt = `You are an expert secondary school teacher creating flashcards for Mathematics and Science study.
Generate exactly ${numCards} flashcards based on the provided content.
Focus on key formulas, definitions, scientific laws, and important concepts.
Include units and proper notation where relevant.
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
  const systemPrompt = `You are an expert secondary school teacher summarizing Mathematics and Science content.
Summarize the key points in 2-3 bullet points.
Focus on the most important formulas, scientific principles, definitions, and concepts.
Use proper notation and include units where applicable.`;

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
    // Mathematics - Algebra
    'derivative': 'A derivative measures how fast something changes. Think of it like a speedometer — it tells you your speed at any exact moment, not your average speed over a trip. Mathematically, it\'s the slope of the tangent line to a curve at any point. Formula: d/dx[xⁿ] = nxⁿ⁻¹.',
    'limit': 'A limit describes what value a function approaches as the input gets closer to a specific point. Like walking halfway to a wall, then half of that remaining distance — you get closer and closer. Written as lim(x→a) f(x) = L.',
    'integral': 'An integral is the reverse of a derivative. While derivatives measure instantaneous rates of change, integrals measure accumulation — like finding the total distance traveled from a speed function. The integral of xⁿ is xⁿ⁺¹/(n+1) + C.',
    'function': 'A function is a rule that assigns exactly one output to each input. Think of it as a machine: you put something in, and you get something specific out. Written as f(x), where x is the input and f(x) is the output.',
    'quadratic': 'A quadratic equation has the form ax² + bx + c = 0. It can be solved using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a. The graph of a quadratic is a parabola that opens up (if a > 0) or down (if a < 0).',
    'equation': 'An equation is a mathematical statement that two expressions are equal, using the = sign. Solving an equation means finding the value(s) of the unknown variable that make the statement true.',
    'polynomial': 'A polynomial is an expression with variables and coefficients using only addition, subtraction, multiplication, and non-negative whole number exponents. Example: 3x³ + 2x² - x + 5. The highest exponent is called the degree.',
    'logarithm': 'A logarithm answers the question: "What power must I raise the base to, to get this number?" log_b(x) = y means b^y = x. For example, log₂(8) = 3 because 2³ = 8. Logarithms are the inverse of exponentiation.',
    'exponent': 'An exponent tells you how many times to multiply a base by itself. In 2³, the base is 2 and the exponent is 3, so 2³ = 2 × 2 × 2 = 8. Key rules: aᵐ × aⁿ = aᵐ⁺ⁿ, aᵐ/aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ.',
    'slope': 'Slope measures how steep a line is. It\'s calculated as rise/run, or (y₂-y₁)/(x₂-x₁). A positive slope goes up left to right, negative goes down, zero is horizontal, and undefined is vertical. In y = mx + b, m is the slope.',
    'pythagoras': 'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c², where c is the hypotenuse (the longest side, opposite the right angle).',
    'trigonometry': 'Trigonometry studies relationships between angles and sides of triangles. The three main ratios are: sin(θ) = opposite/hypotenuse, cos(θ) = adjacent/hypotenuse, tan(θ) = opposite/adjacent. Remember: SOH-CAH-TOA.',
    'probability': 'Probability measures how likely an event is to occur, ranging from 0 (impossible) to 1 (certain). P(event) = favorable outcomes / total outcomes. For example, rolling a 3 on a die: P = 1/6.',
    'matrix': 'A matrix is a rectangular array of numbers arranged in rows and columns. Matrices are used to solve systems of equations, represent transformations, and organize data. A 2×2 matrix has 2 rows and 2 columns.',
    'vector': 'A vector is a quantity with both magnitude (size) and direction. Unlike scalars (which only have size), vectors are represented by arrows. Examples include velocity, force, and displacement. Vectors can be added, subtracted, and scaled.',
    'ratio': 'A ratio compares two quantities by division. Written as a:b or a/b. For example, if there are 3 boys and 5 girls, the ratio is 3:5. Ratios can be simplified like fractions.',
    'percentage': 'A percentage is a number expressed as a fraction of 100. To convert a fraction to a percentage, multiply by 100. For example, 3/4 = 75%. To find x% of a number: multiply the number by x/100.',
    'fraction': 'A fraction represents a part of a whole, written as numerator/denominator. To add fractions, find a common denominator. To multiply, multiply numerators and denominators. To divide, multiply by the reciprocal.',

    // Physics
    'velocity': 'Velocity is the rate of change of displacement with respect to time. Unlike speed (which is scalar), velocity is a vector — it has both magnitude and direction. Formula: v = Δd/Δt. Units: m/s.',
    'acceleration': 'Acceleration is the rate of change of velocity over time. Formula: a = Δv/Δt. Units: m/s². When an object speeds up, acceleration is positive; when it slows down (decelerating), it\'s negative.',
    'force': 'Force is a push or pull that can change an object\'s motion. Newton\'s Second Law: F = ma (force = mass × acceleration). Units: Newtons (N). Forces can be contact forces (friction, tension) or non-contact (gravity, magnetic).',
    'gravity': 'Gravity is the force of attraction between objects with mass. On Earth\'s surface, g ≈ 9.8 m/s². Weight = mass × g. Gravity keeps planets in orbit and causes objects to fall. It decreases with distance from Earth\'s center.',
    'energy': 'Energy is the ability to do work. It comes in many forms: kinetic (moving objects, KE = ½mv²), potential (stored, PE = mgh), thermal, chemical, electrical, and nuclear. Energy is conserved — it cannot be created or destroyed, only transformed.',
    'momentum': 'Momentum is mass times velocity: p = mv. It\'s a vector quantity. The law of conservation of momentum states that in a closed system, total momentum before = total momentum after a collision. Units: kg·m/s.',
    'wave': 'A wave transfers energy without transferring matter. Key properties: wavelength (λ) is crest-to-crest distance, frequency (f) is waves per second (Hz), amplitude is maximum displacement. Wave speed: v = fλ.',
    'ohm': 'Ohm\'s Law relates voltage, current, and resistance: V = IR. Voltage (V) is electrical pressure in volts, current (I) is flow of charge in amps, resistance (R) opposes current flow in ohms (Ω).',
    'circuit': 'An electrical circuit is a closed path through which current flows. Series circuits have one path (current is the same everywhere). Parallel circuits have multiple paths (voltage is the same across each branch).',
    'newton': 'Newton\'s Three Laws of Motion: 1) An object stays at rest or in motion unless a force acts on it (inertia). 2) F = ma. 3) Every action has an equal and opposite reaction. These laws describe how forces affect motion.',
    'friction': 'Friction is a force that opposes motion between surfaces in contact. Static friction prevents movement; kinetic friction acts during motion. F_friction = μ × Normal force. Friction depends on surface roughness and normal force.',
    'pressure': 'Pressure is force per unit area: P = F/A. Units: Pascals (Pa) or N/m². In fluids, pressure increases with depth: P = ρgh. Atmospheric pressure at sea level ≈ 101,325 Pa.',
    'electricity': 'Electricity is the flow of electric charge (electrons). Current (I) is measured in amps. Voltage (V) drives the current. Resistance (R) opposes it. Power = V × I. Two types: direct current (DC) and alternating current (AC).',

    // Chemistry
    'atom': 'An atom is the smallest unit of an element that retains its chemical properties. It consists of a nucleus (protons + neutrons) surrounded by electrons in energy levels. Atomic number = number of protons. Mass number = protons + neutrons.',
    'molecule': 'A molecule is two or more atoms bonded together. It\'s the smallest unit of a compound that has the compound\'s chemical properties. Examples: H₂O (water), CO₂ (carbon dioxide), O₂ (oxygen gas).',
    'ion': 'An ion is an atom or molecule with a net electric charge. Cations are positive (lost electrons), anions are negative (gained electrons). Ions form ionic bonds — for example, Na⁺ and Cl⁻ form NaCl (table salt).',
    'element': 'An element is a pure substance made of only one type of atom, identified by its atomic number. There are 118 known elements organized in the periodic table. Elements combine to form compounds.',
    'compound': 'A compound is a substance made of two or more different elements chemically bonded in fixed proportions. Water (H₂O) is a compound of hydrogen and oxygen. Compounds have different properties than their constituent elements.',
    'periodic table': 'The periodic table organizes elements by atomic number. Rows (periods) show energy levels; columns (groups) show similar properties. Metals are on the left, nonmetals on the right. Group 18 contains noble gases (very stable).',
    'chemical bond': 'A chemical bond holds atoms together. Ionic bonds transfer electrons (metal + nonmetal). Covalent bonds share electrons (nonmetal + nonmetal). Metallic bonds share electrons freely among metal atoms.',
    'reaction': 'A chemical reaction rearranges atoms to form new substances. Reactants → Products. Signs of a reaction: color change, gas produced, precipitate formed, temperature change. Mass is conserved (balanced equations).',
    'acid': 'An acid is a substance that donates H⁺ ions in solution. Acids have pH < 7, taste sour, and turn litmus red. Strong acids (HCl, H₂SO₄) fully dissociate. The pH scale measures acidity: lower pH = more acidic.',
    'base': 'A base is a substance that accepts H⁺ ions (or donates OH⁻). Bases have pH > 7, feel slippery, and turn litmus blue. When an acid reacts with a base, they neutralize to form salt + water.',
    'mole': 'A mole is 6.022 × 10²³ particles (Avogadro\'s number). It connects the atomic scale to measurable quantities. Molar mass is the mass of one mole of a substance in grams, equal to its relative atomic/molecular mass.',
    'stoichiometry': 'Stoichiometry uses balanced equations to calculate quantities in reactions. The coefficients show mole ratios. Steps: 1) Balance the equation, 2) Convert to moles, 3) Use mole ratios, 4) Convert to desired units.',
    'oxidation': 'Oxidation is the loss of electrons; reduction is the gain of electrons (OIL RIG: Oxidation Is Loss, Reduction Is Gain). These always occur together in redox reactions. The substance that gets oxidized is the reducing agent.',

    // Biology
    'cell': 'A cell is the basic unit of life. Animal cells have a membrane, cytoplasm, nucleus, mitochondria, and ribosomes. Plant cells also have a cell wall, chloroplasts, and a large vacuole. Prokaryotic cells (bacteria) lack a nucleus.',
    'dna': 'DNA (deoxyribonucleic acid) is the molecule that carries genetic instructions. It has a double helix structure with base pairs: A-T (adenine-thymine) and G-C (guanine-cytosine). DNA → RNA → Protein is the central dogma.',
    'photosynthesis': 'Photosynthesis is how plants convert light energy into chemical energy (glucose). Equation: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. It occurs in chloroplasts and requires sunlight, carbon dioxide, and water.',
    'respiration': 'Cellular respiration breaks down glucose to release energy (ATP). Equation: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy. It occurs in mitochondria. Aerobic respiration needs oxygen; anaerobic does not.',
    'mitosis': 'Mitosis is cell division that produces two identical daughter cells. Stages: Prophase → Metaphase → Anaphase → Telophase. It\'s used for growth and repair. Each daughter cell has the same number of chromosomes as the parent.',
    'meiosis': 'Meiosis is cell division that produces four genetically different sex cells (gametes) with half the chromosomes. It involves two divisions and crossing over, creating genetic variation essential for evolution.',
    'evolution': 'Evolution is the change in inherited characteristics of a population over generations. Natural selection drives evolution: organisms with favorable traits survive and reproduce more. Evidence comes from fossils, DNA, and comparative anatomy.',
    'ecosystem': 'An ecosystem is a community of living organisms interacting with their physical environment. Energy flows through food chains/webs (producers → consumers → decomposers). Matter cycles through the ecosystem (water, carbon, nitrogen cycles).',
    'genetics': 'Genetics is the study of heredity. Genes are segments of DNA that code for proteins. Alleles are different versions of a gene. Dominant alleles (A) mask recessive ones (a). Punnett squares predict offspring genotypes.',
    'enzyme': 'An enzyme is a biological catalyst that speeds up chemical reactions without being consumed. Enzymes are specific to their substrates (lock and key model). They work best at an optimal temperature and pH.',
    'osmosis': 'Osmosis is the movement of water molecules across a semi-permeable membrane from an area of high water concentration to low water concentration. It\'s a special case of diffusion. Important for cell function and water balance.'
  };

  for (const [key, explanation] of Object.entries(explanations)) {
    if (lowerText.includes(key)) {
      return explanation;
    }
  }

  // Generate a smart response based on the text content
  const words = text.split(/\s+/).filter(w => w.length > 3);
  const keyTerms = words.slice(0, 5).join(', ');

  return `**Understanding "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"**

This passage discusses concepts related to ${keyTerms || 'the selected topic'}.

**Study tips:**
• Identify any formulas, equations, or scientific laws mentioned
• Look for key definitions and technical terms
• Check if there are units or measurements to pay attention to

**To deepen understanding:**
1. Re-read the surrounding context for additional clarity
2. Write down any formulas and practice using them
3. Try to connect this concept to experiments or real-world examples
4. Work through practice problems related to this topic

This concept is part of your Mathematics or Science studies. Take notes, practice problems, and revisit it as you progress.`;
}

function getFallbackSolution(problem) {
  const lowerProblem = problem.toLowerCase();

  // Mathematics problems
  if (lowerProblem.match(/[0-9x²³⁴⁵⁶⁷⁸⁹\+\-\*\/\=]/) || lowerProblem.match(/derivative|integral|equation|solve|calculate|graph|factor|simplify/)) {
    return `**Mathematical Problem — Step-by-Step Approach**

1. **Identify** the problem type (algebra, calculus, geometry, trigonometry, etc.)
2. **List** known values, unknowns, and relevant formulas
3. **Set up** the equation or expression
4. **Apply** techniques step by step, showing your work
5. **Simplify** the result completely
6. **Verify** by substituting back or using estimation

**Common approaches:**
• For derivatives: Use power rule (d/dx[xⁿ] = nxⁿ⁻¹), product rule, or chain rule
• For integrals: Try substitution or integration by parts
• For equations: Isolate the variable systematically
• For quadratics: Use factoring, completing the square, or the quadratic formula
• For geometry: Draw a diagram and label all known values

**Remember:** Always include units and check that your answer makes sense.`;
  }

  // Physics problems
  if (lowerProblem.match(/velocity|acceleration|force|energy|momentum|circuit|wave|gravity|friction|pressure|electric|magnetic|newton|mass|weight/)) {
    return `**Physics Problem — Step-by-Step Approach**

1. **Read** the problem carefully and identify what is given and what is asked
2. **Draw** a diagram if applicable (free body diagram, circuit diagram, etc.)
3. **List** known quantities with their units
4. **Identify** the relevant formula(s)
5. **Substitute** values and solve for the unknown
6. **Check** units and whether the answer is reasonable

**Key formulas:**
• Motion: v = u + at, s = ut + ½at², v² = u² + 2as
• Force: F = ma, W = mg
• Energy: KE = ½mv², PE = mgh, W = Fd
• Electricity: V = IR, P = VI
• Waves: v = fλ

**Remember:** Always include units in every step.`;
  }

  // Chemistry problems
  if (lowerProblem.match(/atom|molecule|element|compound|reaction|acid|base|mole|bond|ion|electron|proton|ph|solution|concentration|gas/)) {
    return `**Chemistry Problem — Step-by-Step Approach**

1. **Identify** the type of problem (balancing equations, stoichiometry, pH, etc.)
2. **Write** the chemical equation if applicable
3. **Balance** the equation (atoms must be equal on both sides)
4. **Convert** given quantities to moles if needed
5. **Use** mole ratios from the balanced equation
6. **Calculate** the final answer with correct units

**Key concepts:**
• Molar mass = relative atomic/molecular mass in grams
• 1 mole = 6.022 × 10²³ particles
• pH = -log[H⁺], pH 7 is neutral
• Balancing: adjust coefficients, never subscripts

**Remember:** Check that atoms are balanced and units are consistent.`;
  }

  // Biology problems
  if (lowerProblem.match(/cell|dna|gene|protein|photosynthesis|respiration|mitosis|meiosis|evolution|ecosystem|enzyme|organism|species|chromosome|allele/)) {
    return `**Biology Problem — Step-by-Step Approach**

1. **Identify** the biological concept involved
2. **Recall** relevant processes, structures, or cycles
3. **Draw** diagrams if helpful (cell structure, Punnett square, food web, etc.)
4. **Apply** the concept to the specific question
5. **Use** correct scientific terminology
6. **Check** that your answer is logical and complete

**Key concepts:**
• Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
• Respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy
• Genetics: Use Punnett squares for inheritance problems
• Ecology: Energy flows, matter cycles

**Remember:** Use proper scientific terms and explain cause-and-effect relationships.`;
  }

  // Default science/math approach
  const sentences = problem.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const mainPoint = sentences[0]?.trim() || problem.slice(0, 100);

  return `**Problem Analysis**

"${mainPoint}${mainPoint.length < problem.length ? '...' : ''}"

**Step-by-step approach:**

1. **Read carefully** — identify what is given and what you need to find
2. **List** all known values, quantities, and their units
3. **Identify** relevant formulas, laws, or principles
4. **Set up** the solution with a clear method
5. **Calculate** step by step, showing your working
6. **Check** your answer — do the units work out? Is the magnitude reasonable?

**Study tips:**
• Draw diagrams to visualize the problem
• Write down all formulas before starting
• Keep track of units throughout your calculation
• Practice similar problems to build confidence`;
}

function getFallbackQuiz(content) {
  const lowerContent = content.toLowerCase();

  // Calculus
  if (lowerContent.match(/derivative|calculus|integral|limit/)) {
    return [
      { q: 'What does the derivative represent geometrically?', a: 'The slope of the tangent line at a point' },
      { q: 'What is the derivative of x⁷ using the Power Rule?', a: '7x⁶' },
      { q: 'What is the derivative of any constant?', a: 'Zero (0)' }
    ];
  }

  // Algebra
  if (lowerContent.match(/equation|quadratic|polynomial|algebra|factor|variable/)) {
    return [
      { q: 'What is the quadratic formula?', a: 'x = (-b ± √(b²-4ac)) / 2a' },
      { q: 'What does it mean to "solve" an equation?', a: 'Find the value(s) of the variable that make the equation true' },
      { q: 'How do you factor x² + 5x + 6?', a: '(x + 2)(x + 3)' }
    ];
  }

  // Geometry / Trigonometry
  if (lowerContent.match(/triangle|angle|circle|area|perimeter|pythagoras|trigonometry|sin|cos|tan/)) {
    return [
      { q: 'State the Pythagorean theorem.', a: 'a² + b² = c², where c is the hypotenuse of a right triangle' },
      { q: 'What is SOH-CAH-TOA?', a: 'Sin = Opposite/Hypotenuse, Cos = Adjacent/Hypotenuse, Tan = Opposite/Adjacent' },
      { q: 'What is the area of a circle with radius r?', a: 'A = πr²' }
    ];
  }

  // Physics
  if (lowerContent.match(/force|velocity|acceleration|energy|momentum|newton|gravity|circuit|wave|electric|pressure/)) {
    return [
      { q: 'State Newton\'s Second Law of Motion.', a: 'F = ma (Force equals mass times acceleration)' },
      { q: 'What is the formula for kinetic energy?', a: 'KE = ½mv²' },
      { q: 'State Ohm\'s Law.', a: 'V = IR (Voltage = Current × Resistance)' }
    ];
  }

  // Chemistry
  if (lowerContent.match(/atom|molecule|element|compound|reaction|acid|base|mole|bond|ion|periodic/)) {
    return [
      { q: 'What is Avogadro\'s number?', a: '6.022 × 10²³ particles per mole' },
      { q: 'What is the pH of a neutral solution?', a: '7' },
      { q: 'What type of bond forms between a metal and a nonmetal?', a: 'Ionic bond (transfer of electrons)' }
    ];
  }

  // Biology
  if (lowerContent.match(/cell|dna|gene|photosynthesis|respiration|mitosis|meiosis|evolution|ecosystem|enzyme|organism/)) {
    return [
      { q: 'What is the equation for photosynthesis?', a: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' },
      { q: 'What organelle is the "powerhouse of the cell"?', a: 'Mitochondria' },
      { q: 'What are the base pairs in DNA?', a: 'Adenine-Thymine (A-T) and Guanine-Cytosine (G-C)' }
    ];
  }

  // Default math/science questions
  return [
    { q: 'What is the main scientific concept or formula presented?', a: 'Identify the key principle, law, or equation discussed in the passage' },
    { q: 'What units or measurements are important in this topic?', a: 'Identify the relevant SI units and how quantities are measured' },
    { q: 'How would you apply this concept to solve a problem?', a: 'List the steps: identify knowns, select the formula, substitute values, solve, and check units' }
  ];
}

function getFallbackFlashcards(text) {
  const lowerText = text.toLowerCase();

  // Calculus
  if (lowerText.match(/derivative|calculus|integral|limit/)) {
    return [
      { front: 'What is a derivative?', back: 'A measure of the instantaneous rate of change of a function' },
      { front: 'Power Rule formula', back: 'd/dx[xⁿ] = nxⁿ⁻¹' },
      { front: 'What is an integral?', back: 'The reverse of differentiation — it measures accumulation (area under a curve)' }
    ];
  }

  // Algebra
  if (lowerText.match(/equation|quadratic|polynomial|algebra|factor|variable|exponent|logarithm/)) {
    return [
      { front: 'Quadratic Formula', back: 'x = (-b ± √(b²-4ac)) / 2a' },
      { front: 'Exponent rule: aᵐ × aⁿ', back: 'aᵐ⁺ⁿ (add exponents when multiplying same base)' },
      { front: 'What is a logarithm?', back: 'The inverse of exponentiation. log_b(x) = y means b^y = x' }
    ];
  }

  // Geometry / Trigonometry
  if (lowerText.match(/triangle|angle|circle|pythagoras|trigonometry|sin|cos|tan|geometry/)) {
    return [
      { front: 'Pythagorean Theorem', back: 'a² + b² = c² (for right triangles)' },
      { front: 'SOH-CAH-TOA', back: 'Sin = Opp/Hyp, Cos = Adj/Hyp, Tan = Opp/Adj' },
      { front: 'Area of a circle', back: 'A = πr²' }
    ];
  }

  // Physics
  if (lowerText.match(/force|velocity|acceleration|energy|momentum|newton|gravity|circuit|wave|electric|pressure|friction/)) {
    return [
      { front: 'Newton\'s Second Law', back: 'F = ma (Force = mass × acceleration)' },
      { front: 'Ohm\'s Law', back: 'V = IR (Voltage = Current × Resistance)' },
      { front: 'Kinetic Energy formula', back: 'KE = ½mv²' }
    ];
  }

  // Chemistry
  if (lowerText.match(/atom|molecule|element|compound|reaction|acid|base|mole|bond|ion|periodic|electron|proton/)) {
    return [
      { front: 'Avogadro\'s Number', back: '6.022 × 10²³ particles per mole' },
      { front: 'Ionic vs Covalent bonds', back: 'Ionic: transfer electrons (metal + nonmetal). Covalent: share electrons (nonmetal + nonmetal)' },
      { front: 'pH scale', back: 'pH < 7 = acid, pH 7 = neutral, pH > 7 = base' }
    ];
  }

  // Biology
  if (lowerText.match(/cell|dna|gene|photosynthesis|respiration|mitosis|meiosis|evolution|ecosystem|enzyme|organism|chromosome/)) {
    return [
      { front: 'Photosynthesis equation', back: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' },
      { front: 'DNA base pairing', back: 'Adenine-Thymine (A-T) and Guanine-Cytosine (G-C)' },
      { front: 'Mitosis vs Meiosis', back: 'Mitosis: 2 identical cells (growth/repair). Meiosis: 4 different cells with half chromosomes (gametes)' }
    ];
  }

  // Default math/science flashcards
  const shortText = text.slice(0, 150);
  return [
    { front: 'Key concept', back: shortText + (text.length > 150 ? '...' : '') },
    { front: 'What formula or law applies here?', back: 'Identify the relevant equation, principle, or scientific law from the passage' },
    { front: 'What units are used?', back: 'Identify the SI units and measurements relevant to this topic' }
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
