import { onMount, onCleanup, Show, createSignal, createEffect } from 'solid-js';
import ReaderNavbar from './components/ReaderNavbar';
import ReaderSurface from './components/ReaderSurface';
import TokenLensPopover from './components/TokenLensPopover';
import AudioBar from './components/AudioBar';
import VocabularyVault from './components/VocabularyVault';
import TutorialModal from './components/TutorialModal';
import VoiceSettingsModal from './components/VoiceSettingsModal';
import {
  theme,
  activeStory,
  isLoading,
  loadStories,
  loadVault,
  closeTokenLens,
  openTokenLens,
  advanceTapLevel,
  activeTokenId,
  paragraphs,
  tokensMap,
  isPopoverOpen,
  closeVault,
  isVaultOpen,
  scriptTradition,
  toastMessage,
  openTutorial,
  openVoiceSettings,
  allStorySentences,
  playSentence,
} from './store/readerStore';
import { X, Sparkles } from 'lucide-solid';

export default function App() {
  const [showTip, setShowTip] = createSignal(true);

  // Title tokens for interactive 3-tap decoding of the book title (e.g. کھول دو)
  const titleTokens = () => {
    const titleP = paragraphs().find((p) => p.paragraphIndex === -1);
    if (!titleP) return [];
    return Object.values(tokensMap())
      .filter((t) => t.paragraphId === titleP.id)
      .sort((a, b) => a.tokenIndex - b.tokenIndex);
  };

  const handleTitleWordClick = (tokenId: string, e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (activeTokenId() === tokenId) {
      advanceTapLevel();
    } else {
      openTokenLens(tokenId, target);
    }
  };

  // Open the token lens when tapping a word in Scene Vocabulary Preview
  const handleSceneWordClick = (word: string, e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const allTokens = Object.values(tokensMap());
    const match = allTokens.find(
      (t) => t.isWord && (t.normalizedForm === word || t.surfaceForm === word)
    );
    if (match) {
      openTokenLens(match.id, target);
    }
  };

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('voiceSettings')) {
      openVoiceSettings();
    }

    await loadStories();
    loadVault();

    // First time visitor onboarding
    if (!localStorage.getItem('abjad_tutorial_seen') && !urlParams.has('notutorial') && !urlParams.has('voiceSettings')) {
      openTutorial();
    }

    // Direct token lens inspection via URL for automated verification & links
    const targetWord = urlParams.get('openWord');
    const targetTokenId = urlParams.get('openToken');
    const autoTap = parseInt(urlParams.get('tap') || '1', 10);

    setTimeout(() => {
      let targetEl: HTMLElement | null = null;
      let tokId: string | null = null;

      if (targetTokenId) {
        tokId = targetTokenId;
        targetEl = document.querySelector(`[data-token-id="${targetTokenId}"]`);
      } else if (targetWord) {
        const allTokens = Object.values(tokensMap());
        const match = allTokens.find(
          (t) => t.isWord && (t.normalizedForm === targetWord || t.surfaceForm === targetWord)
        );
        if (match) {
          tokId = match.id;
          targetEl = document.querySelector(`[data-token-id="${match.id}"]`);
        }
      }

      if (tokId && targetEl) {
        openTokenLens(tokId, targetEl);
        if (autoTap >= 2) advanceTapLevel();
        if (autoTap >= 3) advanceTapLevel();
      }

    if (urlParams.has('audio')) {
      const audioCheck = setInterval(() => {
        if (paragraphs().length > 0 && allStorySentences().length > 0) {
          clearInterval(audioCheck);
          playSentence(0);
        }
      }, 150);
    }
    }, 500);

    // Global keyboard listener for Escape
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPopoverOpen()) {
          closeTokenLens();
        } else if (isVaultOpen()) {
          closeVault();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleGlobalKeyDown));
  });

  // Keep body theme class updated
  createEffect(() => {
    const t = theme();
    document.body.className = `theme-${t}`;
  });

  const getLevelLabel = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'Level 1 · Novice';
      case 2:
        return 'Level 2 · Literary';
      case 3:
      default:
        return 'Level 3 · Classical Masterpiece';
    }
  };

  return (
    <div class="min-h-screen flex flex-col transition-colors duration-200">
      {/* Top Navigation */}
      <ReaderNavbar />

      {/* Main Content Area */}
      <main class="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 pb-28 sm:pb-36">
        <Show
          when={!isLoading()}
          fallback={
            <div class="flex items-center justify-center py-24 text-neutral-400">
              <div class="animate-pulse flex flex-col items-center gap-3">
                <div class="w-8 h-8 rounded-full border-2 border-neutral-900 dark:border-white border-t-transparent animate-spin" />
                <span class="text-xs font-medium">Loading story text...</span>
              </div>
            </div>
          }
        >
          {/* Luxury Book Page Presentation Container */}
          <article class="abjad-book-page rounded-2xl sm:rounded-3xl p-5 sm:p-10 md:p-14">
            {/* Story Title & Author Banner */}
            <Show when={activeStory()}>
              <header class="text-center mb-6 sm:mb-10 space-y-2 sm:space-y-3">
                <div
                  class={`inline-block px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-serif tracking-widest uppercase font-bold border shadow-xs ${
                    theme() === 'sepia'
                      ? 'bg-[#3A2D23] text-[#FAF6EC] border-[#554233]'
                      : theme() === 'midnight'
                      ? 'bg-neutral-100 text-neutral-900 border-neutral-300'
                      : 'bg-neutral-900 text-white border-neutral-800'
                  }`}
                >
                  {getLevelLabel(activeStory()!.level)}
                </div>

                <h1
                  dir="rtl"
                  class={`text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight py-2 select-text ${
                    scriptTradition() === 'naskh' ? 'font-naskh' : 'font-nastaliq'
                  }`}
                  style={{ 'line-height': 1.6 }}
                >
                  <Show
                    when={titleTokens().length > 0}
                    fallback={<span>{activeStory()!.titleUrdu}</span>}
                  >
                    <For each={titleTokens()}>
                      {(token) => {
                        if (!token.isWord) {
                          return <span>{token.surfaceForm}</span>;
                        }
                        return (
                          <span
                            class="abjad-word-token inline-block mx-1.5 cursor-pointer"
                            data-token-id={token.id}
                            data-active={activeTokenId() === token.id ? 'true' : 'false'}
                            onClick={(e) => handleTitleWordClick(token.id, e)}
                            title={`Tap to decode "${token.surfaceForm}"`}
                          >
                            {token.surfaceForm}
                          </span>
                        );
                      }}
                    </For>
                  </Show>
                </h1>

                <div class="text-xs sm:text-sm opacity-70 font-serif">
                  <span class="font-bold">{activeStory()!.titleEnglish}</span>
                  <span class="mx-2 opacity-40">·</span>
                  <span class="italic">by {activeStory()!.authorEnglish}</span>
                </div>

                {/* Classic Calligraphic / Ornamental Divider */}
                <div class="flex items-center justify-center gap-3 pt-2 opacity-35">
                  <div class="h-px w-10 sm:w-16 bg-current" />
                  <span class="text-xs font-serif">❦</span>
                  <div class="h-px w-10 sm:w-16 bg-current" />
                </div>
              </header>
            </Show>

            {/* Scene Vocabulary Preview (Pre-reading scaffolding - tap to decode in renderer) */}
            <Show when={activeStory()?.sceneVocabPreview && activeStory()!.sceneVocabPreview!.length > 0}>
              <div
                class={`mb-7 p-4 sm:p-5 rounded-2xl border space-y-3 transition-colors ${
                  theme() === 'sepia'
                    ? 'bg-[#F4ECE1] border-[#D8CCBA]'
                    : theme() === 'midnight'
                    ? 'bg-[#1C1E24] border-neutral-800'
                    : 'bg-[#F8F5EE] border-[#E5DACB]'
                }`}
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-[#B45309] dark:bg-amber-400" />
                    <span class="text-[11px] font-sans font-bold uppercase tracking-wider opacity-85">
                      Key Scene Vocabulary
                    </span>
                  </div>
                  <span class="text-xs font-medium opacity-60 font-sans">
                    Tap any word to decode
                  </span>
                </div>
                <div class="flex flex-wrap gap-2.5" dir="rtl">
                  <For each={activeStory()!.sceneVocabPreview}>
                    {(word) => (
                      <button
                        type="button"
                        class={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-base sm:text-lg font-nastaliq font-bold shadow-xs cursor-pointer active:scale-95 transition-all hover:scale-[1.02] ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border-[#D8CCBA] text-[#28201A]'
                            : theme() === 'midnight'
                            ? 'bg-[#252830] hover:bg-[#2D303A] border-neutral-700 text-[#ECE7DE]'
                            : 'bg-white hover:bg-neutral-100 border-[#DDD2C2] text-neutral-900'
                        }`}
                        onClick={(e) => handleSceneWordClick(word, e)}
                        title={`Tap to decode ${word}`}
                      >
                        {word}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Reading Instructions / Pedagogical Note (Dismissible) */}
            <Show when={showTip()}>
              <div
                class={`mb-6 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                  theme() === 'sepia'
                    ? 'bg-[#F4ECE1]/80 border-[#D8CCBA] text-[#28201A]'
                    : theme() === 'midnight'
                    ? 'bg-[#1C1E24] border-neutral-800 text-neutral-200'
                    : 'bg-[#FAF7F0] border-[#E5DACB] text-neutral-800'
                }`}
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-extrabold shrink-0">💡 3 Clues:</span>
                  <span class="truncate sm:whitespace-normal font-medium opacity-90">
                    Tap any word to sound it out (<strong>1: Diacritics</strong> → <strong>2: Spoken Bridge</strong> → <strong>3: English Gloss</strong>)
                  </span>
                </div>
                <button
                  type="button"
                  title="Dismiss tip"
                  class="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded opacity-60 hover:opacity-100 cursor-pointer shrink-0"
                  onClick={() => setShowTip(false)}
                >
                  <X size={14} />
                </button>
              </div>
            </Show>

            {/* Delegated Reader Surface */}
            <ReaderSurface />
          </article>
        </Show>
      </main>

      {/* Non-blocking Phonetic Toast Notification */}
      <Show when={toastMessage()}>
        <div class="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-neutral-900/95 text-white border border-white/20 shadow-xl backdrop-blur-md text-xs font-medium flex items-center gap-2 pointer-events-none transition-all duration-200">
          <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
          <span>{toastMessage()}</span>
        </div>
      </Show>

      {/* Floating 3-Tap Popover / Mobile Bottom Sheet */}
      <TokenLensPopover />

      {/* Synchronized Sentence Audio Bar */}
      <AudioBar />

      {/* Vocabulary Vault Slide-Over Drawer */}
      <VocabularyVault />

      {/* Interactive Onboarding Walkthrough */}
      <TutorialModal />

      {/* Urdu Voice & Narrator Settings Modal */}
      <VoiceSettingsModal />
    </div>
  );
}
