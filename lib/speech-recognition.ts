export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

export function startListening(
  onResult: (result: SpeechRecognitionResult) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  lang = 'en-US'
): any {
  if (typeof window === 'undefined') return null;

  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError("Speech recognition not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = lang;

  recognition.onresult = (event: any) => {
    if (event.results && event.results[0]) {
      const result = event.results[0][0];
      onResult({
        transcript: result.transcript,
        confidence: result.confidence
      });
    }
  };

  recognition.onerror = (event: any) => {
    onError(event.error);
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
    return recognition;
  } catch (err: any) {
    onError(err.message || "Failed to start recognition");
    return null;
  }
}

export function calculateSimilarity(target: string, spoken: string): number {
  const t = target.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
  const s = spoken.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();

  if (t === s) return 100;
  if (!t || !s) return 0;

  // Levenshtein distance character-level
  const track = Array(s.length + 1).fill(null).map(() => Array(t.length + 1).fill(null));
  for (let i = 0; i <= t.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s.length; j += 1) {
    for (let i = 1; i <= t.length; i += 1) {
      const indicator = t[i - 1] === s[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j - 1][i] + 1, // deletion
        track[j][i - 1] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s.length][t.length];
  const maxLength = Math.max(t.length, s.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.max(0, Math.round(similarity));
}
