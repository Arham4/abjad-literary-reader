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
  subLevel: string;
  format?: 'short_story' | 'essay' | 'novella_arc' | 'novel_arc';
  targetVocabFocus?: string | null;
  sourceUrl?: string | null;
  status: 'ready' | 'coming_soon';
  descriptionEnglish?: string | null;
  sceneVocabPreview?: string[] | null;
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
  storyId?: string | null;
  storySlug?: string | null;
  storyTitleUrdu?: string | null;
  sourceSentenceUrdu?: string | null;
  masteryStatus?: 'learning' | 'mastered';
  isStarred?: boolean;
  lastReviewedAt?: string | null;
  englishGloss?: string | null;
  urduExplanation?: string | null;
  spokenSynonyms?: string[];
  arabicRoot?: string | null;
  cousins?: string[];
  literaryNuanceNote?: string | null;
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

const initialTheme = (): 'paper' | 'sepia' | 'midnight' => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const qTheme = urlParams.get('theme');
    if (qTheme === 'paper' || qTheme === 'sepia' || qTheme === 'midnight') {
      return qTheme;
    }
    const saved = localStorage.getItem('abjad_theme');
    if (saved === 'paper' || saved === 'sepia' || saved === 'midnight') {
      return saved;
    }
  }
  return 'sepia';
};

export const [theme, _setTheme] = createSignal<'paper' | 'sepia' | 'midnight'>(initialTheme());

export function applyThemeToDom(t: 'paper' | 'sepia' | 'midnight') {
  if (typeof document !== 'undefined') {
    document.body.className = `theme-${t}`;
    document.documentElement.classList.toggle('dark', t === 'midnight');
    document.documentElement.setAttribute('data-theme', t);
  }
}

// Apply immediately on store initialization
if (typeof document !== 'undefined') {
  applyThemeToDom(initialTheme());
}

export function setTheme(t: 'paper' | 'sepia' | 'midnight') {
  _setTheme(t);
  if (typeof window !== 'undefined') {
    localStorage.setItem('abjad_theme', t);
  }
  applyThemeToDom(t);
}

export const [showIzafatHighlights, setShowIzafatHighlights] = createSignal<boolean>(true);

// 3-Tap Popover Interaction
export interface StorySentence {
  index: number;
  text: string;
  startTimeMs?: number;
  endTimeMs?: number;
}

export interface ActiveSentenceInfo {
  paragraphId: string;
  paragraphIndex: number;
  sentenceIndex: number;
  globalIndex: number;
  text: string;
}

export const [activeTokenId, setActiveTokenId] = createSignal<string | null>(null);
export const [activeTargetEl, setActiveTargetEl] = createSignal<HTMLElement | null>(null);
export const [tapLevel, setTapLevel] = createSignal<1 | 2 | 3>(1);
export const [maxTapLevelReached, setMaxTapLevelReached] = createSignal<1 | 2 | 3>(1);
export const [isPopoverOpen, setIsPopoverOpen] = createSignal<boolean>(false);

export interface PhraseLensData {
  phraseText: string;
  vocalizedForm: string;
  phoneticBreakdownJson: PhoneticSyllablePill[];
  graphemesJson: GraphemeUnit[];
  spokenUrduSynonymsJson: string[];
  urduSimpleExplanation: string;
  englishContextualGloss: string;
  literaryNuanceNote: string | null;
  tokenTier: string;
  isPhrase?: boolean;
}

export const [activePhrase, setActivePhrase] = createSignal<PhraseLensData | null>(null);

// Sentence Audio Player
export const [currentSentence, setCurrentSentence] = createSignal<ActiveSentenceInfo | null>(null);
export const currentSentenceIndex = () => currentSentence()?.globalIndex ?? null;
export const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
let simulatedAudioTimer: any = null;

