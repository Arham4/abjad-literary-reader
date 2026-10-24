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
  openVoiceSettings,
  ttsVoice,
} from '../store/readerStore';
import { BookMarked, HelpCircle, Check, ChevronDown, Type, Mic } from 'lucide-solid';

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
            <span
              class={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm font-nastaliq shadow-xs ${
                theme() === 'sepia'
                  ? 'bg-[#3A2D23] text-[#FAF6EC]'
                  : theme() === 'midnight'
                  ? 'bg-white text-neutral-900'
                  : 'bg-neutral-900 text-white'
              }`}
            >
              ابجد
            </span>
            <span class="font-serif font-bold text-sm tracking-wide hidden sm:inline">
              Abjad Reader
            </span>
          </div>

          <div class="h-4 w-px bg-black/10 dark:bg-white/10 hidden sm:block shrink-0" />

          {/* Story Selector with Clean Dropdown */}
          <div class="relative min-w-0">
            <select
              aria-label="Select Story"
              class={`appearance-none text-xs sm:text-sm font-medium py-1.5 pl-2.5 pr-7 rounded-lg border focus:outline-none cursor-pointer max-w-[155px] xs:max-w-[210px] sm:max-w-xs truncate transition-colors ${
                theme() === 'sepia'
                  ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border-[#D8CCBA] text-[#28201A]'
                  : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              value={activeStory()?.slug || ''}
              onChange={(e) => selectStory(e.currentTarget.value)}
            >
              <For each={stories()}>
                {(s) => (
                  <option value={s.slug}>
                    Level {s.level} · {s.titleEnglish}
                  </option>
                )}
              </For>
            </select>
            <ChevronDown size={12} class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
          </div>
        </div>

        {/* Right: Consolidated Controls */}
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tutorial / How to Use Button */}
          <button
            type="button"
            title="How to Use / Guided Tour"
            class={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-xs ${
              theme() === 'sepia'
                ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border-[#D8CCBA] text-[#28201A]'
                : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
            }`}
            onClick={openTutorial}
          >
            <HelpCircle size={14} class="shrink-0" />
            <span class="hidden md:inline">Guide</span>
          </button>

          {/* "Aa" Reading Appearance Menu Toggle */}
          <div class="relative">
            <button
              type="button"
              title="Reading Appearance (Font, Theme, Script)"
              class={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-serif font-bold transition-all cursor-pointer ${
                showAppearanceMenu()
                  ? theme() === 'sepia'
                    ? 'bg-[#3A2D23] text-[#FAF6EC] border-[#554233] shadow-xs'
                    : 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-xs'
                  : theme() === 'sepia'
                  ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border-[#D8CCBA] text-[#28201A]'
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
                class={`absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 p-4 rounded-2xl shadow-2xl border space-y-4 animate-fadeIn ${
                  theme() === 'sepia'
                    ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#28201A] shadow-[0_15px_35px_-5px_rgba(45,30,15,0.2)]'
                    : theme() === 'midnight'
                    ? 'bg-[#1A1C20] border-neutral-700 text-neutral-200'
                    : 'bg-white border-black/10 text-neutral-800'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div class="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                  <span class="font-serif font-bold text-xs uppercase tracking-wider opacity-60">
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
                  <span class="text-xs text-neutral-500">Script Style</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      class={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        scriptTradition() === 'nastaliq'
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
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
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                          : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400'
                      }`}
                      onClick={() => setScriptTradition('naskh')}
                    >
                      <div class="font-naskh text-sm leading-none mb-1">نسخ</div>
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
                          ? 'border-neutral-900 ring-2 ring-neutral-900/30 font-bold'
                          : 'border-black/10 hover:border-black/20'
                      }`}
                      style={{ 'background-color': '#FAF8F5', color: '#1F1B17' }}
                      onClick={() => setTheme('paper')}
                    >
                      <div class="w-4 h-4 rounded-full border border-black/15 bg-[#FAF8F5] flex items-center justify-center">
                        <Show when={theme() === 'paper'}>
                          <Check size={10} class="text-neutral-900" />
                        </Show>
                      </div>
                      <span class="text-[11px]">Paper</span>
                    </button>

                    <button
                      type="button"
                      class={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        theme() === 'sepia'
                          ? 'border-neutral-900 ring-2 ring-neutral-900/30 font-bold'
                          : 'border-black/10 hover:border-black/20'
                      }`}
                      style={{ 'background-color': '#F3EBDD', color: '#2B231D' }}
                      onClick={() => setTheme('sepia')}
                    >
                      <div class="w-4 h-4 rounded-full border border-black/15 bg-[#F3EBDD] flex items-center justify-center">
                        <Show when={theme() === 'sepia'}>
                          <Check size={10} class="text-neutral-900" />
                        </Show>
                      </div>
                      <span class="text-[11px]">Sepia</span>
                    </button>

                    <button
                      type="button"
                      class={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        theme() === 'midnight'
                          ? 'border-white ring-2 ring-white/40 font-bold'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      style={{ 'background-color': '#101114', color: '#ECE7DE' }}
                      onClick={() => setTheme('midnight')}
                    >
                      <div class="w-4 h-4 rounded-full border border-white/20 bg-[#101114] flex items-center justify-center">
                        <Show when={theme() === 'midnight'}>
                          <Check size={10} class="text-white" />
                        </Show>
                      </div>
                      <span class="text-[11px]">Midnight</span>
                    </button>
                  </div>
                </div>

                {/* 4. Persian Izafat Toggle */}
                <div class="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-medium">Persian Connectives (Izafat)</div>
                    <div class="text-[10px] text-neutral-400">Dashed underline on linked compound pairs</div>
                  </div>
                  <button
                    type="button"
                    class={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                      showIzafatHighlights() ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                    onClick={() => setShowIzafatHighlights(!showIzafatHighlights())}
                  >
                    <div
                      class={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 transition-transform absolute top-1 ${
                        showIzafatHighlights() ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Urdu Narrator & Voice Button */}
                <div class="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-medium">Narrator & Voice</div>
                    <div class="text-[10px] text-neutral-400">Choose voice persona, pace & engine</div>
                  </div>
                  <button
                    type="button"
                    class={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                      theme() === 'sepia'
                        ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border-[#D8CCBA] text-[#28201A]'
                        : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setShowAppearanceMenu(false);
                      openVoiceSettings();
                    }}
                  >
                    <Mic size={12} />
                    <span class="font-nastaliq text-xs font-bold leading-none" dir="rtl">
                      {ttsVoice() === 'ur-asad'
                        ? 'اسد'
                        : ttsVoice() === 'ur-uzma'
                        ? 'عظمیٰ'
                        : ttsVoice() === 'ur-salman'
                        ? 'سلمان'
                        : ttsVoice() === 'ur-gul'
                        ? 'گُل'
                        : 'آواز'}
                    </span>
                  </button>
                </div>
              </div>
            </Show>
          </div>

          {/* Vocabulary Vault Button */}
          <button
            type="button"
            title="Vocabulary Vault"
            class={`flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
              theme() === 'sepia'
                ? 'bg-[#3A2D23] hover:bg-[#2A1F17] text-[#FAF6EC]'
                : theme() === 'midnight'
                ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
            onClick={openVault}
          >
            <BookMarked size={14} class="shrink-0" />
            <span class="hidden sm:inline">Vault</span>
            <span
              class={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                theme() === 'sepia'
                  ? 'bg-[#524133] text-[#FAF6EC]'
                  : theme() === 'midnight'
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'bg-neutral-700 text-white'
              }`}
            >
              {vaultItems().length}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}