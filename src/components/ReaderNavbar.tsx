import { createSignal, For, Show, onCleanup } from 'solid-js';
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
import { BookMarked, HelpCircle, Check, ChevronDown, Type } from 'lucide-solid';

export default function ReaderNavbar() {
  const [showAppearanceMenu, setShowAppearanceMenu] = createSignal(false);

  // Close appearance menu on outside click or escape
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showAppearanceMenu()) {
      setShowAppearanceMenu(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  onCleanup(() => window.removeEventListener('keydown', handleKeyDown));

  return (
    <header class="sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200 border-black/5 dark:border-white/5 bg-inherit/90 shadow-xs">
      <div class="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Story Title */}
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex items-center gap-2 shrink-0">
            <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm font-nastaliq shadow-xs">
              ابجد
            </span>
            <span class="font-serif font-bold text-sm tracking-wide hidden sm:inline">
              Abjad <span class="text-[11px] font-normal text-neutral-400">/ ادبی قاری</span>
            </span>
          </div>

          <div class="h-4 w-px bg-black/10 dark:bg-white/10 hidden sm:block shrink-0" />

          {/* Story Selector with Clean Dropdown */}
          <div class="relative min-w-0">
            <select
              aria-label="Select Story"
              class="appearance-none text-xs sm:text-sm font-medium py-1.5 pl-2.5 pr-7 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[155px] xs:max-w-[210px] sm:max-w-xs truncate transition-colors"
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
            <ChevronDown size={12} class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
          </div>
        </div>

        {/* Right: Consolidated Controls */}
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tutorial / How to Use Button */}
          <button
            type="button"
            title="How to Use / Guided Tour"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
            onClick={openTutorial}
          >
            <HelpCircle size={14} class="shrink-0 text-amber-600" />
            <span class="hidden md:inline">Guide</span>
          </button>

          {/* "Aa" Reading Appearance Menu Toggle */}
          <div class="relative">
            <button
              type="button"
              title="Reading Appearance (Font, Theme, Script)"
              class={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-serif font-bold transition-all cursor-pointer ${
                showAppearanceMenu()
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200'
              }`}
              onClick={() => setShowAppearanceMenu(!showAppearanceMenu())}
            >
              <span class="text-sm leading-none">Aa</span>
              <ChevronDown size={11} class={`transition-transform duration-150 ${showAppearanceMenu() ? 'rotate-180' : ''}`} />
            </button>

            {/* Apple Books Style Reading Appearance Popover */}
            <Show when={showAppearanceMenu()}>
              {/* Invisible backdrop for outside click dismiss */}
              <div
                class="fixed inset-0 z-40"
                onClick={() => setShowAppearanceMenu(false)}
              />

              <div
                class="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 p-4 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1A1C20] text-neutral-800 dark:text-neutral-200 space-y-4 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div class="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                  <span class="font-serif font-bold text-xs uppercase tracking-wider text-neutral-400">
                    Reading Appearance
                  </span>
                  <span class="text-[10px] text-amber-600 font-medium">Auto-saved</span>
                </div>

                {/* 1. Font Size Adjuster */}
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs text-neutral-500">
                    <span>Font Size</span>
                    <span class="font-mono text-xs font-bold text-amber-600">{fontSizePx()}px</span>
                  </div>
                  <div class="flex items-center justify-between p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      class="flex-1 py-1.5 text-xs font-serif font-bold hover:bg-white dark:hover:bg-black/30 rounded-lg transition-colors cursor-pointer text-center"
                      onClick={() => setFontSizePx(Math.max(18, fontSizePx() - 2))}
                    >
                      A-
                    </button>
                    <div class="w-px h-4 bg-black/10 dark:bg-white/10" />
                    <button
                      type="button"
                      class="flex-1 py-1.5 text-sm font-serif font-bold hover:bg-white dark:hover:bg-black/30 rounded-lg transition-colors cursor-pointer text-center"
                      onClick={() => setFontSizePx(Math.min(42, fontSizePx() + 2))}
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* 2. Script Tradition (Nastaliq vs Naskh) */}
                <div class="space-y-1.5">
                  <span class="text-xs text-neutral-500">Script Tradition (رسم الخط)</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      class={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        scriptTradition() === 'nastaliq'
                          ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400'
                      }`}
                      onClick={() => setScriptTradition('nastaliq')}
                    >
                      <div class="font-nastaliq text-base leading-none mb-1">نستعلیق</div>
                      <div class="text-[10px] font-sans opacity-70">Nastaliq (Cursive)</div>
                    </button>

                    <button
                      type="button"
                      class={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        scriptTradition() === 'naskh'
                          ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400'
                      }`}
                      onClick={() => setScriptTradition('naskh')}
                    >
                      <div class="font-naskh text-sm leading-none mb-1">عربی نسخ</div>
                      <div class="text-[10px] font-sans opacity-70">Naskh (Linear)</div>
                    </button>
                  </div>
                </div>

                {/* 3. Paper Themes (3 Swatches) */}
                <div class="space-y-1.5">
                  <span class="text-xs text-neutral-500">Theme</span>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      class={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        theme() === 'paper'
                          ? 'border-amber-600 ring-2 ring-amber-500/30 font-bold'
                          : 'border-black/10 hover:border-black/20'
                      }`}
                      style={{ 'background-color': '#FAF8F5', color: '#1F1B17' }}
                      onClick={() => setTheme('paper')}
                    >
                      <div class="w-4 h-4 rounded-full border border-black/15 bg-[#FAF8F5] flex items-center justify-center">
                        <Show when={theme() === 'paper'}>
                          <Check size={10} class="text-amber-600" />
                        </Show>
                      </div>
                      <span class="text-[11px]">Paper</span>
                    </button>

                    <button
                      type="button"
                      class={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        theme() === 'sepia'
                          ? 'border-amber-700 ring-2 ring-amber-600/30 font-bold'
                          : 'border-black/10 hover:border-black/20'
                      }`}
                      style={{ 'background-color': '#F3EBDD', color: '#2B231D' }}
                      onClick={() => setTheme('sepia')}
                    >
                      <div class="w-4 h-4 rounded-full border border-black/15 bg-[#F3EBDD] flex items-center justify-center">
                        <Show when={theme() === 'sepia'}>
                          <Check size={10} class="text-amber-700" />
                        </Show>
                      </div>
                      <span class="text-[11px]">Sepia</span>
                    </button>

                    <button
                      type="button"
                      class={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        theme() === 'midnight'
                          ? 'border-amber-500 ring-2 ring-amber-400/30 font-bold'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      style={{ 'background-color': '#101114', color: '#ECE7DE' }}
                      onClick={() => setTheme('midnight')}
                    >
                      <div class="w-4 h-4 rounded-full border border-white/20 bg-[#101114] flex items-center justify-center">
                        <Show when={theme() === 'midnight'}>
                          <Check size={10} class="text-amber-400" />
                        </Show>
                      </div>
                      <span class="text-[11px]">Midnight</span>
                    </button>
                  </div>
                </div>

                {/* 4. Persian Izafat Toggle */}
                <div class="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-medium">Izafat Compounds (ِ)</div>
                    <div class="text-[10px] text-neutral-400">Underline Persian connective phrases</div>
                  </div>
                  <button
                    type="button"
                    class={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                      showIzafatHighlights() ? 'bg-amber-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                    onClick={() => setShowIzafatHighlights(!showIzafatHighlights())}
                  >
                    <div
                      class={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        showIzafatHighlights() ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Show>
          </div>

          {/* Vocabulary Vault Button */}
          <button
            type="button"
            title="Vocabulary Vault (ذخیرہ الفاظ)"
            class="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
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
    </header>
  );
}