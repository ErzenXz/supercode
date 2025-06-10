// Advanced query analysis and intent detection for better code search

export interface QueryIntent {
  type: 'function' | 'class' | 'variable' | 'file' | 'concept' | 'debug' | 'explain' | 'general';
  confidence: number;
  entities: string[];
  keywords: string[];
  searchTerms: string[];
  context: string;
}

export interface QueryAnalysis {
  intent: QueryIntent;
  expandedQueries: string[];
  searchStrategy: 'precise' | 'broad' | 'exploratory';
  priority: 'high' | 'medium' | 'low';
}

// Analyze user query to determine intent and optimize search strategy
export function analyzeQuery(query: string): QueryAnalysis {
  const lowerQuery = query.toLowerCase();
  const words = query.split(/\s+/);
  
  // Detect intent type
  const intent = detectIntent(lowerQuery, words);
  
  // Generate expanded queries based on intent
  const expandedQueries = generateSmartQueries(query, intent);
  
  // Determine search strategy
  const searchStrategy = determineSearchStrategy(intent, query.length);
  
  // Set priority based on specificity
  const priority = determinePriority(intent, words.length);
  
  return {
    intent,
    expandedQueries,
    searchStrategy,
    priority
  };
}

function detectIntent(lowerQuery: string, words: string[]): QueryIntent {
  const entities: string[] = [];
  const keywords: string[] = [];
  const searchTerms: string[] = [];
  
  // Function-related patterns
  if (lowerQuery.match(/\b(function|method|procedure|def|func)\b/)) {
    return {
      type: 'function',
      confidence: 0.9,
      entities: extractCodeIdentifiers(lowerQuery),
      keywords: ['function', 'method', 'implementation'],
      searchTerms: words.filter(w => w.length > 2),
      context: 'Looking for function definitions or implementations'
    };
  }
  
  // Class/Component patterns
  if (lowerQuery.match(/\b(class|component|object|interface|type)\b/)) {
    return {
      type: 'class',
      confidence: 0.9,
      entities: extractCodeIdentifiers(lowerQuery),
      keywords: ['class', 'component', 'structure'],
      searchTerms: words.filter(w => w.length > 2),
      context: 'Looking for class or component definitions'
    };
  }
  
  // Variable/Property patterns
  if (lowerQuery.match(/\b(variable|property|field|attribute|const|let|var)\b/)) {
    return {
      type: 'variable',
      confidence: 0.8,
      entities: extractCodeIdentifiers(lowerQuery),
      keywords: ['variable', 'property', 'declaration'],
      searchTerms: words.filter(w => w.length > 2),
      context: 'Looking for variable or property definitions'
    };
  }
  
  // File-related patterns
  if (lowerQuery.match(/\b(file|import|export|module|package)\b/)) {
    return {
      type: 'file',
      confidence: 0.8,
      entities: extractFileReferences(lowerQuery),
      keywords: ['file', 'module', 'import'],
      searchTerms: words.filter(w => w.length > 2),
      context: 'Looking for file or module information'
    };
  }
  
  // Debug/Error patterns
  if (lowerQuery.match(/\b(error|bug|issue|problem|fix|debug|broken|fail)\b/)) {
    return {
      type: 'debug',
      confidence: 0.8,
      entities: extractCodeIdentifiers(lowerQuery),
      keywords: ['error', 'debug', 'issue', 'fix'],
      searchTerms: words.filter(w => w.length > 2),
      context: 'Looking for debugging or error-related code'
    };
  }
  
  // Explanation patterns
  if (lowerQuery.match(/\b(how|what|why|explain|understand|work|does)\b/)) {
    return {
      type: 'explain',
      confidence: 0.7,
      entities: extractCodeIdentifiers(lowerQuery),
      keywords: ['explanation', 'understanding', 'logic'],
      searchTerms: words.filter(w => w.length > 2),
      context: 'Looking for explanations or understanding'
    };
  }
  
  // Concept patterns (algorithms, patterns, etc.)
  if (lowerQuery.match(/\b(algorithm|pattern|design|architecture|structure|flow)\b/)) {
    return {
      type: 'concept',
      confidence: 0.7,
      entities: extractConceptTerms(lowerQuery),
      keywords: ['concept', 'pattern', 'architecture'],
      searchTerms: words.filter(w => w.length > 2),
      context: 'Looking for conceptual or architectural information'
    };
  }
  
  // Default to general
  return {
    type: 'general',
    confidence: 0.5,
    entities: extractCodeIdentifiers(lowerQuery),
    keywords: words.filter(w => w.length > 3),
    searchTerms: words.filter(w => w.length > 2),
    context: 'General code search'
  };
}

