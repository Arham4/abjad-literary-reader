import { onMount, onCleanup, Show, createEffect } from 'solid-js';
import ReaderNavbar from './components/ReaderNavbar';
import ReaderSurface from './components/ReaderSurface';
import TokenLensPopover from './components/TokenLensPopover';
import AudioBar from './components/AudioBar';
import VocabularyVault from './components/VocabularyVault';
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
} from './store/readerStore';

export default function App() {
  onMount(() => {
    loadStories();
    loadVault();

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
        return 'درجہ ۱ (ابتدائی / Intermediate)';
      case 2:
        return 'درجہ ۲ (ادبی / Literary)';
      case 3:
      default:
        return 'درجہ ۳ (اعلیٰ کلاسیکی / High Classical)';
    }
  };

  return (
    <div class="min-h-screen flex flex-col transition-colors duration-200">
      {/* Top Navigation */}
      <ReaderNavbar />

      {/* Main Content Area */}
      <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-8 pb-32">
        <Show
          when={!isLoading()}
          fallback={
            <div class="flex items-center justify-center py-24 text-neutral-400">
              <div class="animate-pulse flex flex-col items-center gap-3">
                <div class="w-10 h-10 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                <span class="text-sm font-medium">تحریر لوڈ کی جا رہی ہے...</span>
              </div>
            </div>
          }
        >
          {/* Story Title & Author Banner */}
          <Show when={activeStory()}>
            <div class="text-center mb-8 pb-6 border-b border-black/10 dark:border-white/10 space-y-2">
              <div class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 mb-1">
                {getLevelLabel(activeStory()!.level)}
              </div>
              <h1
                dir="rtl"
                class={`text-4xl sm:text-5xl font-bold tracking-tight ${
                  scriptTradition() === 'naskh' ? 'font-naskh' : 'font-nastaliq'
                }`}
                style={{ 'line-height': 1.8 }}
              >
                {activeStory()!.titleUrdu}
              </h1>
              <div class="text-sm text-neutral-500 font-sans">
                {activeStory()!.titleEnglish} — by {activeStory()!.authorEnglish} (
                <span dir="rtl" class="font-nastaliq text-base">
                  {activeStory()!.authorUrdu}
                </span>
                )
              </div>
            </div>
          </Show>

          {/* Reading Instructions / Pedagogical Note */}
          <div class="mb-6 p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="text-amber-600 font-bold">💡 ۳-اشاراتی تدریجی اصول:</span>
              <span>کسی بھی لفظ پر کلک کریں: پہلا کلک اعراب و ہجے، دوسرا کلک اردو پل، تیسرا کلک انگریزی مفہوم دکھائے گا۔</span>
            </div>
            <span class="hidden sm:inline font-mono opacity-60 text-[11px]">Space = اگلا اشارہ</span>
          </div>

          {/* Delegated Reader Surface */}
          <ReaderSurface />
        </Show>
      </main>

      {/* Floating 3-Tap Popover / Mobile Bottom Sheet */}
      <TokenLensPopover />

      {/* Synchronized Sentence Audio Bar */}
      <AudioBar />

      {/* Vocabulary Vault Slide-Over Drawer */}
      <VocabularyVault />
    </div>
  );
}
