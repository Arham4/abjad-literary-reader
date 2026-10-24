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
        return 'Level 1: Novice (درجہ ۱)';
      case 2:
        return 'Level 2: Literary (درجہ ۲ - ادبی)';
      case 3:
      default:
        return 'Level 3: Classical Masterpiece (درجہ ۳ - کلاسیکی)';
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
                <div class="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                <span class="text-xs font-medium">تحریر لوڈ کی جا رہی ہے...</span>
              </div>
            </div>
          }
        >
          {/* Luxury Book Page Presentation Container */}
          <article class="abjad-book-page rounded-2xl sm:rounded-3xl p-5 sm:p-10 md:p-14">
            {/* Story Title & Author Banner */}
            <Show when={activeStory()}>
              <header class="text-center mb-6 sm:mb-10 space-y-2 sm:space-y-3">
                <div class="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-serif tracking-widest uppercase font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-600/15">
                  {getLevelLabel(activeStory()!.level)}
                </div>

                <h1
                  dir="rtl"
                  class={`text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight py-1 ${
                    scriptTradition() === 'naskh' ? 'font-naskh' : 'font-nastaliq'
                  }`}
                  style={{ 'line-height': 1.6 }}
                >
                  {activeStory()!.titleUrdu}
                </h1>

                <div class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-serif">
                  <span>{activeStory()!.titleEnglish}</span>
                  <span class="mx-2 opacity-40">·</span>
                  <span class="italic">by {activeStory()!.authorEnglish}</span>
                  <span class="mx-1.5 opacity-40">(</span>
                  <span dir="rtl" class="font-nastaliq text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
                    {activeStory()!.authorUrdu}
                  </span>
                  <span class="opacity-40">)</span>
                </div>

                {/* Classic Calligraphic / Ornamental Divider */}
                <div class="flex items-center justify-center gap-3 pt-2 opacity-35 text-amber-700 dark:text-amber-300">
                  <div class="h-px w-10 sm:w-16 bg-current" />
                  <span class="text-xs font-serif">❦</span>
                  <div class="h-px w-10 sm:w-16 bg-current" />
                </div>
              </header>
            </Show>

            {/* Reading Instructions / Pedagogical Note (Dismissible) */}
            <Show when={showTip()}>
              <div class="mb-6 p-2.5 sm:p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between gap-2 transition-all">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-amber-600 font-bold shrink-0">💡 3 Gradual Clues:</span>
                  <span class="truncate sm:whitespace-normal">
                    Tap any word to sound it out (<strong>1: Diacritics</strong> → <strong>2: Spoken Bridge</strong> → <strong>3: English Gloss</strong>)
                  </span>
                </div>
                <button
                  type="button"
                  title="Dismiss tip"
                  class="p-1 hover:bg-neutral-500/10 rounded text-neutral-400 cursor-pointer shrink-0"
                  onClick={() => setShowTip(false)}
                >
                  <X size={13} />
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
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
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