export const allStorySentences = (): ActiveSentenceInfo[] => {
  const pList = paragraphs()
    .filter((p) => p.paragraphIndex >= 0)
    .sort((a, b) => a.paragraphIndex - b.paragraphIndex);

  const list: ActiveSentenceInfo[] = [];
  let gIdx = 0;

  for (const p of pList) {
    if (Array.isArray(p.sentencesJson)) {
      for (const s of p.sentencesJson) {
        list.push({
          paragraphId: p.id,
          paragraphIndex: p.paragraphIndex,
          sentenceIndex: s.index,
          globalIndex: gIdx++,
          text: s.text,
        });
      }
    }
  }
  return list;
};

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
// Telemetry Flush & Real-Time Vault Sync
// -------------------------------------------------------------
export async function flushTelemetry(tokenId: string, levelReached: number) {
  const token = tokensMap()[tokenId];
  const analysis = analysesMap()[tokenId];
  if (!token || !analysis || !token.isWord) return;

  // Resolve sentence context and story metadata
  const p = paragraphs().find((para) => para.id === token.paragraphId);
  let sentenceText = '';
  if (p && Array.isArray(p.sentencesJson)) {
    const sObj = p.sentencesJson.find((s: any) => s.index === token.sentenceIndex);
    if (sObj?.text) sentenceText = sObj.text;
  }
  const story = activeStory();

  // Resolve compound grouping if token is part of a compound
  let normSurface = token.normalizedForm;
  let surfDisplay = token.surfaceForm;
  if (token.compoundGroupId) {
    const cTokens = Object.values(tokensMap())
      .filter((tok) => tok.paragraphId === token.paragraphId && tok.compoundGroupId === token.compoundGroupId)
      .sort((a, b) => a.tokenIndex - b.tokenIndex);
    if (cTokens.length > 1) {
      normSurface = cTokens.map((tok) => tok.normalizedForm).join(' ');
      surfDisplay = cTokens.map((tok) => tok.surfaceForm).join(' ');
    }
  }

  // Optimistically update local vaultItems signal for zero-latency UI updates
  const currentItems = vaultItems();
  const existingIdx = currentItems.findIndex(
    (it) =>
      (it.normalizedSurface === normSurface || it.normalizedSurface === token.normalizedForm) &&
      it.vocalizedSurface === analysis.vocalizedForm
  );

  if (existingIdx !== -1) {
    const updated = [...currentItems];
    updated[existingIdx] = {
      ...updated[existingIdx],
      lookupCount: updated[existingIdx].lookupCount + 1,
      lastTapLevel: levelReached,
      maxTapLevel: Math.max(updated[existingIdx].maxTapLevel, levelReached),
      lastSeenAt: new Date().toISOString(),
      sourceSentenceUrdu: sentenceText || updated[existingIdx].sourceSentenceUrdu,
      storyTitleUrdu: story?.titleUrdu || updated[existingIdx].storyTitleUrdu,
    };
    setVaultItems(updated);
  } else {
    const newItem: TelemetryItem = {
      id: `tel_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      normalizedSurface: normSurface,
      vocalizedSurface: analysis.vocalizedForm,
      lookupCount: 1,
      maxTapLevel: levelReached,
      lastTapLevel: levelReached,
      lastSeenAt: new Date().toISOString(),
      storyId: story?.id || null,
      storySlug: story?.slug || null,
      storyTitleUrdu: story?.titleUrdu || null,
      sourceSentenceUrdu: sentenceText || null,
      masteryStatus: 'learning',
      isStarred: false,
      englishGloss: analysis.englishContextualGloss,
      urduExplanation: analysis.urduSimpleExplanation,
      spokenSynonyms: analysis.spokenUrduSynonymsJson,
      arabicRoot: analysis.arabicRoot,
      cousins: analysis.familiarCousinsJson || [],
      literaryNuanceNote: analysis.literaryNuanceNote,
    };
    setVaultItems([newItem, ...currentItems]);
  }

  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        normalizedSurface: normSurface,
        vocalizedSurface: analysis.vocalizedForm,
        tapLevel: levelReached,
        storyId: story?.id || null,
        storySlug: story?.slug || null,
        storyTitleUrdu: story?.titleUrdu || null,
        sourceSentenceUrdu: sentenceText || null,
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

  setActivePhrase(null);
  setActiveTokenId(newTokenId);
  setActiveTargetEl(newTarget);
  setTapLevel(1);
  setMaxTapLevelReached(1);
  setIsPopoverOpen(true);

  // If narration is not currently playing, align the narration audio section to the sentence containing this word
  if (!isPlaying()) {
    const token = tokensMap()[newTokenId];
    if (token) {
      const match = allStorySentences().find(
        (s) => s.paragraphId === token.paragraphId && s.sentenceIndex === token.sentenceIndex
      );
      if (match) {
        setCurrentSentence(match);
      }
    }
  }
}

export async function decodeAndOpenPhraseLens(phraseText: string, coords?: { top: number; left: number } | null) {
  try {
    const prevTokenId = activeTokenId();
    const prevTarget = activeTargetEl();
    if (prevTokenId && prevTarget) {
      prevTarget.removeAttribute('data-active');
    }

    const res = await fetch('/api/phrase/decode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phrase: phraseText,
        storyId: activeStory()?.id || null,
      }),
    });
    const result = await res.json();
    if (result.success && result.data) {
      setActivePhrase(result.data);
      setActiveTokenId(null);
      setActiveTargetEl(null);
      setTapLevel(1);
      setMaxTapLevelReached(1);
      setIsPopoverOpen(true);

      // If narration is not currently playing, align the narration audio section to the sentence containing this phrase
      if (!isPlaying()) {
        const cleanText = phraseText.trim();
        const match = allStorySentences().find((s) => s.text.includes(cleanText));
        if (match) {
          setCurrentSentence(match);
        }
      }
    }
  } catch (err) {
    console.error('Failed to decode phrase:', err);
  }
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
  setActivePhrase(null);
}

export async function togglePhraseInVault(data: PhraseLensData) {
  const story = activeStory();
  const existing = vaultItems().find(
    (item) =>
      item.normalizedSurface === data.phraseText ||
      item.vocalizedSurface === data.vocalizedForm
  );

  if (existing) {
    await deleteVaultItem(existing.id);
    showToast(`Removed "${data.phraseText}" from Vault`);
  } else {
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          normalizedSurface: data.phraseText,
          vocalizedSurface: data.vocalizedForm,
          tapLevel: tapLevel(),
          storyId: story?.id || null,
          storySlug: story?.slug || null,
          storyTitleUrdu: story?.titleUrdu || null,
          sourceSentenceUrdu: selectedText() || null,
        }),
      });

      const newItem: TelemetryItem = {
        id: `tel_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        normalizedSurface: data.phraseText,
        vocalizedSurface: data.vocalizedForm,
        lookupCount: 1,
        maxTapLevel: tapLevel(),
        lastTapLevel: tapLevel(),
        lastSeenAt: new Date().toISOString(),
        storyId: story?.id || null,
        storySlug: story?.slug || null,
        storyTitleUrdu: story?.titleUrdu || null,
        sourceSentenceUrdu: selectedText() || null,
        masteryStatus: 'learning',
        isStarred: false,
        englishGloss: data.englishContextualGloss,
        urduExplanation: data.urduSimpleExplanation,
        spokenSynonyms: data.spokenUrduSynonymsJson,
        arabicRoot: null,
        cousins: [],
        literaryNuanceNote: data.literaryNuanceNote,
      };
      setVaultItems([newItem, ...vaultItems()]);
      showToast(`Saved "${data.vocalizedForm}" to Vault ★`);
    } catch (err) {
      console.error('Failed to save phrase to vault:', err);
    }
  }
}

