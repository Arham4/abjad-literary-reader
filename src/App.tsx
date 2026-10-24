import { onMount, onCleanup, Show, createSignal, createEffect } from 'solid-js';
import ReaderNavbar from './components/ReaderNavbar';
import ReaderSurface from './components/ReaderSurface';
import TokenLensPopover from './components/TokenLensPopover';
import AudioBar from './components/AudioBar';
import VocabularyVault from './components/VocabularyVault';
import TutorialModal from './components/TutorialModal';
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

  onMount(() => {
    loadStories();
    loadVault();

    // First time visitor onboarding
    if (!localStorage.getItem('abjad_tutorial_seen')) {
      openTutorial();
    }

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
                <div class="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-serif tracking-widest uppercase font-bold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-xs">
                  {getLevelLabel(activeStory()!.level)}
                </div>

                <h1
                  dir="rtl"
                  class={`text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight py-2 select-text ${
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
                            class="abjad-word-token inline-block mx-1.5 cursor-pointer hover:opacity-85 transition-all"
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

                <div class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-serif">
                  <span class="font-bold">{activeStory()!.titleEnglish}</span>
                  <span class="mx-2 opacity-40">·</span>
                  <span class="italic">by {activeStory()!.authorEnglish}</span>
                </div>

                {/* Classic Calligraphic / Ornamental Divider */}
                <div class="flex items-center justify-center gap-3 pt-2 opacity-35 text-neutral-500 dark:text-neutral-400">
                  <div class="h-px w-10 sm:w-16 bg-current" />
                  <span class="text-xs font-serif">❦</span>
                  <div class="h-px w-10 sm:w-16 bg-current" />
                </div>
              </header>
            </Show>

            {/* Scene Vocabulary Preview (Pre-reading scaffolding - tap to decode in renderer) */}
            <Show when={activeStory()?.sceneVocabPreview && activeStory()!.sceneVocabPreview!.length > 0}>
              <div class="mb-6 p-3 sm:p-4 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border-2 border-neutral-300 dark:border-neutral-700 space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-sans font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    Scene Vocabulary Preview
                  </span>
                  <span class="text-xs font-medium text-neutral-500 font-sans">
                    Tap any word to decode
                  </span>
                </div>
                <div class="flex flex-wrap gap-2" dir="rtl">
                  <For each={activeStory()!.sceneVocabPreview}>
                    {(word) => (
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-white text-neutral-950 dark:text-white text-base font-nastaliq font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
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
              <div class="mb-6 p-2.5 sm:p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 flex items-center justify-between gap-2 transition-all">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-neutral-950 dark:text-white font-extrabold shrink-0">💡 3 Gradual Clues:</span>
                  <span class="truncate sm:whitespace-normal font-medium">
                    Tap any word to sound it out (<strong>1: Diacritics</strong> → <strong>2: Spoken Bridge</strong> → <strong>3: English Gloss</strong>)
                  </span>
                </div>
                <button
                  type="button"
                  title="Dismiss tip"
                  class="p-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-300 cursor-pointer shrink-0"
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
    </div>
  );
}
