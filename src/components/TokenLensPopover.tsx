import { createEffect, createSignal, onCleanup, Show, For } from 'solid-js';
import { computePosition, autoUpdate, offset, flip, shift } from '@floating-ui/dom';
import {
  activeTokenId,
  activeTargetEl,
  tapLevel,
  advanceTapLevel,
  closeTokenLens,
  tokensMap,
  analysesMap,
  playTTS,
  scriptTradition,
  theme,
} from '../store/readerStore';
import { Volume2, X, ChevronLeft, Sparkles, BookOpen } from 'lucide-solid';

export default function TokenLensPopover() {
  let popoverRef: HTMLDivElement | undefined;
  let cleanupAutoUpdate: (() => void) | null = null;

  const [isMobile, setIsMobile] = createSignal<boolean>(
    typeof window !== 'undefined' ? !window.matchMedia('(min-width: 768px)').matches : false
  );

  // Monitor viewport size for mobile bottom sheet vs desktop floating card
  createEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatches = () => setIsMobile(!mediaQuery.matches);
    mediaQuery.addEventListener('change', updateMatches);
    onCleanup(() => mediaQuery.removeEventListener('change', updateMatches));
  });

  const token = () => (activeTokenId() ? tokensMap()[activeTokenId()!] : null);
  const analysis = () => (activeTokenId() ? analysesMap()[activeTokenId()!] : null);

  // Clean up autoUpdate instance
  const teardownAutoUpdate = () => {
    if (cleanupAutoUpdate) {
      cleanupAutoUpdate();
      cleanupAutoUpdate = null;
    }
  };

  // Update floating positioning on desktop
  const updatePosition = () => {
    const target = activeTargetEl();
    if (!target || !popoverRef || isMobile()) return;

    computePosition(target, popoverRef, {
      placement: 'top',
      middleware: [offset(10), flip(), shift({ padding: 12 })],
    }).then(({ x, y }) => {
      if (popoverRef) {
        Object.assign(popoverRef.style, {
          left: `${x}px`,
          top: `${y}px`,
          position: 'absolute',
        });
      }
    });
  };

  // Re-anchor when activeTargetEl changes
  createEffect(() => {
    const target = activeTargetEl();
    teardownAutoUpdate();

    if (target && popoverRef && !isMobile()) {
      cleanupAutoUpdate = autoUpdate(target, popoverRef, updatePosition);
    }
  });

  onCleanup(() => {
    teardownAutoUpdate();
  });

  // On desktop, clicking the card body advances the hint.
  // On mobile, tapping or scrolling the card body must NEVER accidentally advance!
  const handleDesktopBodyClick = (e: MouseEvent) => {
    if (!isMobile()) {
      advanceTapLevel();
    }
  };

  return (
    <Show when={activeTokenId() && token() && analysis()}>
      {/* Mobile backdrop */}
      <Show when={isMobile()}>
        <div
          class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation();
            closeTokenLens();
          }}
        />
      </Show>

      {/* Popover Card / Mobile Bottom Sheet */}
      <div
        ref={popoverRef}
        onClick={handleDesktopBodyClick}
        class={`z-50 transition-all duration-200 ${
          isMobile()
            ? 'fixed bottom-0 inset-x-0 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-4 sm:p-5 border-t animate-slideUp'
            : 'w-[420px] rounded-xl shadow-2xl p-5 border cursor-pointer'
        } ${
          theme() === 'midnight'
            ? 'bg-[#1a1b1f] border-neutral-800 text-[#E7E2D8]'
            : theme() === 'sepia'
            ? 'bg-[#F9F4EB] border-[#E2D6C0] text-[#29221E]'
            : 'bg-[#FFFCF7] border-[#E8DFC9] text-[#1C1917]'
        }`}
        style={
          isMobile()
            ? { 'padding-bottom': 'max(1.5rem, env(safe-area-inset-bottom))' }
            : { 'min-width': '340px' }
        }
      >
        {/* Mobile drag handle */}
        <Show when={isMobile()}>
          <div class="w-12 h-1 bg-neutral-400/40 rounded-full mx-auto mb-3" />
        </Show>

        {/* Header: Tap Progress & Controls */}
        <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-black/10 dark:border-white/10 select-none">
          <div class="flex items-center gap-1.5 min-w-0">
            <span
              class={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                tapLevel() === 1
                  ? 'bg-amber-600 text-white'
                  : tapLevel() === 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              Clue {tapLevel()} of 3
            </span>
            <span class="text-[11px] text-neutral-500 font-medium truncate">
              {tapLevel() === 1 && 'Sound It Out (Zero Spoilers)'}
              {tapLevel() === 2 && 'Spoken Urdu Bridge (Rozmarra)'}
              {tapLevel() === 3 && 'English Meaning & Literary Nuance'}
            </span>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            {/* Audio button */}
            <button
              type="button"
              title="Listen to word pronunciation"
              class="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                playTTS(analysis()!.vocalizedForm);
              }}
            >
              <Volume2 size={16} />
            </button>

            {/* Close button */}
            <button
              type="button"
              title="Close (Esc)"
              class="p-1.5 rounded-lg hover:bg-neutral-500/15 text-neutral-500 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                closeTokenLens();
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* TAP 1: The Optical & Phonetic Unblocker */}
        <div class="space-y-3.5">
          {/* Large Vocalized Calligraphic Display */}
          <div class="text-center py-1 sm:py-2">
            <div
              dir="rtl"
              class={`text-3xl sm:text-5xl tracking-wide select-text font-normal leading-relaxed ${
                scriptTradition() === 'naskh' ? 'font-naskh' : 'font-nastaliq'
              }`}
            >
              {analysis()!.vocalizedForm}
            </div>
            <div class="text-[11px] text-neutral-400 mt-1 flex items-center justify-center gap-1 font-sans">
              <span>Full Aeraab (تلفظ مع حرکات)</span>
              <span>• Tap speaker to hear sound</span>
            </div>
          </div>

          {/* Structured Vowel Pills (RTL flex row) */}
          <Show when={analysis()!.phoneticBreakdownJson.length > 0}>
            <div>
              <div class="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center justify-between font-sans">
                <span>Vowel Marks (اعراب):</span>
                <span class="text-[10px] opacity-75 font-mono">Pesh, Zer, Zabar</span>
              </div>
              <div dir="rtl" class="flex flex-wrap gap-1 sm:gap-1.5 justify-start">
                <For each={analysis()!.phoneticBreakdownJson}>
                  {(pill) => (
                    <span class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-medium">
                      <span class="font-nastaliq text-sm sm:text-base leading-none">{pill.letters}</span>
                      <Show when={pill.vowelNameUrdu}>
                        <span class="text-[9px] sm:text-[10px] opacity-75 font-sans">[{pill.vowelNameUrdu}]</span>
                      </Show>
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Grapheme Decomposer Bar */}
          <Show when={analysis()!.graphemesJson.length > 0}>
            <div>
              <div class="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center justify-between font-sans">
                <span>Letter-by-Letter Breakdown (حروف):</span>
                <span class="text-[10px] opacity-75">Connects letters to sounds</span>
              </div>
              <div dir="rtl" class="flex flex-wrap gap-1 sm:gap-1.5 justify-start">
                <For each={analysis()!.graphemesJson}>
                  {(g) => (
                    <div
                      class={`flex flex-col items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border text-center ${
                        g.isAspiratedDigraph
                          ? 'bg-amber-600/15 border-amber-600/30 text-amber-800 dark:text-amber-200'
                          : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <span class="text-sm sm:text-base font-nastaliq leading-none">{g.raw}</span>
                      <span class="text-[8px] sm:text-[9px] text-neutral-500 mt-0.5 truncate max-w-[55px] font-nastaliq">{g.name}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>

        {/* TAP 2: Conversational Urdu Bridge & Morphology */}
        <Show when={tapLevel() >= 2}>
          <div class="mt-3.5 pt-3.5 border-t border-black/10 dark:border-white/10 space-y-3">
            {/* Rozmarra Everyday Urdu Synonyms */}
            <Show when={analysis()!.spokenUrduSynonymsJson.length > 0}>
              <div>
                <div class="text-[11px] font-semibold text-neutral-400 mb-1 flex items-center justify-between font-sans">
                  <span>Everyday Spoken Equivalent (Rozmarra):</span>
                  <span class="text-[10px] opacity-75">Words you say at home</span>
                </div>
                <div dir="rtl" class="flex flex-wrap gap-1.5 justify-start">
                  <For each={analysis()!.spokenUrduSynonymsJson}>
                    {(syn) => (
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm hover:bg-emerald-500/20 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTTS(syn);
                        }}
                      >
                        <span class="font-nastaliq text-sm sm:text-base">{syn}</span>
                        <Volume2 size={12} class="opacity-75" />
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Simple Conversational Urdu Explanation */}
            <div class="bg-black/5 dark:bg-white/5 p-2.5 rounded-lg">
              <div class="text-[11px] font-semibold text-neutral-400 mb-0.5 font-sans">
                Simple Explanation in Conversational Urdu:
              </div>
              <p dir="rtl" class="text-xs sm:text-sm font-nastaliq leading-relaxed text-neutral-800 dark:text-neutral-200 text-right">
                {analysis()!.urduSimpleExplanation}
              </p>
            </div>

            {/* Morphological Root Bridge & Cousins */}
            <Show when={analysis()!.arabicRoot || (analysis()!.familiarCousinsJson && analysis()!.familiarCousinsJson!.length > 0)}>
              <div>
                <div class="text-[11px] font-semibold text-neutral-400 mb-1 flex items-center justify-between font-sans">
                  <span>Word Root Family (مادہ): {analysis()!.arabicRoot ? `[${analysis()!.arabicRoot}]` : ''}</span>
                  <span class="text-[10px] opacity-75">Familiar cousins</span>
                </div>
                <div dir="rtl" class="flex flex-wrap gap-1.5 justify-start">
                  <Show when={analysis()!.familiarCousinsJson && analysis()!.familiarCousinsJson!.length > 0}>
                    <For each={analysis()!.familiarCousinsJson}>
                      {(cousin) => (
                        <span class="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-nastaliq">
                          {cousin}
                        </span>
                      )}
                    </For>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Persian Izafat Construction Breakdown */}
            <Show when={analysis()!.izafatBreakdownUrdu}>
              <div class="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                <div class="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-0.5 font-sans">
                  Persian Izafat Relationship (ترکیبِ اضافت):
                </div>
                <p dir="rtl" class="text-xs font-nastaliq leading-relaxed text-amber-900 dark:text-amber-200 text-right">
                  {analysis()!.izafatBreakdownUrdu}
                </p>
              </div>
            </Show>
          </div>
        </Show>

        {/* TAP 3: Full Literary & Philosophical Gloss */}
        <Show when={tapLevel() >= 3}>
          <div class="mt-3.5 pt-3.5 border-t border-black/10 dark:border-white/10 space-y-3">
            {/* English Contextual Gloss */}
            <div class="text-left">
              <div class="text-[11px] font-semibold text-neutral-400 mb-1 uppercase tracking-wider font-sans">
                English Contextual Meaning:
              </div>
              <p class="text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {analysis()!.englishContextualGloss}
              </p>
            </div>

            {/* Literary Nuance Note */}
            <Show when={analysis()!.literaryNuanceNote}>
              <div class="text-left bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg">
                <div class="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 mb-0.5 uppercase tracking-wider font-sans">
                  Literary & Cultural Context:
                </div>
                <p class="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                  {analysis()!.literaryNuanceNote}
                </p>
              </div>
            </Show>
          </div>
        </Show>

        {/* Footer Hint Button */}
        <div class="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
          <Show
            when={tapLevel() < 3}
            fallback={
              <div class="w-full text-center text-xs text-neutral-400 py-1 font-sans">
                ✓ All 3 clues revealed • Tap another word or press Space to continue
              </div>
            }
          >
            <button
              type="button"
              class="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
              onClick={(e) => {
                e.stopPropagation();
                advanceTapLevel();
              }}
            >
              <span>
                {tapLevel() === 1 && 'Next Clue: Show Spoken Bridge (Tap 2) →'}
                {tapLevel() === 2 && 'Next Clue: Show English Meaning (Tap 3) →'}
              </span>
            </button>
          </Show>
        </div>
      </div>
    </Show>
  );
}