// -------------------------------------------------------------
// Audio Synthesis (TTS) - Multi-Voice Persona & Zero-RAM Engine
// -------------------------------------------------------------
export type VoicePersona = 'ur-asad' | 'ur-uzma' | 'ur-salman' | 'ur-gul' | 'google-standard';
export type VoiceEngine = 'auto' | 'browser' | 'server';

export interface VoiceOptionInfo {
  id: VoicePersona;
  nameUrdu: string;
  nameEnglish: string;
  role: string;
  description: string;
  gender: 'male' | 'female';
  recommended?: boolean;
}

export const VOICE_OPTIONS: VoiceOptionInfo[] = [
  {
    id: 'ur-asad',
    nameUrdu: 'اسد',
    nameEnglish: 'Asad',
    role: 'ادبی راوی (Literary Narrator)',
    description: 'Deep, measured classical male cadence. Ideal for Saadat Hasan Manto.',
    gender: 'male',
    recommended: true,
  },
  {
    id: 'ur-uzma',
    nameUrdu: 'عظمیٰ',
    nameEnglish: 'Uzma',
    role: 'رواں راویہ (Natural Fluent)',
    description: 'Natural, clear modern Pakistani female narration.',
    gender: 'female',
  },
  {
    id: 'ur-salman',
    nameUrdu: 'سلمان',
    nameEnglish: 'Salman',
    role: 'کلاسیکی شائستہ (Classical Lucknow)',
    description: 'Crisp, articulate classical male diction with poetic cadence.',
    gender: 'male',
  },
  {
    id: 'ur-gul',
    nameUrdu: 'گُل',
    nameEnglish: 'Gul',
    role: 'نغمگی و اظہار (Expressive Melodic)',
    description: 'Expressive and melodic female voice, ideal for poetic prose.',
    gender: 'female',
  },
  {
    id: 'google-standard',
    nameUrdu: 'معیاری آواز',
    nameEnglish: 'Standard Web',
    role: 'عام آن لائن آواز (Standard Online)',
    description: 'Standard baseline online speech pronunciation.',
    gender: 'female',
  },
];