function extractCodeIdentifiers(text: string): string[] {
  // Match camelCase, PascalCase, snake_case, kebab-case
  const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_-]*[a-zA-Z0-9]\b/g;
  const matches = text.match(identifierRegex) || [];
  
  // Filter out common words
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'how', 'what', 'when', 'where', 'why', 'which', 'function', 'class',
    'method', 'variable', 'property', 'component', 'file', 'import', 'export'
  ]);
  
  return matches.filter(match => 
    !commonWords.has(match.toLowerCase()) && 
    match.length > 2
  );
}

function extractFileReferences(text: string): string[] {
  const fileRegex = /\b[\w-]+\.(js|ts|jsx|tsx|py|java|cpp|c|cs|php|rb|go|rs)\b/g;
  return text.match(fileRegex) || [];
}

function extractConceptTerms(text: string): string[] {
  const conceptRegex = /\b(singleton|factory|observer|mvc|mvvm|rest|api|database|auth|cache|queue)\b/gi;
  return text.match(conceptRegex) || [];
}

function generateSmartQueries(originalQuery: string, intent: QueryIntent): string[] {
  const queries: string[] = [];
  
  switch (intent.type) {
    case 'function':
      queries.push(`${originalQuery} implementation`);
      queries.push(`${originalQuery} definition`);
      queries.push(`${originalQuery} usage example`);
      intent.entities.forEach(entity => {
        queries.push(`function ${entity}`);
        queries.push(`method ${entity}`);
      });
      break;
      
    case 'class':
      queries.push(`${originalQuery} definition`);
      queries.push(`${originalQuery} constructor`);
      queries.push(`${originalQuery} methods`);
      intent.entities.forEach(entity => {
        queries.push(`class ${entity}`);
        queries.push(`component ${entity}`);
      });
      break;
      
    case 'debug':
      queries.push(`${originalQuery} solution`);
      queries.push(`${originalQuery} fix`);
      queries.push(`error handling ${originalQuery}`);
      queries.push(`try catch ${originalQuery}`);
      break;
      
    case 'explain':
      queries.push(`${originalQuery} logic`);
      queries.push(`${originalQuery} algorithm`);
      queries.push(`${originalQuery} flow`);
      queries.push(`${originalQuery} process`);
      break;
      
    default:
      queries.push(`${originalQuery} example`);
      queries.push(`${originalQuery} usage`);
      queries.push(`${originalQuery} implementation`);
  }
  
  return queries.slice(0, 5); // Limit to 5 expanded queries
}

function determineSearchStrategy(intent: QueryIntent, queryLength: number): 'precise' | 'broad' | 'exploratory' {
  if (intent.confidence > 0.8 && intent.entities.length > 0) {
    return 'precise';
  }
  
  if (intent.type === 'explain' || intent.type === 'concept') {
    return 'broad';
  }
  
  if (queryLength < 20 || intent.confidence < 0.6) {
    return 'exploratory';
  }
  
  return 'broad';
}

function determinePriority(intent: QueryIntent, wordCount: number): 'high' | 'medium' | 'low' {
  if (intent.confidence > 0.8 && intent.entities.length > 0) {
    return 'high';
  }
  
  if (intent.type === 'debug' || wordCount > 5) {
    return 'high';
  }
  
  if (intent.confidence > 0.6) {
    return 'medium';
  }
  
  return 'low';
}
