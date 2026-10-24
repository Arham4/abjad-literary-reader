import { createSignal, createStore } from 'solid-js';
import type { GraphemeUnit, PhoneticSyllablePill, ScriptTradition } from '../lib/abjad/types';

export interface Story {
  id: string;
  slug: string;
  authorUrdu: string;
  authorEnglish: string;
  titleUrdu: string;
  titleEnglish: string;
  level: number;
}

export interface SentenceTiming {
  index: number;
  text: string;
  startTimeMs?: number;
  endTimeMs?: number;
}

export interface Paragraph {
  id: string;
  storyId: string;
  paragraphIndex: number;
  rawText: string;
  audioUrl?: string | null;
  sentencesJson: SentenceTiming[];
}

export interface Token {
  id: string;
  paragraphId: string;
  tokenIndex: number;
  surfaceForm: string;
  normalizedForm: string;
  isWord: boolean;
  sentenceIndex: number;
  izafatGroupId?: string | null;
  compoundGroupId?: string | null;
}

export interface TokenAnalysis {
  id: string;
  tokenId: string;
  vocalizedForm: string;
  phoneticBreakdownJson: PhoneticSyllablePill[];
  graphemesJson: GraphemeUnit[];
  spokenUrduSynonymsJson: string[];
  urduSimpleExplanation: string;
  izafatBreakdownUrdu?: string | null;
  tokenTier: 'function_word' | 'common_vocab' | 'literary_vocab';
  arabicRoot?: string | null;
  familiarCousinsJson?: string[] | null;
  englishContextualGloss: string;
  literaryNuanceNote?: string | null;
}

export interface TelemetryItem {
  id: string;
  normalizedSurface: string;
  vocalizedSurface: string;
  lookupCount: number;
  maxTapLevel: number;
  lastTapLevel: number;
  lastSeenAt: string;
  englishGloss?: string | null;
  urduExplanation?: string | null;
  spokenSynonyms?: string[];
  arabicRoot?: string | null;
  cousins?: string[];
}

// -------------------------------------------------------------
// Reader State Signals & Stores
// -------------------------------------------------------------
export const [toastMessage, setToastMessage] = createSignal<string | null>(null);
let toastTimer: any = null;

export function showToast(message: string, duration = 3000) {
  if (toastTimer) clearTimeout(toastTimer);
  setToastMessage(message);
  toastTimer = setTimeout(() => {
    setToastMessage(null);
    toastTimer = null;
  }, duration);
}
export const [stories, setStories] = createSignal<Story[]>([]);
export const [activeStory, setActiveStory] = createSignal<Story | null>(null);
export const [paragraphs, setParagraphs] = createSignal<Paragraph[]>([]);
export const [tokensMap, setTokensMap] = createSignal<Record<string, Token>>({});
export const [analysesMap, setAnalysesMap] = createSignal<Record<string, TokenAnalysis>>({});
export const [isLoading, setIsLoading] = createSignal<boolean>(false);

// Typography & Appearance
export const [scriptTradition, setScriptTradition] = createSignal<ScriptTradition>('nastaliq');
export const [fontSizePx, setFontSizePx] = createSignal<number>(
  typeof window !== 'undefined' && window.innerWidth < 640 ? 23 : 28
);
export const [theme, setTheme] = createSignal<'paper' | 'sepia' | 'midnight'>('paper');
export const [showIzafatHighlights, setShowIzafatHighlights] = createSignal<boolean>(true);

// 3-Tap Popover Interaction
export const [activeTokenId, setActiveTokenId] = createSignal<string | null>(null);
export const [activeTargetEl, setActiveTargetEl] = createSignal<HTMLElement | null>(null);
export const [tapLevel, setTapLevel] = createSignal<1 | 2 | 3>(1);
export const [maxTapLevelReached, setMaxTapLevelReached] = createSignal<1 | 2 | 3>(1);
export const [isPopoverOpen, setIsPopoverOpen] = createSignal<boolean>(false);

// Sentence Audio Player
export const [currentSentenceIndex, setCurrentSentenceIndex] = createSignal<number | null>(null);
export const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
let simulatedAudioTimer: any = null;

// Vocabulary Vault
export const [isVaultOpen, setIsVaultOpen] = createSignal<boolean>(false);
export const [vaultItems, setVaultItems] = createSignal<TelemetryItem[]>([]);

// Tutorial / Walkthrough Modal
export const [isTutorialOpen, setIsTutorialOpen] = createSignal<boolean>(false);

export function openTutorial() {
  setIsTutorialOpen(true);
}

export function closeTutorial() {
  setIsTutorialOpen(false);
  if (typeof window !== 'undefined') {
    localStorage.setItem('abjad_tutorial_seen', 'true');
  }
}

// -------------------------------------------------------------
// Telemetry Flush
// -------------------------------------------------------------
export async function flushTelemetry(tokenId: string, levelReached: number) {
  const token = tokensMap()[tokenId];
  const analysis = analysesMap()[tokenId];
  if (!token || !analysis || !token.isWord) return;

  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        normalizedSurface: token.normalizedForm,
        vocalizedSurface: analysis.vocalizedForm,
        tapLevel: levelReached,
      }),
    });
  } catch (err) {
    console.error('Failed to flush telemetry:', err);
  }
}