const savedVoice = typeof localStorage !== 'undefined' ? (localStorage.getItem('abjad_tts_voice') as VoicePersona) : null;
const savedEngine = typeof localStorage !== 'undefined' ? (localStorage.getItem('abjad_tts_engine') as VoiceEngine) : null;
const savedRate = typeof localStorage !== 'undefined' ? parseFloat(localStorage.getItem('abjad_tts_rate') || '1.0') : 1.0;
const savedPitch = typeof localStorage !== 'undefined' ? parseFloat(localStorage.getItem('abjad_tts_pitch') || '1.0') : 1.0;

export const [ttsVoice, setTtsVoiceSignal] = createSignal<VoicePersona>(savedVoice || 'ur-asad');
export const [ttsEngine, setTtsEngineSignal] = createSignal<VoiceEngine>(savedEngine || 'server');
export const [ttsRate, setTtsRateSignal] = createSignal<number>(savedRate);
export const [ttsPitch, setTtsPitchSignal] = createSignal<number>(savedPitch);
const initVoiceSettingsOpen = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).has('voiceSettings') : false;
export const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = createSignal(initVoiceSettingsOpen);
export const [isPreviewPlaying, setIsPreviewPlaying] = createSignal(false);
export const [availableBrowserVoices, setAvailableBrowserVoices] = createSignal<SpeechSynthesisVoice[]>([]);

export function setTtsVoice(v: VoicePersona) {
  setTtsVoiceSignal(v);
  if (typeof localStorage !== 'undefined') localStorage.setItem('abjad_tts_voice', v);
}
export function setTtsEngine(e: VoiceEngine) {
  setTtsEngineSignal(e);
  if (typeof localStorage !== 'undefined') localStorage.setItem('abjad_tts_engine', e);
}
export function setTtsRate(r: number) {
  setTtsRateSignal(r);
  if (typeof localStorage !== 'undefined') localStorage.setItem('abjad_tts_rate', r.toString());
}
export function setTtsPitch(p: number) {
  setTtsPitchSignal(p);
  if (typeof localStorage !== 'undefined') localStorage.setItem('abjad_tts_pitch', p.toString());
}
export function openVoiceSettings() {
  setIsVoiceSettingsOpen(true);
}
export function closeVoiceSettings() {
  setIsVoiceSettingsOpen(false);
}

// Populate browser voices when speech synthesis is ready
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    const list = window.speechSynthesis.getVoices();
    setAvailableBrowserVoices(list);
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

function findBestBrowserVoice(persona: VoicePersona): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const targetName = persona === 'ur-asad' ? 'asad' :
                     persona === 'ur-uzma' ? 'uzma' :
                     persona === 'ur-salman' ? 'salman' :
                     persona === 'ur-gul' ? 'gul' : '';

  // Look for exact name match in browser voices (e.g. "Microsoft Asad Online (Natural)" in Edge)
  if (targetName) {
    const namedMatch = voices.find(
      (v) => (v.lang.startsWith('ur') || v.lang.startsWith('hi')) && v.name.toLowerCase().includes(targetName)
    );
    if (namedMatch) return namedMatch;
  }

  // If browser does not have this exact neural voice installed, return null so server edge-tts synthesizes it
  return null;
}

export interface AudioPlaybackHandle {
  pause: () => void;
  onEnded: (cb: () => void) => void;
  onError: (cb: () => void) => void;
}

let currentAudioElement: HTMLAudioElement | null = null;
let activePlaybackSessionId = 0;
let activeAbortController: AbortController | null = null;

