import { createSignal, For, Show } from 'solid-js';
import {
  isVaultOpen,
  closeVault,
  vaultItems,
  playTTS,
  theme,
} from '../store/readerStore';
import { X, Volume2, Search, BookMarked, Sparkles } from 'lucide-solid';

export default function VocabularyVault() {
  const [selectedTier, setSelectedTier] = createSignal<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = createSignal<string>('');

  const filteredItems = () => {
    return vaultItems().filter((item) => {
      // Tier filter
      if (selectedTier() !== 'all' && item.maxTapLevel !== selectedTier()) {
        return false;
      }
      // Search filter
      const q = searchQuery().trim().toLowerCase();
      if (!q) return true;
      return (
        item.normalizedSurface.toLowerCase().includes(q) ||
        item.vocalizedSurface.toLowerCase().includes(q)
      );
    });
  };

  const getTierBadge = (level: number) => {
    switch (level) {
      case 1:
        return { label: 'صرف ہجے و آواز', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' };
      case 2:
        return { label: 'اردو پل و مادہ', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' };
      case 3:
      default:
        return { label: 'مکمل ادبی مفہوم', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' };
    }
  };

  return (
    <Show when={isVaultOpen()}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={closeVault}
      />

      {/* Slide-over Drawer */}
      <aside
        class={`fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] shadow-2xl flex flex-col transition-transform duration-300 ${
          theme() === 'midnight'
            ? 'bg-[#18191d] border-l border-neutral-800 text-[#E7E2D8]'
            : theme() === 'sepia'
            ? 'bg-[#FAF4E8] border-l border-[#E2D6C0] text-[#29221E]'
            : 'bg-[#FFFCF7] border-l border-[#E8DFC9] text-[#1C1917]'
        }`}
        style={{
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Header */}
        <div class="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-lg bg-amber-600 text-white shadow-xs">
              <BookMarked size={18} />
            </div>
            <div>
              <h2 class="text-base font-bold tracking-tight">ذخیرہ الفاظ (Vocabulary Vault)</h2>
              <p class="text-xs text-neutral-500">آپ کے زیرِ مطالعہ آنے والے الفاظ کی تاریخی یادداشت</p>
            </div>
          </div>
          <button
            type="button"
            title="بند کریں (Close)"
            class="p-2 rounded-lg hover:bg-neutral-500/10 text-neutral-500 transition-colors cursor-pointer"
            onClick={closeVault}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Tier Filters */}
        <div class="p-4 border-b border-black/10 dark:border-white/10 space-y-3">
          {/* Search Input */}
          <div class="relative">
            <Search size={14} class="absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="تلاش کریں (Search word)..."
              class="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </div>

          {/* Tier Tabs */}
          <div class="flex items-center gap-1 overflow-x-auto text-xs pb-1">
            <button
              type="button"
              class={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedTier() === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
              }`}
              onClick={() => setSelectedTier('all')}
            >
              تمام ({vaultItems().length})
            </button>
            <button
              type="button"
              class={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedTier() === 1
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
              }`}
              onClick={() => setSelectedTier(1)}
            >
              ہجے (Lvl 1)
            </button>
            <button
              type="button"
              class={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedTier() === 2
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
              }`}
              onClick={() => setSelectedTier(2)}
            >
              اردو پل (Lvl 2)
            </button>
            <button
              type="button"
              class={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedTier() === 3
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
              }`}
              onClick={() => setSelectedTier(3)}
            >
              مکمل معنی (Lvl 3)
            </button>
          </div>
        </div>

        {/* Word Cards List */}
        <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
          <Show
            when={filteredItems().length > 0}
            fallback={
              <div class="text-center py-12 text-neutral-400 space-y-2">
                <Sparkles size={28} class="mx-auto opacity-40 text-amber-500" />
                <p class="text-sm">کوئی لفظ نہیں ملا۔</p>
                <p class="text-xs opacity-75">متن میں کسی بھی لفظ پر کلک کریں تاکہ وہ یہاں محفوظ ہو جائے۔</p>
              </div>
            }
          >
            <For each={filteredItems()}>
              {(item) => {
                const badge = getTierBadge(item.maxTapLevel);
                return (
                  <div class="p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-colors">
                    {/* Word display & audio */}
                    <div class="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        title="تلفظ سنیں"
                        class="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors cursor-pointer shrink-0 mt-1"
                        onClick={() => playTTS(item.vocalizedSurface)}
                      >
                        <Volume2 size={16} />
                      </button>
                      <div dir="rtl" class="text-right flex-1 min-w-0">
                        <div class="font-nastaliq text-2xl leading-none">{item.vocalizedSurface}</div>
                        <Show when={item.englishGloss}>
                          <div class="text-xs font-sans text-indigo-700 dark:text-indigo-300 mt-1 font-medium truncate text-left" dir="ltr">
                            {item.englishGloss}
                          </div>
                        </Show>
                        <Show when={item.urduExplanation}>
                          <div class="text-[11px] font-nastaliq text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
                            {item.urduExplanation}
                          </div>
                        </Show>
                        <Show when={item.arabicRoot}>
                          <div class="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                            مادہ: {item.arabicRoot}
                          </div>
                        </Show>
                      </div>
                    </div>

                    {/* Metadata: Tier & Lookup Count */}
                    <div class="flex flex-col items-end gap-1 text-right">
                      <span class={`px-2 py-0.5 rounded text-[10px] font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span class="text-[10px] text-neutral-500 font-mono">
                        {item.lookupCount} بار دیکھا گیا
                      </span>
                    </div>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>
      </aside>
    </Show>
  );
}