// -------------------------------------------------------------
// Popover Actions
// -------------------------------------------------------------
export function openTokenLens(newTokenId: string, newTarget: HTMLElement) {
  const prevTokenId = activeTokenId();
  const prevTarget = activeTargetEl();

  // Flush telemetry for previous token before switching
  if (prevTokenId && prevTokenId !== newTokenId) {
    flushTelemetry(prevTokenId, maxTapLevelReached());
    if (prevTarget) {
      prevTarget.removeAttribute('data-active');
    }
  }

  // Update target element directly with zero DOM traversal
  newTarget.setAttribute('data-active', 'true');

  setActiveTokenId(newTokenId);
  setActiveTargetEl(newTarget);
  setTapLevel(1);
  setMaxTapLevelReached(1);
  setIsPopoverOpen(true);
}

export function advanceTapLevel() {
  const current = tapLevel();
  if (current < 3) {
    const next = (current + 1) as 1 | 2 | 3;
    setTapLevel(next);
    setMaxTapLevelReached(Math.max(maxTapLevelReached(), next) as 1 | 2 | 3);
  }
}

export function closeTokenLens() {
  const currentId = activeTokenId();
  const currentTarget = activeTargetEl();

  if (currentId) {
    flushTelemetry(currentId, maxTapLevelReached());
  }
  if (currentTarget) {
    currentTarget.removeAttribute('data-active');
  }

  setIsPopoverOpen(false);
  setActiveTokenId(null);
  setActiveTargetEl(null);
}

// -------------------------------------------------------------
// Audio Synthesis (TTS)
// -------------------------------------------------------------
let currentAudioElement: HTMLAudioElement | null = null;

export async function playTTS(text: string): Promise<void> {
  if (!text) return;

  // Stop currently playing audio if any
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }

  try {
    const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=ur-PK`);
    const data = await res.json();

    if (data.audioUrl) {
      const audio = new Audio(data.audioUrl);
      currentAudioElement = audio;
      await audio.play();
    } else if (data.fallback === 'web-speech') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.text);
        utterance.lang = data.lang || 'ur-PK';

        // Check for Urdu voices if available
        const voices = window.speechSynthesis.getVoices();
        const urduVoice = voices.find((v) => v.lang.startsWith('ur'));
        if (urduVoice) {
          utterance.voice = urduVoice;
        } else {
          showToast(`صوتی تلفظ: ${data.text}`);
        }

        window.speechSynthesis.speak(utterance);
      } else {
        showToast(`صوتی تلفظ: ${data.text}`);
      }
    }
  } catch (err) {
    console.warn('TTS playback error, falling back to speech synthesis:', err);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ur-PK';
      window.speechSynthesis.speak(utterance);
    }
  }
}

// -------------------------------------------------------------
// Sentence Audio Playback Controller
// -------------------------------------------------------------
export function playSentence(sentenceIndex: number) {
  const pList = paragraphs();
  if (!pList.length) return;
  const sentences = pList[0].sentencesJson;
  const sentence = sentences.find((s) => s.index === sentenceIndex);
  if (!sentence) return;

  setCurrentSentenceIndex(sentenceIndex);
  setIsPlaying(true);

  if (simulatedAudioTimer) {
    clearTimeout(simulatedAudioTimer);
  }

  // Play sentence via Web Speech API or simulated duration
  playTTS(sentence.text);

  const durationMs = sentence.endTimeMs && sentence.startTimeMs
    ? sentence.endTimeMs - sentence.startTimeMs
    : Math.max(3000, sentence.text.length * 90);

  simulatedAudioTimer = setTimeout(() => {
    // Check if there is a next sentence
    const nextSentence = sentences.find((s) => s.index === sentenceIndex + 1);
    if (nextSentence) {
      playSentence(sentenceIndex + 1);
    } else {
      setIsPlaying(false);
      setCurrentSentenceIndex(null);
    }
  }, durationMs);
}

export function stopAudio() {
  if (simulatedAudioTimer) {
    clearTimeout(simulatedAudioTimer);
    simulatedAudioTimer = null;
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  setIsPlaying(false);
  setCurrentSentenceIndex(null);
}

export function toggleAudio() {
  if (isPlaying()) {
    stopAudio();
  } else {
    playSentence(0);
  }
}

// -------------------------------------------------------------
// API Story Loader
// -------------------------------------------------------------
export async function loadStories() {
  try {
    setIsLoading(true);
    const res = await fetch('/api/stories');
    const data = await res.json();
    if (data.success && data.data) {
      setStories(data.data);
      if (data.data.length > 0) {
        await selectStory(data.data[0].slug);
      }
    }
  } catch (err) {
    console.error('Failed to load stories:', err);
  } finally {
    setIsLoading(false);
  }
}

export async function selectStory(slug: string) {
  try {
    closeTokenLens();
    stopAudio();
    setIsLoading(true);

    const res = await fetch(`/api/stories/${slug}`);
    const data = await res.json();

    if (data.success && data.data) {
      setActiveStory(data.data.story);
      setParagraphs(data.data.paragraphs);

      // Build token map
      const tMap: Record<string, Token> = {};
      for (const t of data.data.tokens) {
        tMap[t.id] = t;
      }
      setTokensMap(tMap);
      setAnalysesMap(data.data.analyses || {});
    }
  } catch (err) {
    console.error(`Failed to select story ${slug}:`, err);
  } finally {
    setIsLoading(false);
  }
}

// -------------------------------------------------------------
// Vault Actions
// -------------------------------------------------------------
export async function loadVault() {
  try {
    const res = await fetch('/api/telemetry');
    const data = await res.json();
    if (data.success && data.data) {
      setVaultItems(data.data);
    }
  } catch (err) {
    console.error('Failed to load vault telemetry:', err);
  }
}

export function openVault() {
  loadVault();
  setIsVaultOpen(true);
}

export function closeVault() {
  setIsVaultOpen(false);
}