// Stop low-level active audio playback stream without resetting narration play intent
export function stopActiveAudioStream() {
  // Invalidate any in-flight promises, fetches, and callbacks
  activePlaybackSessionId++;

  // Abort any in-flight fetch request
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch (_) {}
    activeAbortController = null;
  }

  if (simulatedAudioTimer) {
    clearTimeout(simulatedAudioTimer);
    simulatedAudioTimer = null;
  }
  if (currentAudioElement) {
    currentAudioElement.onended = null;
    currentAudioElement.onerror = null;
    currentAudioElement.onpause = null;
    currentAudioElement.pause();
    currentAudioElement.src = '';
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// User-facing pause & stop actions
export function pauseAudio() {
  stopActiveAudioStream();
  setIsPlaying(false);
  setIsSelectionPlaying(false);
  setIsPreviewPlaying(false);
}

export function stopAudio() {
  pauseAudio();
}

// Selected Text Narration Signals & Actions
export const [selectedText, setSelectedText] = createSignal<string>('');
export const [isSelectionPlaying, setIsSelectionPlaying] = createSignal<boolean>(false);

export async function playSelectedText(customText?: string): Promise<AudioPlaybackHandle | null> {
  const text = (customText || selectedText()).trim();
  if (!text) return null;

  // Pause continuous sentence narration first
  pauseAudio();
  setIsSelectionPlaying(true);

  const handle = await playTTS(text);
  if (!isSelectionPlaying() || !handle) {
    if (handle) handle.pause();
    setIsSelectionPlaying(false);
    return null;
  }

  handle.onEnded(() => {
    setIsSelectionPlaying(false);
  });
  handle.onError(() => {
    setIsSelectionPlaying(false);
  });
  return handle;
}

export function stopSelectionAudio() {
  stopActiveAudioStream();
  setIsSelectionPlaying(false);
}

// Single Word Audio Lookup
export async function playWordAudio(text: string): Promise<AudioPlaybackHandle | null> {
  // Pause any continuous narration so they do not overlap
  pauseAudio();
  return playTTS(text);
}

// Background prefetch for next sentence so 'Next' button & auto-advance have zero lag
export function prefetchSentenceAudio(globalIndex: number) {
  const sentenceList = allStorySentences();
  if (globalIndex >= 0 && globalIndex < sentenceList.length) {
    const text = sentenceList[globalIndex].text;
    if (!text) return;
    const voice = ttsVoice();
    const rate = ttsRate();
    const pitch = ttsPitch();
    fetch(
      `/api/tts?text=${encodeURIComponent(text)}&lang=ur-PK&voice=${encodeURIComponent(
        voice
      )}&speed=${rate}&pitch=${pitch}`
    ).catch(() => {});
  }
}

export async function playTTS(text: string): Promise<AudioPlaybackHandle | null> {
  if (!text) return null;

  // Stop currently playing low-level audio stream without toggling isPlaying signal
  stopActiveAudioStream();

  // Monotonic session token for this playback request
  const sessionId = activePlaybackSessionId;
  const abortController = new AbortController();
  activeAbortController = abortController;

  const voice = ttsVoice();
  const engine = ttsEngine();
  const rate = ttsRate();
  const pitch = ttsPitch();

  // Use browser synthesis only if browser actually has a matching voice for Urdu/Hindi
  const browserVoice = findBestBrowserVoice(voice);
  const useBrowser = (engine === 'browser' || engine === 'auto') && browserVoice !== null;

  if (useBrowser && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (sessionId !== activePlaybackSessionId) return null;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = browserVoice ? browserVoice.lang : 'ur-PK';
    if (browserVoice) utterance.voice = browserVoice;

    // Apply nuanced persona pitch adjustments
    let effectivePitch = pitch;
    if (voice === 'ur-asad') effectivePitch *= 0.92;
    else if (voice === 'ur-gul') effectivePitch *= 1.08;
    utterance.pitch = Math.max(0.5, Math.min(2.0, effectivePitch));
    utterance.rate = Math.max(0.5, Math.min(2.0, rate));

    let endedCallback: (() => void) | null = null;
    let errorCallback: (() => void) | null = null;

    utterance.onend = () => {
      if (sessionId === activePlaybackSessionId && endedCallback) endedCallback();
    };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        if (sessionId === activePlaybackSessionId && errorCallback) errorCallback();
      }
    };

    window.speechSynthesis.speak(utterance);

    return {
      pause: () => {
        if (sessionId === activePlaybackSessionId) {
          window.speechSynthesis.cancel();
        }
      },
      onEnded: (cb) => {
        endedCallback = cb;
      },
      onError: (cb) => {
        errorCallback = cb;
      },
    };
  }

  // Otherwise, synthesize or fetch from zero-RAM cached server audio stream
  try {
    const res = await fetch(
      `/api/tts?text=${encodeURIComponent(text)}&lang=ur-PK&voice=${encodeURIComponent(
        voice
      )}&speed=${rate}&pitch=${pitch}`,
      { signal: abortController.signal }
    );

    // If session was superseded or cancelled while fetch was in flight, abort immediately
    if (sessionId !== activePlaybackSessionId) {
      return null;
    }

    const data = await res.json();

    // Check again after JSON parsing
    if (sessionId !== activePlaybackSessionId) {
      return null;
    }

    if (data.audioUrl) {
      const audio = new Audio();
      audio.src = data.audioUrl;
      audio.playbackRate = rate;

      if (sessionId !== activePlaybackSessionId) {
        audio.src = '';
        return null;
      }

      currentAudioElement = audio;

      let endedCallback: (() => void) | null = null;
      let errorCallback: (() => void) | null = null;

      audio.onended = () => {
        if (sessionId === activePlaybackSessionId) {
          currentAudioElement = null;
          if (endedCallback) endedCallback();
        }
      };
      audio.onerror = () => {
        if (sessionId === activePlaybackSessionId) {
          currentAudioElement = null;
          if (errorCallback) errorCallback();
        }
      };

      try {
        await audio.play();
        // If pause was clicked right during play() resolution:
        if (sessionId !== activePlaybackSessionId) {
          audio.pause();
          audio.src = '';
          currentAudioElement = null;
          return null;
        }
      } catch (playErr: any) {
        if (playErr?.name !== 'AbortError') {
          console.warn('Audio play error:', playErr);
          if (sessionId === activePlaybackSessionId && errorCallback) errorCallback();
        }
        return null;
      }

      return {
        pause: () => {
          if (sessionId === activePlaybackSessionId) {
            audio.pause();
            audio.src = '';
            currentAudioElement = null;
          }
        },
        onEnded: (cb) => {
          endedCallback = cb;
        },
        onError: (cb) => {
          errorCallback = cb;
        },
      };
    } else if (data.fallback === 'web-speech') {
      if (sessionId !== activePlaybackSessionId) return null;

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.text);
        utterance.lang = data.lang || 'ur-PK';
        if (browserVoice) utterance.voice = browserVoice;
        utterance.rate = rate;
        utterance.pitch = pitch;

        let endedCallback: (() => void) | null = null;
        let errorCallback: (() => void) | null = null;

        utterance.onend = () => {
          if (sessionId === activePlaybackSessionId && endedCallback) endedCallback();
        };
        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            if (sessionId === activePlaybackSessionId && errorCallback) errorCallback();
          }
        };

        window.speechSynthesis.speak(utterance);

        return {
          pause: () => {
            if (sessionId === activePlaybackSessionId) {
              window.speechSynthesis.cancel();
            }
          },
          onEnded: (cb) => {
            endedCallback = cb;
          },
          onError: (cb) => {
            errorCallback = cb;
          },
        };
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return null;
    }
    console.warn('TTS playback error, falling back to speech synthesis:', err);
    if (sessionId === activePlaybackSessionId && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ur-PK';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  }
  return null;
}

