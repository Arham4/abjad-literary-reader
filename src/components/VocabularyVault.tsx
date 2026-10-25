import { createSignal, For, Show, createMemo } from 'solid-js';
import {
  isVaultOpen,
  closeVault,
  vaultItems,
  playWordAudio,
  theme,
  deleteVaultItem,
  undoDeleteVaultItem,
  lastDeletedItem,
  toggleVaultItemStar,
  toggleVaultItemMastery,
  clearVault,
  selectStory,
  activeStory,
  TelemetryItem,
} from '../store/readerStore';
import {
  X,
  Volume2,
  Search,
  BookMarked,
  Sparkles,
  Trash2,
  Star,
  Undo2,
  Download,
  Check,
  Layers,
  RotateCcw,
  ExternalLink,
} from 'lucide-solid';

type ViewMode = 'list' | 'flashcards';
type DensityMode = 'detailed' | 'compact';
type FilterStatus = 'all' | 'starred' | 'learning' | 'mastered' | 1 | 2 | 3;
type SortOrder = 'newest' | 'difficulty' | 'alphabetical';

export default function VocabularyVault() {
  const [viewMode, setViewMode] = createSignal<ViewMode>('list');
  const [densityMode, setDensityMode] = createSignal<DensityMode>('detailed');
  const [filterStatus, setFilterStatus] = createSignal<FilterStatus>('all');
  const [storyFilter, setStoryFilter] = createSignal<string>('all');
  const [sortOrder, setSortOrder] = createSignal<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = createSignal<string>('');
  const [showClearConfirm, setShowClearConfirm] = createSignal<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = createSignal<string | null>(null);

  // Flashcard Study Mode State
  const [cardIndex, setCardIndex] = createSignal<number>(0);
  const [cardRevealStep, setCardRevealStep] = createSignal<number>(0); // 0: bare, 1: vowels, 2: spoken bridge, 3: english

  // Unique list of stories present in vault items
  const availableStories = createMemo(() => {
    const map = new Map<string, string>();
    for (const item of vaultItems()) {
      if (item.storySlug && item.storyTitleUrdu) {
        map.set(item.storySlug, item.storyTitleUrdu);
      }
    }
    return Array.from(map.entries()).map(([slug, title]) => ({ slug, title }));
  });

  // Filtered and Sorted items
  const filteredItems = createMemo(() => {
    const q = searchQuery().trim().toLowerCase();
    const filter = filterStatus();
    const story = storyFilter();

    let list = vaultItems().filter((item) => {
      // Story filter
      if (story !== 'all' && item.storySlug !== story) return false;

      // Status & Tap filters
      if (filter === 'starred' && !item.isStarred) return false;
      if (filter === 'learning' && item.masteryStatus === 'mastered') return false;
      if (filter === 'mastered' && item.masteryStatus !== 'mastered') return false;
      if (typeof filter === 'number' && item.maxTapLevel !== filter) return false;

      // Dual-language search (Urdu + English)
      if (q) {
        const matchesUrdu =
          item.normalizedSurface.toLowerCase().includes(q) ||
          item.vocalizedSurface.toLowerCase().includes(q);
        const matchesEnglish = item.englishGloss?.toLowerCase().includes(q);
        const matchesSpoken = item.spokenSynonyms?.some((s) => s.toLowerCase().includes(q));
        const matchesUrduExp = item.urduExplanation?.toLowerCase().includes(q);
        const matchesStory = item.storyTitleUrdu?.toLowerCase().includes(q);

        if (!matchesUrdu && !matchesEnglish && !matchesSpoken && !matchesUrduExp && !matchesStory) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    switch (sortOrder()) {
      case 'difficulty':
        list = [...list].sort((a, b) => b.lookupCount - a.lookupCount);
        break;
      case 'alphabetical':
        list = [...list].sort((a, b) => a.normalizedSurface.localeCompare(b.normalizedSurface, 'ur'));
        break;
      case 'newest':
      default:
        list = [...list].sort(
          (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
        );
        break;
    }

    return list;
  });

  const getTierBadge = (level: number) => {
    const t = theme();
    switch (level) {
      case 1:
        return {
          label: 'Tap 1: Sound Out',
          color:
            t === 'sepia'
              ? 'bg-[#EAE0CF] text-[#3A2D23] border border-[#D4C5AD] font-bold'
              : t === 'midnight'
              ? 'bg-neutral-800 text-neutral-200 border border-neutral-700 font-bold'
              : 'bg-neutral-100 text-neutral-800 border border-neutral-300 font-bold',
        };
      case 2:
        return {
          label: 'Tap 2: Spoken Bridge',
          color:
            t === 'sepia'
              ? 'bg-[#DDE9DF] text-[#1E4D2B] border border-[#B7D2BD] font-bold'
              : t === 'midnight'
              ? 'bg-[#1E3326] text-emerald-300 border border-emerald-800/70 font-bold'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
        };
      case 3:
      default:
        return {
          label: 'Tap 3: Full Gloss',
          color:
            t === 'sepia'
              ? 'bg-[#E3E8F0] text-[#1E2E4A] border border-[#C2D0E4] font-bold'
              : t === 'midnight'
              ? 'bg-[#202738] text-indigo-200 border border-indigo-800/70 font-bold'
              : 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold',
        };
    }
  };

  const handlePlayAudio = async (item: TelemetryItem) => {
    if (playingAudioId() === item.id) return;
    setPlayingAudioId(item.id);

    const voc = item.vocalizedSurface || '';
    const norm = item.normalizedSurface || '';
    const toPlay = voc && (voc.includes('آ') || voc.includes('\u0653')) ? voc : norm || voc;

    const handle = await playWordAudio(toPlay);
    if (handle) {
      handle.onEnded(() => setPlayingAudioId(null));
      handle.onError(() => setPlayingAudioId(null));
    } else {
      setPlayingAudioId(null);
    }
  };

  const handleJumpToStory = async (storySlug: string | null | undefined) => {
    if (!storySlug) return;
    closeVault();
    if (!activeStory() || activeStory()?.slug !== storySlug) {
      await selectStory(storySlug);
    }
  };

  // Flashcard Helpers
  const currentFlashcard = createMemo(() => {
    const list = filteredItems();
    if (!list.length) return null;
    const safeIdx = Math.min(cardIndex(), list.length - 1);
    return list[safeIdx];
  });

  const handleNextCard = () => {
    setCardRevealStep(0);
    const list = filteredItems();
    if (cardIndex() < list.length - 1) {
      setCardIndex(cardIndex() + 1);
    } else {
      setCardIndex(0);
    }
  };

  const handleCardMastery = async (mastered: boolean) => {
    const card = currentFlashcard();
    if (card) {
      if (mastered && card.masteryStatus !== 'mastered') {
        await toggleVaultItemMastery(card.id);
      } else if (!mastered && card.masteryStatus === 'mastered') {
        await toggleVaultItemMastery(card.id);
      }
    }
    handleNextCard();
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
        class={`fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] shadow-2xl flex flex-col transition-transform duration-300 ${
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
        <div
          class={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            theme() === 'sepia'
              ? 'border-[#E2D6C0]'
              : theme() === 'midnight'
              ? 'border-neutral-800'
              : 'border-[#E8DFC9]'
          }`}
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class={`p-2 rounded-lg shadow-xs shrink-0 ${
                theme() === 'sepia'
                  ? 'bg-[#3A2D23] text-[#FAF6EC]'
                  : theme() === 'midnight'
                  ? 'bg-white text-neutral-900'
                  : 'bg-neutral-900 text-white'
              }`}
            >
              <BookMarked size={18} />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold tracking-tight truncate">Vocabulary Vault</h2>
                <span
                  class={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                    theme() === 'sepia'
                      ? 'bg-[#EFE6D5] text-[#3A2D23]'
                      : theme() === 'midnight'
                      ? 'bg-neutral-800 text-neutral-200'
                      : 'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {vaultItems().length}
                </span>
              </div>
              <p class="text-xs opacity-70 truncate">Personal words & literary expressions</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle: List vs Flashcards */}
            <div
              class={`inline-flex rounded-lg border p-0.5 text-xs font-bold ${
                theme() === 'sepia'
                  ? 'bg-[#EFE6D5] border-[#D8CCBA]'
                  : theme() === 'midnight'
                  ? 'bg-neutral-800 border-neutral-700'
                  : 'bg-neutral-100 border-neutral-200'
              }`}
            >
              <button
                type="button"
                title="List View"
                class={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode() === 'list'
                    ? theme() === 'sepia'
                      ? 'bg-[#FAF6EC] text-[#29221E] shadow-xs'
                      : theme() === 'midnight'
                      ? 'bg-neutral-700 text-white shadow-xs'
                      : 'bg-white text-neutral-900 shadow-xs'
                    : 'opacity-65 hover:opacity-100'
                }`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button
                type="button"
                title="Study Flashcards"
                class={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode() === 'flashcards'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'opacity-65 hover:opacity-100'
                }`}
                onClick={() => {
                  setCardIndex(0);
                  setCardRevealStep(0);
                  setViewMode('flashcards');
                }}
              >
                <span>Study</span>
                <span class="text-[10px] px-1 rounded bg-black/20 font-mono">
                  {filteredItems().length}
                </span>
              </button>
            </div>

            <button
              type="button"
              title="Close Vault"
              class="p-2 rounded-lg hover:bg-neutral-500/10 text-neutral-500 transition-colors cursor-pointer"
              onClick={closeVault}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List Controls: Search & Filters (Shown in List View) */}
        <Show when={viewMode() === 'list'}>
          <div
            class={`p-3.5 border-b space-y-2.5 ${
              theme() === 'sepia'
                ? 'border-[#E2D6C0]'
                : theme() === 'midnight'
                ? 'border-neutral-800'
                : 'border-[#E8DFC9]'
            }`}
          >
            {/* Search Input */}
            <div class="relative">
              <Search
                size={14}
                class={`absolute left-3 top-3 ${
                  theme() === 'sepia'
                    ? 'text-[#8C7E70]'
                    : theme() === 'midnight'
                    ? 'text-neutral-500'
                    : 'text-neutral-400'
                }`}
              />
              <input
                type="text"
                placeholder="Search Urdu words or English definitions..."
                class={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                  theme() === 'sepia'
                    ? 'bg-[#F2EAE0] border-[#D8CCBA] text-[#29221E] placeholder:text-[#8C7E70] focus:ring-[#8C430B]'
                    : theme() === 'midnight'
                    ? 'bg-[#202229] border-neutral-700 text-[#ECE7DE] placeholder:text-neutral-500 focus:ring-amber-400'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:ring-neutral-800'
                }`}
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
              />
              <Show when={searchQuery()}>
                <button
                  type="button"
                  title="Clear search"
                  class="absolute right-2.5 top-2.5 opacity-50 hover:opacity-100 cursor-pointer"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              </Show>
            </div>

            {/* Filter Tabs Bar */}
            <div class="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 scrollbar-none">
              <button
                type="button"
                class={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterStatus() === 'all'
                    ? theme() === 'sepia'
                      ? 'bg-[#3A2D23] text-[#FAF6EC] shadow-xs'
                      : theme() === 'midnight'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'bg-neutral-900 text-white shadow-xs'
                    : theme() === 'sepia'
                    ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] text-[#4A3E35]'
                    : theme() === 'midnight'
                    ? 'bg-[#202229] hover:bg-[#2A2D37] text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                onClick={() => setFilterStatus('all')}
              >
                All ({vaultItems().length})
              </button>
              <button
                type="button"
                class={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  filterStatus() === 'starred'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : theme() === 'sepia'
                    ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] text-[#4A3E35]'
                    : theme() === 'midnight'
                    ? 'bg-[#202229] hover:bg-[#2A2D37] text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                onClick={() => setFilterStatus('starred')}
              >
                <Star size={11} class="fill-current" />
                <span>Starred</span>
              </button>
              <button
                type="button"
                class={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterStatus() === 'learning'
                    ? theme() === 'sepia'
                      ? 'bg-[#8C430B] text-white shadow-xs'
                      : 'bg-amber-600 text-white shadow-xs'
                    : theme() === 'sepia'
                    ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] text-[#4A3E35]'
                    : theme() === 'midnight'
                    ? 'bg-[#202229] hover:bg-[#2A2D37] text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                onClick={() => setFilterStatus('learning')}
              >
                Learning
              </button>
              <button
                type="button"
                class={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterStatus() === 'mastered'
                    ? theme() === 'sepia'
                      ? 'bg-[#1E4D2B] text-white shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs'
                    : theme() === 'sepia'
                    ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] text-[#4A3E35]'
                    : theme() === 'midnight'
                    ? 'bg-[#202229] hover:bg-[#2A2D37] text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                onClick={() => setFilterStatus('mastered')}
              >
                Mastered
              </button>
              <button
                type="button"
                class={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterStatus() === 2
                    ? theme() === 'sepia'
                      ? 'bg-[#1E4D2B] text-white shadow-xs'
                      : 'bg-emerald-700 text-white shadow-xs'
                    : theme() === 'sepia'
                    ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] text-[#4A3E35]'
                    : theme() === 'midnight'
                    ? 'bg-[#202229] hover:bg-[#2A2D37] text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                onClick={() => setFilterStatus(2)}
              >
                Tap 2
              </button>
              <button
                type="button"
                class={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterStatus() === 3
                    ? theme() === 'sepia'
                      ? 'bg-[#2B3A67] text-white shadow-xs'
                      : 'bg-indigo-700 text-white shadow-xs'
                    : theme() === 'sepia'
                    ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] text-[#4A3E35]'
                    : theme() === 'midnight'
                    ? 'bg-[#202229] hover:bg-[#2A2D37] text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                onClick={() => setFilterStatus(3)}
              >
                Tap 3
              </button>
            </div>

            {/* Utility Row: Sort, Story Filter & Density Toggle */}
            <div class="flex items-center justify-between gap-2 text-xs pt-1">
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                {/* Story filter dropdown if multiple stories exist */}
                <Show when={availableStories().length > 1}>
                  <select
                    class={`px-2 py-1 rounded-md border text-[11px] font-medium cursor-pointer max-w-[130px] truncate ${
                      theme() === 'sepia'
                        ? 'bg-[#F2EAE0] border-[#D8CCBA] text-[#29221E]'
                        : theme() === 'midnight'
                        ? 'bg-[#202229] border-neutral-700 text-[#ECE7DE]'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                    }`}
                    value={storyFilter()}
                    onChange={(e) => setStoryFilter(e.currentTarget.value)}
                  >
                    <option value="all">All Stories</option>
                    <For each={availableStories()}>
                      {(st) => <option value={st.slug}>{st.title}</option>}
                    </For>
                  </select>
                </Show>

                {/* Sort Order */}
                <select
                  class={`px-2 py-1 rounded-md border text-[11px] font-medium cursor-pointer ${
                    theme() === 'sepia'
                      ? 'bg-[#F2EAE0] border-[#D8CCBA] text-[#29221E]'
                      : theme() === 'midnight'
                      ? 'bg-[#202229] border-neutral-700 text-[#ECE7DE]'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                  }`}
                  value={sortOrder()}
                  onChange={(e) => setSortOrder(e.currentTarget.value as SortOrder)}
                >
                  <option value="newest">Newest First</option>
                  <option value="difficulty">Most Looked Up</option>
                  <option value="alphabetical">Urdu Alphabet</option>
                </select>
              </div>

              {/* Density Toggle: Compact vs Detailed */}
              <div
                class={`inline-flex rounded-md border p-0.5 text-[11px] shrink-0 font-medium ${
                  theme() === 'sepia'
                    ? 'bg-[#EFE6D5] border-[#D8CCBA]'
                    : theme() === 'midnight'
                    ? 'bg-neutral-800 border-neutral-700'
                    : 'bg-neutral-100 border-neutral-200'
                }`}
              >
                <button
                  type="button"
                  title="Detailed View"
                  class={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    densityMode() === 'detailed'
                      ? theme() === 'sepia'
                        ? 'bg-[#FAF6EC] text-[#29221E] font-bold shadow-xs'
                        : theme() === 'midnight'
                        ? 'bg-neutral-700 text-white font-bold shadow-xs'
                        : 'bg-white text-neutral-900 font-bold shadow-xs'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => setDensityMode('detailed')}
                >
                  Detailed
                </button>
                <button
                  type="button"
                  title="Compact View"
                  class={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    densityMode() === 'compact'
                      ? theme() === 'sepia'
                        ? 'bg-[#FAF6EC] text-[#29221E] font-bold shadow-xs'
                        : theme() === 'midnight'
                        ? 'bg-neutral-700 text-white font-bold shadow-xs'
                        : 'bg-white text-neutral-900 font-bold shadow-xs'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => setDensityMode('compact')}
                >
                  Compact
                </button>
              </div>
            </div>
          </div>
        </Show>

        {/* Content Area: LIST VIEW */}
        <Show when={viewMode() === 'list'}>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <Show
              when={filteredItems().length > 0}
              fallback={
                <div class="text-center py-16 text-neutral-400 space-y-2">
                  <Sparkles size={32} class="mx-auto opacity-40 text-neutral-500" />
                  <p class="text-sm font-bold">No words found</p>
                  <p class="text-xs opacity-75 max-w-xs mx-auto">
                    {searchQuery()
                      ? 'Try another search term or clear the filter.'
                      : 'Tap any word while reading to decode it and add it to your personal vault.'}
                  </p>
                </div>
              }
            >
              <For each={filteredItems()}>
                {(item) => {
                  const badge = getTierBadge(item.maxTapLevel);

                  return (
                    <Show
                      when={densityMode() === 'detailed'}
                      fallback={
                        /* COMPACT ROW VIEW */
                        <div
                          class={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            theme() === 'sepia'
                              ? 'bg-[#FAF5EB] border-[#D8CCBA] hover:border-[#B5A186]'
                              : theme() === 'midnight'
                              ? 'bg-[#1F2026] border-neutral-800 hover:border-neutral-700'
                              : 'bg-white border-[#E6DEC9] hover:border-[#D0C5AA]'
                          }`}
                        >
                          <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              title="Listen to pronunciation"
                              class={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                                theme() === 'sepia'
                                  ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] text-[#3A2D23]'
                                  : theme() === 'midnight'
                                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                              } ${playingAudioId() === item.id ? 'ring-2 ring-amber-400' : ''}`}
                              onClick={() => handlePlayAudio(item)}
                            >
                              <Volume2
                                size={14}
                                class={playingAudioId() === item.id ? 'animate-pulse text-amber-500' : ''}
                              />
                            </button>
                            <div dir="rtl" class="font-nastaliq text-xl leading-snug shrink-0">
                              {item.vocalizedSurface}
                            </div>
                            <div
                              class={`text-xs truncate ${
                                theme() === 'sepia'
                                  ? 'text-[#5A4D42]'
                                  : theme() === 'midnight'
                                  ? 'text-neutral-400'
                                  : 'text-neutral-600'
                              }`}
                            >
                              {item.englishGloss || item.urduExplanation || ''}
                            </div>
                          </div>

                          <div class="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title={item.isStarred ? 'Unstar word' : 'Star word'}
                              class={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                item.isStarred
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'opacity-40 hover:opacity-100'
                              }`}
                              onClick={() => toggleVaultItemStar(item.id)}
                            >
                              <Star size={14} class={item.isStarred ? 'fill-current' : ''} />
                            </button>

                            <button
                              type="button"
                              title="Remove word from vault"
                              class="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              onClick={() => deleteVaultItem(item.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      }
                    >
                      {/* DETAILED PEDAGOGICAL CARD VIEW */}
                      <div
                        class={`p-4 rounded-2xl border space-y-3 transition-all shadow-xs ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF5EB] border-[#D8CCBA] hover:border-[#B5A186]'
                            : theme() === 'midnight'
                            ? 'bg-[#1F2026] border-neutral-800 hover:border-neutral-700'
                            : 'bg-white border-[#E6DEC9] hover:border-[#D0C5AA]'
                        }`}
                      >
                        {/* Card Header: Actions, Headword & Audio */}
                        <div class="flex items-start justify-between gap-3">
                          {/* Audio button + Headword */}
                          <div class="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              title="Listen to word pronunciation"
                              class={`p-2 rounded-xl shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 ${
                                theme() === 'sepia'
                                  ? 'bg-[#3A2D23] text-[#FAF6EC]'
                                  : theme() === 'midnight'
                                  ? 'bg-white text-neutral-900'
                                  : 'bg-neutral-900 text-white'
                              } ${playingAudioId() === item.id ? 'ring-2 ring-amber-400' : ''}`}
                              onClick={() => handlePlayAudio(item)}
                            >
                              <Volume2
                                size={16}
                                class={playingAudioId() === item.id ? 'animate-pulse text-amber-300' : ''}
                              />
                            </button>

                            <div dir="rtl" class="text-right min-w-0">
                              <div class="font-nastaliq text-3xl sm:text-4xl leading-relaxed py-0.5">
                                {item.vocalizedSurface}
                              </div>
                            </div>
                          </div>

                          {/* Quick Controls: Star, Mastery Toggle & Trash */}
                          <div class="flex items-center gap-1 shrink-0">
                            {/* Mastery status toggle pill */}
                            <button
                              type="button"
                              title={`Status: ${item.masteryStatus || 'learning'} (Click to toggle)`}
                              class={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                                item.masteryStatus === 'mastered'
                                  ? theme() === 'sepia'
                                    ? 'bg-[#2D5A3C] text-[#FAF6EC] shadow-xs'
                                    : 'bg-emerald-600 text-white shadow-xs'
                                  : theme() === 'sepia'
                                  ? 'bg-[#F0E2CD] text-[#7C3E08] border border-[#DECCAE]'
                                  : theme() === 'midnight'
                                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                              onClick={() => toggleVaultItemMastery(item.id)}
                            >
                              {item.masteryStatus === 'mastered' ? '✓ Mastered' : 'Learning'}
                            </button>

                            {/* Star icon */}
                            <button
                              type="button"
                              title={item.isStarred ? 'Unstar word' : 'Star word'}
                              class={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                item.isStarred
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'opacity-40 hover:opacity-100'
                              }`}
                              onClick={() => toggleVaultItemStar(item.id)}
                            >
                              <Star size={16} class={item.isStarred ? 'fill-current' : ''} />
                            </button>

                            {/* Trash icon with instant delete */}
                            <button
                              type="button"
                              title="Remove word from vault"
                              class="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              onClick={() => deleteVaultItem(item.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Pedagogical Bridge: Spoken Urdu Synonyms (Tap 2) */}
                        <Show when={item.spokenSynonyms && item.spokenSynonyms.length > 0}>
                          <div
                            class={`p-3 rounded-xl border ${
                              theme() === 'sepia'
                                ? 'bg-[#EAE1D1] border-[#CFC0A7]'
                                : theme() === 'midnight'
                                ? 'bg-[#19261E] border-emerald-900/50'
                                : 'bg-emerald-50/80 border-emerald-200'
                            }`}
                          >
                            <div
                              class={`text-[10px] font-bold uppercase tracking-wider font-sans mb-1.5 ${
                                theme() === 'sepia'
                                  ? 'text-[#244E31]'
                                  : theme() === 'midnight'
                                  ? 'text-emerald-300'
                                  : 'text-emerald-800'
                              }`}
                            >
                              Everyday Spoken Bridge (بول چال):
                            </div>
                            <div dir="rtl" class="flex flex-wrap gap-1.5 text-right font-nastaliq text-base">
                              <For each={item.spokenSynonyms}>
                                {(syn) => (
                                  <span
                                    class={`px-2.5 py-0.5 rounded-md border shadow-2xs ${
                                      theme() === 'sepia'
                                        ? 'bg-[#FDFBF7] border-[#CFC0A7] text-[#1E3A25]'
                                        : theme() === 'midnight'
                                        ? 'bg-[#233529] border-emerald-800 text-emerald-200'
                                        : 'bg-white border-emerald-200 text-emerald-900'
                                    }`}
                                  >
                                    {syn}
                                  </span>
                                )}
                              </For>
                            </div>
                          </div>
                        </Show>

                        {/* Literary Sentence Context with Highlight */}
                        <Show when={item.sourceSentenceUrdu}>
                          <div
                            class={`p-2.5 rounded-xl border space-y-1.5 ${
                              theme() === 'sepia'
                                ? 'bg-[#F4ECE0] border-[#D8CCBA]'
                                : theme() === 'midnight'
                                ? 'bg-[#1E2027] border-neutral-800'
                                : 'bg-[#F9F7F3] border-[#E8DFC9]'
                            }`}
                          >
                            <div class="flex items-center justify-between text-[10px] opacity-75">
                              <span class="font-bold uppercase tracking-wider">In Literary Context:</span>
                              <Show when={item.storyTitleUrdu && item.storySlug}>
                                <button
                                  type="button"
                                  title="Jump to story in reader"
                                  class={`inline-flex items-center gap-1 font-bold hover:underline cursor-pointer ${
                                    theme() === 'sepia'
                                      ? 'text-[#8C430B] hover:text-[#5E2B06]'
                                      : theme() === 'midnight'
                                      ? 'text-amber-400 hover:text-amber-300'
                                      : 'text-[#8C430B] hover:text-[#5E2B06]'
                                  }`}
                                  onClick={() => handleJumpToStory(item.storySlug)}
                                >
                                  <span>📖 {item.storyTitleUrdu}</span>
                                  <ExternalLink size={10} />
                                </button>
                              </Show>
                            </div>
                            <div dir="rtl" class="font-nastaliq text-lg leading-relaxed text-right opacity-90">
                              {item.sourceSentenceUrdu}
                            </div>
                          </div>
                        </Show>

                        {/* English Gloss & Meaning */}
                        <Show when={item.englishGloss}>
                          <div
                            class={`text-xs sm:text-sm font-sans font-semibold ${
                              theme() === 'sepia'
                                ? 'text-[#29221E]'
                                : theme() === 'midnight'
                                ? 'text-[#ECE7DE]'
                                : 'text-neutral-900'
                            }`}
                          >
                            {item.englishGloss}
                          </div>
                        </Show>

                        {/* Urdu Explanation */}
                        <Show when={item.urduExplanation}>
                          <div
                            dir="rtl"
                            class={`text-xs font-nastaliq text-right leading-relaxed ${
                              theme() === 'sepia'
                                ? 'text-[#635446]'
                                : theme() === 'midnight'
                                ? 'text-neutral-400'
                                : 'text-neutral-600'
                            }`}
                          >
                            {item.urduExplanation}
                          </div>
                        </Show>

                        {/* Arabic Root & Cousins */}
                        <Show when={item.arabicRoot || (item.cousins && item.cousins.length > 0)}>
                          <div class="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-t border-black/5 dark:border-white/5 opacity-80">
                            <Show when={item.arabicRoot}>
                              <span
                                class={`font-bold ${
                                  theme() === 'sepia'
                                    ? 'text-[#1E3A5F]'
                                    : theme() === 'midnight'
                                    ? 'text-sky-300'
                                    : 'text-blue-700'
                                }`}
                              >
                                Root (مادہ): {item.arabicRoot}
                              </span>
                            </Show>
                            <Show when={item.cousins && item.cousins.length > 0}>
                              <span class="text-neutral-500">•</span>
                              <span class="text-neutral-500 font-sans">Word Cousins:</span>
                              <div dir="rtl" class="inline-flex gap-1 font-nastaliq">
                                <For each={item.cousins}>
                                  {(cousin) => <span class="opacity-90">{cousin}</span>}
                                </For>
                              </div>
                            </Show>
                          </div>
                        </Show>

                        {/* Card Footer: Tier badge & Lookups */}
                        <div class="flex items-center justify-between text-[10px] pt-1 opacity-70 border-t border-black/5 dark:border-white/5">
                          <span class={`px-2 py-0.5 rounded font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span class="font-mono">
                            {item.lookupCount} {item.lookupCount === 1 ? 'lookup' : 'lookups'}
                          </span>
                        </div>
                      </div>
                    </Show>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>

        {/* Content Area: 3-TAP FLASHCARD STUDY MODE */}
        <Show when={viewMode() === 'flashcards'}>
          <div class="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
            <Show
              when={filteredItems().length > 0}
              fallback={
                <div class="text-center py-20 text-neutral-400 space-y-2">
                  <Sparkles size={36} class="mx-auto opacity-40 text-neutral-500" />
                  <p class="text-base font-bold">No words to practice</p>
                  <p class="text-xs opacity-75 max-w-xs mx-auto">
                    Add words from the reader or switch back to the List view.
                  </p>
                  <button
                    type="button"
                    class="mt-3 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold shadow-xs cursor-pointer"
                    onClick={() => setViewMode('list')}
                  >
                    Back to List View
                  </button>
                </div>
              }
            >
              {/* Flashcard Header & Progress */}
              <div class="space-y-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold opacity-80 font-sans">
                    Card {cardIndex() + 1} of {filteredItems().length}
                  </span>
                  <div class="flex items-center gap-2">
                    <span
                      class={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        currentFlashcard()?.masteryStatus === 'mastered'
                          ? theme() === 'sepia'
                            ? 'bg-[#2D5A3C] text-[#FAF6EC]'
                            : 'bg-emerald-600 text-white'
                          : theme() === 'sepia'
                          ? 'bg-[#F0E2CD] text-[#7C3E08] border border-[#DECCAE]'
                          : theme() === 'midnight'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {currentFlashcard()?.masteryStatus === 'mastered' ? 'Mastered' : 'Learning'}
                    </span>
                    <button
                      type="button"
                      title="Reset practice deck"
                      class="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setCardIndex(0);
                        setCardRevealStep(0);
                      }}
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  class={`w-full h-1.5 rounded-full overflow-hidden ${
                    theme() === 'sepia'
                      ? 'bg-[#E5D8C3]'
                      : theme() === 'midnight'
                      ? 'bg-neutral-800'
                      : 'bg-neutral-200'
                  }`}
                >
                  <div
                    class="h-full bg-amber-500 transition-all duration-300"
                    style={{
                      width: `${((cardIndex() + 1) / filteredItems().length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* The Interactive 3-Tap Flashcard Face */}
              <div class="my-auto py-6">
                <div
                  class={`p-6 rounded-3xl border space-y-5 text-center shadow-md ${
                    theme() === 'sepia'
                      ? 'bg-[#FAF5EB] border-[#D8CCBA]'
                      : theme() === 'midnight'
                      ? 'bg-[#1F2026] border-neutral-700'
                      : 'bg-white border-[#E0D7C8]'
                  }`}
                >
                  {/* Headword Display */}
                  <div class="space-y-2">
                    <div
                      dir="rtl"
                      class="font-nastaliq text-5xl sm:text-6xl font-bold leading-relaxed py-2 select-text"
                    >
                      {cardRevealStep() >= 1
                        ? currentFlashcard()?.vocalizedSurface
                        : currentFlashcard()?.normalizedSurface}
                    </div>

                    <div class="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Listen to word pronunciation"
                        class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                          theme() === 'sepia'
                            ? 'bg-[#3A2D23] text-[#FAF6EC]'
                            : theme() === 'midnight'
                            ? 'bg-white text-neutral-900'
                            : 'bg-neutral-900 text-white'
                        }`}
                        onClick={() => currentFlashcard() && handlePlayAudio(currentFlashcard()!)}
                      >
                        <Volume2 size={14} />
                        <span>Listen</span>
                      </button>
                    </div>
                  </div>

                  {/* 3-Tap Progressive Clue Reveals */}
                  <div class="space-y-2 pt-2">
                    {/* Clue 1: Vowel Marks & Harakat */}
                    <button
                      type="button"
                      class={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        cardRevealStep() >= 1
                          ? theme() === 'sepia'
                            ? 'bg-[#3A2D23] text-[#FAF6EC] border-transparent shadow-xs'
                            : theme() === 'midnight'
                            ? 'bg-white text-neutral-900 border-transparent shadow-xs'
                            : 'bg-neutral-900 text-white border-transparent shadow-xs'
                          : theme() === 'sepia'
                          ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] border-[#D8CCBA] text-[#3A2D23]'
                          : theme() === 'midnight'
                          ? 'bg-[#252830] hover:bg-[#2D303A] border-neutral-700 text-neutral-200'
                          : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                      }`}
                      onClick={() => setCardRevealStep(Math.max(1, cardRevealStep()))}
                    >
                      {cardRevealStep() >= 1
                        ? `✓ Tap 1: Vowels Revealed (${currentFlashcard()?.vocalizedSurface})`
                        : 'Tap 1: Reveal Vowel Marks (اعراب)'}
                    </button>

                    {/* Clue 2: Spoken Bridge & Context */}
                    <Show when={cardRevealStep() >= 1}>
                      <button
                        type="button"
                        class={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          cardRevealStep() >= 2
                            ? theme() === 'sepia'
                              ? 'bg-[#1E4D2B] text-white border-transparent shadow-xs'
                              : 'bg-emerald-700 text-white border-transparent shadow-xs'
                            : theme() === 'sepia'
                            ? 'bg-[#DDE9DF] hover:bg-[#CFE2D2] border-[#B7D2BD] text-[#1E4D2B]'
                            : theme() === 'midnight'
                            ? 'bg-[#1E3326] hover:bg-[#254030] border-emerald-800 text-emerald-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                        }`}
                        onClick={() => setCardRevealStep(Math.max(2, cardRevealStep()))}
                      >
                        {cardRevealStep() >= 2
                          ? '✓ Tap 2: Spoken Bridge Revealed'
                          : 'Tap 2: Reveal Spoken Urdu Bridge'}
                      </button>

                      <Show when={cardRevealStep() >= 2 && currentFlashcard()?.spokenSynonyms?.length}>
                        <div
                          class={`p-3 rounded-xl border ${
                            theme() === 'sepia'
                              ? 'bg-[#EAE1D1] border-[#CFC0A7]'
                              : theme() === 'midnight'
                              ? 'bg-[#19261E] border-emerald-900/50'
                              : 'bg-emerald-50/80 border-emerald-200'
                          }`}
                        >
                          <div
                            class={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                              theme() === 'sepia'
                                ? 'text-[#244E31]'
                                : theme() === 'midnight'
                                ? 'text-emerald-300'
                                : 'text-emerald-800'
                            }`}
                          >
                            Colloquial Urdu:
                          </div>
                          <div
                            dir="rtl"
                            class={`font-nastaliq text-xl ${
                              theme() === 'sepia'
                                ? 'text-[#1E3A25]'
                                : theme() === 'midnight'
                                ? 'text-emerald-100'
                                : 'text-emerald-950'
                            }`}
                          >
                            {currentFlashcard()?.spokenSynonyms?.join('، ')}
                          </div>
                        </div>
                      </Show>
                    </Show>

                    {/* Clue 3: Full English Definition */}
                    <Show when={cardRevealStep() >= 2}>
                      <button
                        type="button"
                        class={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          cardRevealStep() >= 3
                            ? theme() === 'sepia'
                              ? 'bg-[#2B3A67] text-white border-transparent shadow-xs'
                              : 'bg-indigo-700 text-white border-transparent shadow-xs'
                            : theme() === 'sepia'
                            ? 'bg-[#E3E8F0] hover:bg-[#D5DEEA] border-[#C2D0E4] text-[#1E2E4A]'
                            : theme() === 'midnight'
                            ? 'bg-[#202738] hover:bg-[#283248] border-indigo-800 text-indigo-300'
                            : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-900'
                        }`}
                        onClick={() => setCardRevealStep(3)}
                      >
                        {cardRevealStep() >= 3
                          ? '✓ Tap 3: Full Meaning Revealed'
                          : 'Tap 3: Reveal English Definition'}
                      </button>

                      <Show when={cardRevealStep() >= 3}>
                        <div
                          class={`p-3.5 rounded-xl border space-y-1 ${
                            theme() === 'sepia'
                              ? 'bg-[#E8EEF5] border-[#BDCDE2]'
                              : theme() === 'midnight'
                              ? 'bg-[#181E2E] border-indigo-900/60'
                              : 'bg-indigo-50 border-indigo-200'
                          }`}
                        >
                          <div
                            class={`text-sm font-sans font-bold ${
                              theme() === 'sepia'
                                ? 'text-[#1E2E4A]'
                                : theme() === 'midnight'
                                ? 'text-indigo-100'
                                : 'text-indigo-950'
                            }`}
                          >
                            {currentFlashcard()?.englishGloss || 'No English gloss'}
                          </div>
                          <Show when={currentFlashcard()?.arabicRoot}>
                            <div
                              class={`text-xs font-bold ${
                                theme() === 'sepia'
                                  ? 'text-[#1E3A5F]'
                                  : theme() === 'midnight'
                                  ? 'text-indigo-300'
                                  : 'text-indigo-800'
                              }`}
                            >
                              Root: {currentFlashcard()?.arabicRoot}
                            </div>
                          </Show>
                        </div>
                      </Show>
                    </Show>
                  </div>
                </div>
              </div>

              {/* Flashcard Response Feedback Buttons */}
              <div class="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  class={`w-full py-3 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer active:scale-98 ${
                    theme() === 'sepia'
                      ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] border-[#D8CCBA] text-[#3A2D23]'
                      : theme() === 'midnight'
                      ? 'bg-[#252830] hover:bg-[#2D303A] border-neutral-700 text-neutral-200'
                      : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                  }`}
                  onClick={() => handleCardMastery(false)}
                >
                  Still Learning
                </button>
                <button
                  type="button"
                  class={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 ${
                    theme() === 'sepia'
                      ? 'bg-[#1E4D2B] hover:bg-[#163820] text-[#FAF6EC]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  onClick={() => handleCardMastery(true)}
                >
                  <Check size={16} />
                  <span>I Mastered This!</span>
                </button>
              </div>
            </Show>
          </div>
        </Show>

        {/* Floating Undo Toast (Appears right after deletion) */}
        <Show when={lastDeletedItem()}>
          <div
            class={`p-3 mx-4 mb-2 rounded-xl shadow-xl flex items-center justify-between gap-3 text-xs animate-slideUp ${
              theme() === 'sepia'
                ? 'bg-[#3A2D23] text-[#FAF6EC]'
                : theme() === 'midnight'
                ? 'bg-white text-neutral-900'
                : 'bg-neutral-900 text-white'
            }`}
          >
            <span class="truncate">
              Removed <strong>"{lastDeletedItem()?.vocalizedSurface}"</strong> from Vault
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 cursor-pointer shrink-0"
              onClick={undoDeleteVaultItem}
            >
              <Undo2 size={13} />
              <span>Undo</span>
            </button>
          </div>
        </Show>

        {/* Footer: Export to Anki & Clean-Up Tools */}
        <div
          class={`p-3.5 border-t flex items-center justify-between text-xs ${
            theme() === 'sepia'
              ? 'border-[#E2D6C0]'
              : theme() === 'midnight'
              ? 'border-neutral-800'
              : 'border-[#E8DFC9]'
          }`}
        >
          <a
            href="/api/telemetry/export"
            download="abjad-vocabulary-vault.csv"
            class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer ${
              theme() === 'sepia'
                ? 'bg-[#EFE6D5] hover:bg-[#E5DBC7] border-[#D8CCBA] text-[#3A2D23]'
                : theme() === 'midnight'
                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-800'
            }`}
          >
            <Download size={13} />
            <span>Export to Anki (.CSV)</span>
          </a>

          <div class="flex items-center gap-1.5">
            <Show
              when={showClearConfirm()}
              fallback={
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold transition-colors cursor-pointer"
                  onClick={() => setShowClearConfirm(true)}
                >
                  Clean-Up
                </button>
              }
            >
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                  onClick={() => {
                    clearVault('all');
                    setShowClearConfirm(false);
                  }}
                >
                  Clear All
                </button>
                <button
                  type="button"
                  class={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    theme() === 'sepia'
                      ? 'bg-[#EFE6D5] text-[#3A2D23]'
                      : theme() === 'midnight'
                      ? 'bg-neutral-800 text-neutral-200'
                      : 'bg-neutral-100 text-neutral-800'
                  }`}
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </Show>
          </div>
        </div>
      </aside>
    </Show>
  );
}
