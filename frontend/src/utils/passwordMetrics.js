import zxcvbn from 'zxcvbn';

export const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
export const STRENGTH_COLORS = ['#f87171', '#fb923c', '#facc15', '#34d399', '#10b981'];

const entropyFromLog = (log10Guess) => Math.max(0, Math.round(log10Guess * 3.32192809489));

export const detectSets = (value) => ({
  upper: /[A-Z]/.test(value),
  lower: /[a-z]/.test(value),
  number: /\d/.test(value),
  symbol: /[^A-Za-z0-9]/.test(value),
});

export const generateStrongPassword = (length = 18) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => alphabet[x % alphabet.length]).join('');
};

export function analyzePassword(password) {
  if (!password) return null;
  const analysis = zxcvbn(password);
  const entropy = entropyFromLog(analysis.guesses_log10);
  const sets = detectSets(password);
  
  // Categorize suggestions by type
  const suggestionsByCategory = {
    length: [],
    complexity: [],
    patterns: [],
    dictionary: [],
  };
  
  // Length suggestions
  if (password.length < 12) {
    suggestionsByCategory.length.push('Use 14+ characters for better security');
  } else if (password.length < 16) {
    suggestionsByCategory.length.push('Consider 16+ characters for stronger protection');
  }
  
  // Complexity suggestions
  if (!sets.upper) {
    suggestionsByCategory.complexity.push('Add uppercase letters (A-Z)');
  }
  if (!sets.lower) {
    suggestionsByCategory.complexity.push('Add lowercase letters (a-z)');
  }
  if (!sets.number) {
    suggestionsByCategory.complexity.push('Add numbers (0-9)');
  }
  if (!sets.symbol) {
    suggestionsByCategory.complexity.push('Add symbols (!@#$%^&*)');
  }
  
  // Entropy check
  if (entropy < 45) {
    suggestionsByCategory.complexity.push('Increase complexity or use a longer passphrase');
  }
  
  // Pattern checks
  const hasSequence = /(qwerty|asdf|1234|abcd|qwer|tyui|zxcv)/i.test(password);
  if (hasSequence) {
    suggestionsByCategory.patterns.push('Avoid keyboard sequences (qwerty, 1234, etc.)');
  }
  
  const hasRepeats = /(.)\1{2,}/.test(password);
  if (hasRepeats) {
    suggestionsByCategory.patterns.push('Avoid repeated characters (aaa, 111, etc.)');
  }
  
  const hasCommonPattern = /(password|pass|admin|user|login|welcome)/i.test(password);
  if (hasCommonPattern) {
    suggestionsByCategory.patterns.push('Avoid common password patterns');
  }
  
  // Dictionary checks
  const commonWords = ['password', 'admin', 'welcome', 'letmein', 'monkey', 'dragon', 'qwerty'];
  const hasCommonWord = commonWords.some(word => password.toLowerCase().includes(word));
  if (hasCommonWord) {
    suggestionsByCategory.dictionary.push('Avoid common dictionary words');
  }
  
  // Combine all suggestions
  const allSuggestions = [
    ...(analysis.feedback?.suggestions || []),
    ...suggestionsByCategory.length,
    ...suggestionsByCategory.complexity,
    ...suggestionsByCategory.patterns,
    ...suggestionsByCategory.dictionary,
  ];
  
  // Calculate time-to-crack estimates for different scenarios
  const crackTimeEstimates = {
    offline_slow: analysis.crack_times_display.offline_slow_hashing_1e4_per_second,
    offline_fast: analysis.crack_times_display.offline_fast_hashing_1e10_per_second,
    online_no_throttling: analysis.crack_times_display.online_no_throttling_10_per_second,
    online_throttling: analysis.crack_times_display.online_throttling_100_per_hour,
  };
  
  return {
    score: analysis.score,
    entropy,
    crackTime: crackTimeEstimates.offline_slow,
    crackTimeEstimates,
    suggestions: [...new Set(allSuggestions)], // Deduplicate
    suggestionsByCategory,
    warning: analysis.feedback?.warning || '',
    characterSets: sets,
  };
}

/**
 * Generate a memorable passphrase (4 words + 1 symbol)
 * Uses a larger wordlist for better entropy. For production, consider using EFF's wordlist.
 * NOTE: Passwords are never logged or sent to backend - all processing is client-side only.
 */
export function generateMemorablePassphrase() {
  // Expanded word list (in production, use EFF's long wordlist)
  const words = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'hammer',
    'island', 'jungle', 'knight', 'lighthouse', 'mountain', 'ocean', 'planet', 'quasar',
    'river', 'sunset', 'tiger', 'umbrella', 'volcano', 'wizard', 'xylophone', 'yacht', 'zebra',
    'anchor', 'breeze', 'crystal', 'dolphin', 'echo', 'flame', 'glacier', 'horizon',
    'infinity', 'journey', 'kaleidoscope', 'legend', 'mystic', 'nebula', 'oracle', 'phoenix',
    'quantum', 'rainbow', 'serenity', 'thunder', 'universe', 'vortex', 'whisper', 'zenith'
  ];
  
  const symbols = '!@#$%^&*';
  
  // Select 4 random words using crypto.getRandomValues for better randomness
  const selectedWords = [];
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);
  for (let i = 0; i < 4; i++) {
    const randomIndex = array[i] % words.length;
    selectedWords.push(words[randomIndex]);
  }
  
  // Add 1 random symbol
  const symbolArray = new Uint32Array(1);
  crypto.getRandomValues(symbolArray);
  const selectedSymbol = symbols[symbolArray[0] % symbols.length];
  
  // Combine: 4 words + 1 symbol at the end
  return `${selectedWords[0]}${selectedWords[1]}${selectedWords[2]}${selectedWords[3]}${selectedSymbol}`;
}