export async function testVoicePreview() {
  if (isPlaying() || isPreviewPlaying() || isSelectionPlaying()) {
    pauseAudio();
    return;
  }
  setIsPreviewPlaying(true);
  const sampleText = 'ٹھنڈ میں، ایک قحط زدہ گاؤں سے گزرتے وقت ایک فارغ، بااثر اور چڑچڑے شخص کو بعض جل پری نما اژدہے نظر آئے۔';
  const handle = await playTTS(sampleText);
  if (!isPreviewPlaying() || !handle) {
    if (handle) handle.pause();
    setIsPreviewPlaying(false);
    return;
  }
  handle.onEnded(() => {
    setIsPreviewPlaying(false);
  });
  handle.onError(() => {
    setIsPreviewPlaying(false);
  });
}

// -------------------------------------------------------------
// Sentence Audio Playback Controller (Auto-Advance Continuous Narration)
// -------------------------------------------------------------
export async function playSentence(globalIndex: number) {
  const sentenceList = allStorySentences();
  if (!sentenceList.length) return;

  if (globalIndex < 0 || globalIndex >= sentenceList.length) {
    // Reached the end of the story
    pauseAudio();
    return;
  }

  const s = sentenceList[globalIndex];
  setCurrentSentence(s);
  setIsPlaying(true);
  setIsSelectionPlaying(false);

  // Smooth scroll active sentence into view if off-screen
  if (typeof document !== 'undefined') {
    setTimeout(() => {
      const activeEl = document.querySelector(`[data-active-sentence="true"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  }

  // Pre-cache next sentence in the background for zero-lag transition
  prefetchSentenceAudio(globalIndex + 1);

  // Play audio through unified handle (playTTS calls stopActiveAudioStream internally)
  const handle = await playTTS(s.text);

  // If user paused or clicked a different sentence while fetch was in flight, abort!
  if (!isPlaying() || currentSentence()?.globalIndex !== s.globalIndex || !handle) {
    if (handle) handle.pause();
    return;
  }

  handle.onEnded(() => {
    // Auto-advance continuous narration to the next sentence
    if (isPlaying() && currentSentence()?.globalIndex === s.globalIndex) {
      if (globalIndex + 1 < sentenceList.length) {
        playSentence(globalIndex + 1);
      } else {
        pauseAudio();
      }
    }
  });

  handle.onError(() => {
    if (!isPlaying() || currentSentence()?.globalIndex !== s.globalIndex) return;
    const fallbackDuration = Math.max(3500, s.text.length * 85);
    simulatedAudioTimer = setTimeout(() => {
      if (isPlaying() && currentSentence()?.globalIndex === s.globalIndex) {
        if (globalIndex + 1 < sentenceList.length) {
          playSentence(globalIndex + 1);
        } else {
          pauseAudio();
        }
      }
    }, fallbackDuration);
  });
}

export function toggleAudio() {
  if (isPlaying()) {
    pauseAudio();
  } else if (isSelectionPlaying()) {
    stopSelectionAudio();
  } else {
    const current = currentSentence();
    playSentence(current ? current.globalIndex : 0);
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
        const urlParams = new URLSearchParams(window.location.search);
        const storyParam = urlParams.get('story');
        const readyStories = data.data.filter((s: any) => s.status === 'ready');
        const initialSlug = (storyParam && readyStories.some((s: any) => s.slug === storyParam))
          ? storyParam
          : readyStories.length > 0
          ? readyStories[0].slug
          : data.data[0].slug;
        await selectStory(initialSlug);
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
    const target = stories().find((s) => s.slug === slug);
    if (target && target.status === 'coming_soon') {
      showToast(`Level ${target.subLevel} · "${target.titleEnglish}" is coming soon in the curriculum roadmap.`);
      return;
    }

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

      // Initialize narration section to the first sentence of the story
      const sentences = allStorySentences();
      if (sentences.length > 0) {
        setCurrentSentence(sentences[0]);
      } else {
        setCurrentSentence(null);
      }
    }
  } catch (err) {
    console.error(`Failed to select story ${slug}:`, err);
  } finally {
    setIsLoading(false);
  }
}

// -------------------------------------------------------------
// Vault Actions & Ergonomic Management
// -------------------------------------------------------------
export const [lastDeletedItem, setLastDeletedItem] = createSignal<TelemetryItem | null>(null);
let undoTimer: any = null;

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

export async function deleteVaultItem(id: string) {
  const itemToDelete = vaultItems().find((i) => i.id === id);
  if (!itemToDelete) return;

  // Optimistic removal
  setVaultItems(vaultItems().filter((i) => i.id !== id));
  setLastDeletedItem(itemToDelete);

  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    setLastDeletedItem(null);
  }, 6000);

  try {
    await fetch(`/api/telemetry/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('Failed to delete vault item:', err);
  }
}

export async function undoDeleteVaultItem() {
  const item = lastDeletedItem();
  if (!item) return;

  setVaultItems([item, ...vaultItems()]);
  setLastDeletedItem(null);
  showToast(`Restored "${item.vocalizedSurface}" to Vault`);

  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        normalizedSurface: item.normalizedSurface,
        vocalizedSurface: item.vocalizedSurface,
        tapLevel: item.maxTapLevel,
        storyId: item.storyId,
        storySlug: item.storySlug,
        storyTitleUrdu: item.storyTitleUrdu,
        sourceSentenceUrdu: item.sourceSentenceUrdu,
      }),
    });
  } catch (err) {
    console.error('Failed to restore vault item:', err);
  }
}

