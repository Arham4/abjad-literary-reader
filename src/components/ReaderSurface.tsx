import { For, Show, onCleanup } from 'solid-js';
import {
  paragraphs,
  tokensMap,
  analysesMap,
  activeTokenId,
  openTokenLens,
  advanceTapLevel,
  scriptTradition,
  fontSizePx,
  showIzafatHighlights,
  currentSentence,
  isPlaying,
  theme,
  pagination,
  currentPage,
  totalPages,
  totalParagraphs,
  nextPage,
  prevPage,
  goToPage,
} from '../store/readerStore';
import { ChevronRight, ChevronLeft } from 'lucide-solid';

export default function ReaderSurface() {
  // Delegated Click Handler on .abjad-reader-surface (Zero per-span listeners!)
  const handleSurfaceClick = (e: MouseEvent) => {
    // If user has highlighted a text selection, do not open single word lens
    if (typeof window !== 'undefined') {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 1) {
        return;
      }
    }

    const target = (e.target as HTMLElement).closest<HTMLElement>('.abjad-word-token');
    if (!target) return;
    const tokenId = target.dataset.tokenId;
    if (!tokenId) return;

    if (activeTokenId() === tokenId) {
      advanceTapLevel(); // 1 -> 2 -> 3 (never toggles closed on repeat click)
    } else {
      openTokenLens(tokenId, target);
    }
  };

  // Delegated Keydown Handler on .abjad-reader-surface
  const handleSurfaceKeyDown = (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const target = (e.target as HTMLElement).closest<HTMLElement>('.abjad-word-token');
    if (!target) return;

    e.preventDefault(); // Prevents Space from jump-scrolling the viewport
    const tokenId = target.dataset.tokenId;
    if (!tokenId) return;

    if (activeTokenId() === tokenId) {
      advanceTapLevel();
    } else {
      openTokenLens(tokenId, target);
    }
  };

  return (
    <div
      class={`abjad-reader-surface w-full ${
        scriptTradition() === 'naskh' ? 'font-naskh' : 'font-nastaliq'
      }`}
      style={{
        'font-size': `${fontSizePx()}px`,
      }}
      onClick={handleSurfaceClick}
      onKeyDown={handleSurfaceKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Urdu Literary Text Reader Surface"
    >
      <For each={paragraphs().filter((p) => p.paragraphIndex >= 0)}>
        {(paragraph) => {
          // Collect all tokens for this paragraph
          const pTokens = Object.values(tokensMap()).filter(
            (t) => t.paragraphId === paragraph.id
          ).sort((a, b) => a.tokenIndex - b.tokenIndex);

          // Group tokens into sentences or render with izafat group markers
          return (
            <div class="abjad-paragraph-block relative">
              <For each={pTokens}>
                {(token) => {
                  const isCurrentSentence = () => {
                    const activeS = currentSentence();
                    if (!activeS || !isPlaying()) return false;
                    return activeS.paragraphId === paragraph.id && token.sentenceIndex === activeS.sentenceIndex;
                  };

                  if (!token.isWord) {
                    // Non-word punctuation or whitespace
                    return (
                      <span
                        class={isCurrentSentence() ? 'sentence-token-active' : ''}
                        data-active-sentence={isCurrentSentence() ? 'true' : undefined}
                      >
                        {token.surfaceForm}
                      </span>
                    );
                  }

                  const isIzafat = () => showIzafatHighlights() && Boolean(token.izafatGroupId);
                  const isCompound = () => Boolean(token.compoundGroupId);
                  const isCompoundActive = () => {
                    if (!token.compoundGroupId) return false;
                    const activeId = activeTokenId();
                    if (!activeId) return false;
                    const activeTok = tokensMap()[activeId];
                    return Boolean(
                      activeTok &&
                      activeTok.paragraphId === token.paragraphId &&
                      activeTok.compoundGroupId &&
                      activeTok.compoundGroupId === token.compoundGroupId
                    );
                  };
                  const isIzafatActive = () => {
                    if (!token.izafatGroupId) return false;
                    const activeId = activeTokenId();
                    if (!activeId) return false;
                    const activeTok = tokensMap()[activeId];
                    return Boolean(
                      activeTok &&
                      activeTok.paragraphId === token.paragraphId &&
                      activeTok.izafatGroupId &&
                      activeTok.izafatGroupId === token.izafatGroupId
                    );
                  };

                  const tokenWordDisplay = () => {
                    const activeId = activeTokenId();
                    if (!activeId) return token.surfaceForm;
                    const activeTok = tokensMap()[activeId];
                    const activeAna = analysesMap()[activeId];

                    // 1. Part of active compound: resolve only this token's constituent word
                    if (
                      token.compoundGroupId &&
                      activeTok?.compoundGroupId === token.compoundGroupId &&
                      activeTok?.paragraphId === token.paragraphId &&
                      activeAna?.vocalizedForm
                    ) {
                      const cTokens = pTokens.filter(
                        (t) => t.isWord && t.compoundGroupId && t.compoundGroupId === token.compoundGroupId
                      );
                      const parts = activeAna.vocalizedForm.trim().split(/\s+/);
                      const idx = cTokens.findIndex((t) => t.id === token.id);
                      if (idx >= 0 && idx < parts.length) {
                        return parts[idx];
                      }
                    }

                    // 1b. Part of active izafat: resolve only this token's constituent word
                    if (
                      token.izafatGroupId &&
                      activeTok?.izafatGroupId === token.izafatGroupId &&
                      activeTok?.paragraphId === token.paragraphId &&
                      activeAna?.vocalizedForm
                    ) {
                      const izTokens = pTokens.filter(
                        (t) => t.isWord && t.izafatGroupId && t.izafatGroupId === token.izafatGroupId
                      );
                      const parts = activeAna.vocalizedForm.trim().split(/\s+/);
                      const idx = izTokens.findIndex((t) => t.id === token.id);
                      if (idx >= 0 && idx < parts.length) {
                        return parts[idx];
                      }
                    }

                    // 2. Single word token (non-compound)
                    if (activeId === token.id && analysesMap()[token.id]?.vocalizedForm) {
                      const voc = analysesMap()[token.id]!.vocalizedForm;
                      if (!voc.includes(' ')) return voc;
                    }

                    return token.surfaceForm;
                  };

                  return (
                    <span
                      class={`${isIzafat() ? 'izafat-group' : ''} ${
                        isCompound() ? 'compound-group' : ''
                      } ${isCurrentSentence() ? 'sentence-token-active' : ''}`}
                      data-compound-group={token.compoundGroupId || undefined}
                      data-compound-active={isCompoundActive() ? 'true' : undefined}
                      data-izafat-group={token.izafatGroupId || undefined}
                      data-izafat-active={isIzafatActive() ? 'true' : undefined}
                      data-active-sentence={isCurrentSentence() ? 'true' : undefined}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        class="abjad-word-token"
                        data-token-id={token.id}
                        data-active={activeTokenId() === token.id ? 'true' : undefined}
                      >
                        {tokenWordDisplay()}
                      </span>
                    </span>
                  );
                }}
              </For>
            </div>
          );
        }}
      </For>

      {/* Literary Reader Pagination Bar */}
      <Show when={totalPages() > 1}>
        <nav
          aria-label="Story Pagination"
          class={`abjad-pagination-bar mt-10 mb-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors select-none ${
            theme() === 'sepia'
              ? 'border-[#D8CCBA]/60 text-[#3A2D23]'
              : theme() === 'midnight'
              ? 'border-neutral-800 text-neutral-300'
              : 'border-neutral-200 text-neutral-700'
          }`}
        >
          {/* Previous Page */}
          <button
            type="button"
            onClick={prevPage}
            disabled={!pagination().hasPrevPage}
            class={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed ${
              theme() === 'sepia'
                ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border border-[#D8CCBA] text-[#28201A] shadow-xs'
                : theme() === 'midnight'
                ? 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-100 shadow-xs'
                : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 shadow-xs'
            }`}
          >
            <ChevronLeft class="w-4 h-4" />
            <span class="font-nastaliq text-base">پچھلا صفحہ</span>
            <span class="text-xs opacity-60 font-sans hidden sm:inline">(Previous Page)</span>
          </button>

          {/* Page Indicator & Quick Jumper */}
          <div class="flex items-center gap-2 text-xs sm:text-sm font-serif">
            <span class="font-nastaliq text-base sm:text-lg">
              صفحہ {currentPage()} از {totalPages()}
            </span>
            <span class="opacity-40">·</span>
            <span class="font-sans text-xs opacity-75 hidden xs:inline">
              Page {currentPage()} of {totalPages()} ({totalParagraphs()} paragraphs)
            </span>
            <select
              aria-label="Jump to page"
              value={currentPage()}
              onChange={(e) => goToPage(parseInt(e.currentTarget.value, 10))}
              class={`text-xs py-1 px-2.5 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                theme() === 'sepia'
                  ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#28201A]'
                  : theme() === 'midnight'
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-200'
                  : 'bg-white border-neutral-200 text-neutral-800'
              }`}
            >
              <For each={Array.from({ length: totalPages() }, (_, i) => i + 1)}>
                {(pNum) => (
                  <option value={pNum}>
                    Page {pNum} (صفحہ {pNum})
                  </option>
                )}
              </For>
            </select>
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={nextPage}
            disabled={!pagination().hasNextPage}
            class={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed ${
              theme() === 'sepia'
                ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border border-[#D8CCBA] text-[#28201A] shadow-xs'
                : theme() === 'midnight'
                ? 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-100 shadow-xs'
                : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 shadow-xs'
            }`}
          >
            <span class="font-nastaliq text-base">اگلا صفحہ</span>
            <span class="text-xs opacity-60 font-sans hidden sm:inline">(Next Page)</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </nav>
      </Show>
    </div>
  );
}
