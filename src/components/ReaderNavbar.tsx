import { createSignal, For, Show } from 'solid-js';
import {
  stories,
  activeStory,
  selectStory,
  scriptTradition,
  setScriptTradition,
  fontSizePx,
  setFontSizePx,
  theme,
  setTheme,
  showIzafatHighlights,
  setShowIzafatHighlights,
  openVault,
  vaultItems,
  openTutorial,
} from '../store/readerStore';
import { BookMarked, Sun, Moon, Coffee, SlidersHorizontal, Check, HelpCircle } from 'lucide-solid';

export default function ReaderNavbar() {
  const [showMobileSettings, setShowMobileSettings] = createSignal(false);

  // Cycle themes: paper -> sepia -> midnight -> paper
  const cycleTheme = () => {
    const current = theme();
    if (current === 'paper') setTheme('sepia');
    else if (current === 'sepia') setTheme('midnight');
    else setTheme('paper');
  };

  return (
    <header class="sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200 shadow-xs">
      <div class="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Story Select */}
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm tracking-wider shadow-xs shrink-0 font-nastaliq">
            ابجد
          </div>

          {/* Story Selector with Responsive Truncation */}
          <div class="relative min-w-0">
            <select
              aria-label="Select Story"
              class="text-xs sm:text-sm font-medium py-1 sm:py-1.5 pl-2 pr-6 sm:pr-8 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[145px] xs:max-w-[190px] sm:max-w-none truncate"
              value={activeStory()?.slug || ''}
              onChange={(e) => selectStory(e.currentTarget.value)}
            >
              <For each={stories()}>
                {(s) => (
                  <option value={s.slug}>
                    {s.titleEnglish} ({s.titleUrdu})
                  </option>
                )}
              </For>
            </select>
          </div>
        </div>

        {/* Right: Controls */}
        <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop-only Script Tradition Switcher */}
          <div class="hidden md:flex items-center p-0.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-xs">
            <button
              type="button"
              class={`px-2 py-1 rounded-md font-nastaliq transition-all cursor-pointer ${
                scriptTradition() === 'nastaliq'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
              onClick={() => setScriptTradition('nastaliq')}
              title="نستعلیق رسم الخط"
            >
              نستعلیق
            </button>
            <button
              type="button"
              class={`px-2 py-1 rounded-md font-naskh transition-all cursor-pointer ${
                scriptTradition() === 'naskh'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
              onClick={() => setScriptTradition('naskh')}
              title="نسخ رسم الخط"
            >
              نسخ
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div class="flex items-center border border-black/10 dark:border-white/10 rounded-lg p-0.5 bg-black/5 dark:bg-white/5 text-xs">
            <button
              type="button"
              title="Decrease Font Size"
              class="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer"
              onClick={() => setFontSizePx(Math.max(18, fontSizePx() - 2))}
            >
              -
            </button>
            <span class="px-1 font-mono text-[11px] sm:text-xs min-w-[28px] text-center">{fontSizePx()}</span>
            <button
              type="button"
              title="Increase Font Size"
              class="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer"
              onClick={() => setFontSizePx(Math.min(44, fontSizePx() + 2))}
            >
              +
            </button>
          </div>

          {/* Desktop Theme Switcher (3 buttons) */}
          <div class="hidden sm:flex items-center border border-black/10 dark:border-white/10 rounded-lg p-0.5 bg-black/5 dark:bg-white/5">
            <button
              type="button"
              title="Paper Theme"
              class={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme() === 'paper' ? 'bg-amber-600 text-white shadow-xs' : 'text-neutral-500 hover:text-black'
              }`}
              onClick={() => setTheme('paper')}
            >
              <Sun size={14} />
            </button>
            <button
              type="button"
              title="Sepia Theme"
              class={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme() === 'sepia' ? 'bg-amber-700 text-white shadow-xs' : 'text-neutral-500 hover:text-black'
              }`}
              onClick={() => setTheme('sepia')}
            >
              <Coffee size={14} />
            </button>
            <button
              type="button"
              title="Midnight Theme"
              class={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme() === 'midnight' ? 'bg-neutral-800 text-amber-400 shadow-xs' : 'text-neutral-500 hover:text-white'
              }`}
              onClick={() => setTheme('midnight')}
            >
              <Moon size={14} />
            </button>
          </div>

          {/* Mobile Theme Switcher (single tap cycling button) */}
          <button
            type="button"
            title={`Theme: ${theme()} (Tap to change)`}
            class="sm:hidden p-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-amber-600 dark:text-amber-400"
            onClick={cycleTheme}
          >
            <Show when={theme() === 'paper'}>
              <Sun size={15} />
            </Show>
            <Show when={theme() === 'sepia'}>
              <Coffee size={15} />
            </Show>
            <Show when={theme() === 'midnight'}>
              <Moon size={15} />
            </Show>
          </button>

          {/* Mobile Settings Toggle (Script, Izafat) */}
          <button
            type="button"
            title="Reading Settings"
            class={`md:hidden p-1.5 rounded-lg border transition-colors ${
              showMobileSettings()
                ? 'bg-amber-600 text-white border-amber-600'
                : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400'
            }`}
            onClick={() => setShowMobileSettings(!showMobileSettings())}
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* How It Works / Tutorial Button */}
          <button
            type="button"
            title="How to Use / Guided Tour"
            class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-amber-600/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            onClick={openTutorial}
          >
            <HelpCircle size={14} class="shrink-0" />
            <span class="hidden sm:inline">How to Use</span>
          </button>

          {/* Vocabulary Vault Button */}
          <button
            type="button"
            title="Vocabulary Vault (ذخیرہ الفاظ)"
            class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer"
            onClick={openVault}
          >
            <BookMarked size={14} class="shrink-0" />
            <span class="hidden sm:inline">Vault</span>
            <span class="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">
              {vaultItems().length}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Secondary Settings Drawer / Bar */}
      <Show when={showMobileSettings()}>
        <div class="md:hidden px-4 py-2.5 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between text-xs animate-fadeIn">
          {/* Script Tradition Toggle */}
          <div class="flex items-center gap-1.5">
            <span class="text-neutral-500 font-sans text-[11px]">رسم الخط:</span>
            <div class="flex items-center p-0.5 rounded-md border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40">
              <button
                type="button"
                class={`px-2 py-0.5 rounded font-nastaliq ${
                  scriptTradition() === 'nastaliq' ? 'bg-amber-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
                onClick={() => setScriptTradition('nastaliq')}
              >
                نستعلیق
              </button>
              <button
                type="button"
                class={`px-2 py-0.5 rounded font-naskh ${
                  scriptTradition() === 'naskh' ? 'bg-amber-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
                onClick={() => setScriptTradition('naskh')}
              >
                نسخ
              </button>
            </div>
          </div>

          {/* Izafat Underline Toggle */}
          <button
            type="button"
            class={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] ${
              showIzafatHighlights()
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'border-black/10 dark:border-white/10 text-neutral-500'
            }`}
            onClick={() => setShowIzafatHighlights(!showIzafatHighlights())}
          >
            <Check size={12} class={showIzafatHighlights() ? 'opacity-100' : 'opacity-0'} />
            <span>ترکیبِ اضافت (ِ)</span>
          </button>
        </div>
      </Show>
    </header>
  );
}