export async function toggleVaultItemStar(id: string) {
  const item = vaultItems().find((i) => i.id === id);
  if (!item) return;
  const newStarred = !item.isStarred;

  setVaultItems(
    vaultItems().map((i) => (i.id === id ? { ...i, isStarred: newStarred } : i))
  );

  try {
    await fetch(`/api/telemetry/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isStarred: newStarred }),
    });
  } catch (err) {
    console.error('Failed to toggle star:', err);
  }
}

export async function toggleVaultItemMastery(id: string) {
  const item = vaultItems().find((i) => i.id === id);
  if (!item) return;
  const newMastery: 'learning' | 'mastered' =
    item.masteryStatus === 'mastered' ? 'learning' : 'mastered';

  setVaultItems(
    vaultItems().map((i) => (i.id === id ? { ...i, masteryStatus: newMastery } : i))
  );

  try {
    await fetch(`/api/telemetry/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masteryStatus: newMastery }),
    });
  } catch (err) {
    console.error('Failed to toggle mastery:', err);
  }
}

export async function clearVault(mode: 'all' | 'mastered') {
  if (mode === 'all') {
    setVaultItems([]);
  } else {
    setVaultItems(vaultItems().filter((i) => i.masteryStatus !== 'mastered'));
  }
  try {
    await fetch(`/api/telemetry/${mode}?${mode}=true`, { method: 'DELETE' });
    showToast(mode === 'all' ? 'Vault cleared' : 'Cleared mastered words');
  } catch (err) {
    console.error('Failed to clear vault:', err);
  }
}

