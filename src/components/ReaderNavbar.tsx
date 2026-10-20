import { For, Show } from 'solid-js';
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
  ScriptTradition,
} from '../store/readerStore';
import { BookMarked, Sun, Moon, Coffee, Type, Sliders, Sparkles } from 'lucide-solid';

export default function ReaderNavbar() {
  return (
    <header class="sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200 shadow-xs">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & Story Selector */}
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs">
              ابجد
            </span>
            <span class="hidden sm:inline font-bold text-base tracking-tight">Abjad Reader</span>
          </div>

          {/* Story Selector Dropdown */}
          <div class="relative">
            <select
              aria-label="Select Story"
              class="text-xs sm:text-sm font-medium py-1.5 px-3 pr-8 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              value={activeStory()?.slug || ''}
              onChange={(e) => selectStory(e.currentTarget.value)}
            >
              <For each={stories()}>
                {(s) => (
                  <option value={s.slug}>
                    {s.titleEnglish} ({s.titleUrdu}) • Lvl {s.level}
                  </option>
                )}
              </For>
            </select>
          </div>
        </div>

        {/* Controls: Script, Font Size, Theme & Vault */}
        <div class="flex items-center gap-2 sm:gap-3">
          {/* Script Tradition Switcher */}
          <div class="hidden sm:flex items-center p-0.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-xs">
            <button
              type="button"
              class={`px-2.5 py-1 rounded-md font-nastaliq transition-all cursor-pointer ${
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
              class={`px-2.5 py-1 rounded-md font-naskh transition-all cursor-pointer ${
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
          <div class="flex items-center gap-1 border border-black/10 dark:border-white/10 rounded-lg p-0.5 bg-black/5 dark:bg-white/5">
            <button
              type="button"
              title="Decrease Font Size"
              class="w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer"
              onClick={() => setFontSizePx(Math.max(20, fontSizePx() - 2))}
            >
              -
            </button>
            <span class="text-xs px-1 font-mono">{fontSizePx()}px</span>
            <button
              type="button"
              title="Increase Font Size"
              class="w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer"
              onClick={() => setFontSizePx(Math.min(44, fontSizePx() + 2))}
            >
              +
            </button>
          </div>

          {/* Izafat Underline Toggle */}
          <button
            type="button"
            title="ترکیبِ اضافت نمایاں کریں (Toggle Izafat highlights)"
            class={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showIzafatHighlights()
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'border-transparent text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            onClick={() => setShowIzafatHighlights(!showIzafatHighlights())}
          >
            <span>ِ اضافت</span>
          </button>

          {/* Theme Switcher */}
          <div class="flex items-center border border-black/10 dark:border-white/10 rounded-lg p-0.5 bg-black/5 dark:bg-white/5">
            <button
              type="button"
              title="Paper Theme"
              class={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme() === 'paper' ? 'bg-amber-600 text-white shadow-xs' : 'text-neutral-500 hover:text-black'
              }`}
              onClick={() => setTheme('paper')}
            >
              <Sun size={15} />
            </button>
            <button
              type="button"
              title="Sepia Theme"
              class={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme() === 'sepia' ? 'bg-amber-700 text-white shadow-xs' : 'text-neutral-500 hover:text-black'
              }`}
              onClick={() => setTheme('sepia')}
            >
              <Coffee size={15} />
            </button>
            <button
              type="button"
              title="Midnight Theme"
              class={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme() === 'midnight' ? 'bg-neutral-800 text-amber-400 shadow-xs' : 'text-neutral-500 hover:text-white'
              }`}
              onClick={() => setTheme('midnight')}
            >
              <Moon size={15} />
            </button>
          </div>

          {/* Vocabulary Vault Drawer Button */}
          <button
            type="button"
            title="ذخیرہ الفاظ (Vocabulary Vault)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer"
            onClick={openVault}
          >
            <BookMarked size={16} />
            <span class="hidden sm:inline">لغت و الفاظ</span>
            <span class="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">
              {vaultItems().length}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
