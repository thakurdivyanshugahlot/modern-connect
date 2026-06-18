/**
 * Intent Classifier for Modern Connect
 * Categorizes user messages into distinct buckets to optimize costs and performance.
 */

export type IntentType = 'DETERMINISTIC_READ' | 'LLM_READ' | 'LLM_WRITE' | 'CONTEXT_DEPENDENT' | 'AMBIGUOUS';
export type ReadTarget = 'EMAIL' | 'CALENDAR' | 'LABELS' | 'UNKNOWN';

const emailPatterns = [
  /how many (unread )?emails/i,
  /list (my )?unread/i,
  /count (my )?emails/i,
  /how many emails (did i get|from)/i,
  /unread count/i,
  /inbox count/i,
];

const calendarPatterns = [
  /do i have (any )?meetings today/i,
  /what'?s my next meeting/i,
  /what('s| is) on my calendar today/i,
  /do i have (any )?events today/i,
  /today('s)? (events|meetings|schedule)/i,
  /how many meetings (do i have|today)/i
];

const labelPatterns = [
  /show (my )?labels/i,
  /list (my )?labels/i,
  /what labels (do i have|exist)/i,
];

const contextDependentPatterns = [
  /\b(it|that|those|them|they)\b/i
];

export function classifyIntent(message: string): IntentType {
  const msg = message.toLowerCase().trim();

  // 1. LLM_WRITE - High priority catch for state-changing actions
  const writeKeywords = [
    'send', 'reply', 'draft', 'write', 'compose', 'create', 'schedule', 
    'postpone', 'move', 'delete', 'remove', 'update', 'cancel', 'inform',
    'forward', 'accept', 'decline', 'reschedule', 'invite', 'mark', 'archive', 'set up'
  ];
  if (writeKeywords.some(keyword => msg.includes(keyword))) {
    return 'LLM_WRITE';
  }

  // 2. CONTEXT_DEPENDENT - Queries using pronouns that require conversation history
  if (contextDependentPatterns.some(pattern => pattern.test(msg))) {
    return 'CONTEXT_DEPENDENT';
  }

  // 3. DETERMINISTIC_READ - Simple counts and lists
  if ([...emailPatterns, ...calendarPatterns, ...labelPatterns].some(pattern => pattern.test(msg))) {
    return 'DETERMINISTIC_READ';
  }

  // 4. LLM_READ - Informational/Summary requests
  const readKeywords = [
    'summarize', 'summary', 'about', 'what happened', 'catch up', 'analyze', 'explain',
    'show me', 'what emails', 'recent emails', 'latest emails', 'my emails'
  ];
  if (readKeywords.some(keyword => msg.includes(keyword))) {
    return 'LLM_READ';
  }

  return 'AMBIGUOUS';
}

/**
 * Identifies the target resource for a deterministic read query.
 */
export function classifyReadTarget(message: string): ReadTarget {
  if (emailPatterns.some(p => p.test(message))) return 'EMAIL';
  if (calendarPatterns.some(p => p.test(message))) return 'CALENDAR';
  if (labelPatterns.some(p => p.test(message))) return 'LABELS';
  return 'UNKNOWN';
}