export function isTokenInVault(tokenId: string): boolean {
  const token = tokensMap()[tokenId];
  const analysis = analysesMap()[tokenId];
  if (!token) return false;

  let normSurface = token.normalizedForm;
  if (token.compoundGroupId) {
    const cTokens = Object.values(tokensMap())
      .filter((tok) => tok.paragraphId === token.paragraphId && tok.compoundGroupId === token.compoundGroupId)
      .sort((a, b) => a.tokenIndex - b.tokenIndex);
    if (cTokens.length > 1) {
      normSurface = cTokens.map((tok) => tok.normalizedForm).join(' ');
    }
  }

  return vaultItems().some(
    (item) =>
      item.normalizedSurface === normSurface ||
      item.normalizedSurface === token.normalizedForm ||
      (analysis && item.vocalizedSurface === analysis.vocalizedForm)
  );
}

export async function toggleTokenInVault(tokenId: string) {
  const token = tokensMap()[tokenId];
  const analysis = analysesMap()[tokenId];
  if (!token || !analysis) return;

  let normSurface = token.normalizedForm;
  let surfDisplay = token.surfaceForm;
  if (token.compoundGroupId) {
    const cTokens = Object.values(tokensMap())
      .filter((tok) => tok.paragraphId === token.paragraphId && tok.compoundGroupId === token.compoundGroupId)
      .sort((a, b) => a.tokenIndex - b.tokenIndex);
    if (cTokens.length > 1) {
      normSurface = cTokens.map((tok) => tok.normalizedForm).join(' ');
      surfDisplay = cTokens.map((tok) => tok.surfaceForm).join(' ');
    }
  }

  const existing = vaultItems().find(
    (item) =>
      item.normalizedSurface === normSurface ||
      item.normalizedSurface === token.normalizedForm ||
      item.vocalizedSurface === analysis.vocalizedForm
  );

  if (existing) {
    await deleteVaultItem(existing.id);
    showToast(`Removed "${surfDisplay}" from Vault`);
  } else {
    await flushTelemetry(tokenId, 1);
    showToast(`Saved "${analysis.vocalizedForm}" to Vault ★`);
  }
}
