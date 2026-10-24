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
import { Volume2, X } from 'lucide-solid';

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
          class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
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
            ? 'fixed bottom-0 inset-x-0 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-5 border-t-2 animate-slideUp'
            : 'w-[440px] rounded-2xl shadow-2xl p-6 border-2 cursor-pointer'
        } ${
          theme() === 'midnight'
            ? 'bg-[#18191d] border-neutral-700 text-white'
            : 'bg-white border-neutral-300 text-neutral-900'
        }`}
        style={
          isMobile()
            ? { 'padding-bottom': 'max(1.75rem, env(safe-area-inset-bottom))' }
            : { 'min-width': '360px' }
        }
      >
        {/* Mobile drag handle */}
        <Show when={isMobile()}>
          <div class="w-12 h-1.5 bg-neutral-400/50 rounded-full mx-auto mb-3.5" />
        </Show>

        {/* Header: Tap Progress & Controls */}
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800 select-none">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class={`px-2.5 py-1 rounded-md text-xs font-bold text-white shrink-0 ${
                tapLevel() === 1
                  ? 'bg-neutral-900 dark:bg-white dark:text-neutral-900'
                  : tapLevel() === 2
                  ? 'bg-emerald-700'
                  : 'bg-indigo-700'
              }`}
            >
              Clue {tapLevel()} of 3
            </span>
            <span class="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
              {tapLevel() === 1 && '1: Sound It Out (Zero Spoilers)'}
              {tapLevel() === 2 && '2: Everyday Spoken Urdu Bridge'}
              {tapLevel() === 3 && '3: English Meaning & Nuance'}
            </span>
          </div>

          <button
            type="button"
            title="Close (Esc)"
            class="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              closeTokenLens();
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* TAP 1: The Optical & Phonetic Unblocker */}
        <div class="space-y-4">
          {/* Large Vocalized Calligraphic Display */}
          <div class="text-center py-2 space-y-2">
            <div
              dir="rtl"
              class={`text-4xl sm:text-6xl tracking-wide select-text font-bold leading-relaxed text-neutral-950 dark:text-white ${
                scriptTradition() === 'naskh' ? 'font-naskh' : 'font-nastaliq'
              }`}
            >
              {analysis()!.vocalizedForm}
            </div>

            <div>
              <button
                type="button"
                title="Listen to word pronunciation"
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold shadow-sm transition-all cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  playTTS(analysis()!.vocalizedForm);
                }}
              >
                <Volume2 size={15} class="text-white dark:text-neutral-900" />
                <span>Listen to pronunciation</span>
              </button>
            </div>
          </div>

          {/* Structured Vowel Pills (RTL flex row) */}
          <Show when={analysis()!.phoneticBreakdownJson.length > 0}>
            <div class="space-y-1.5">
              <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between font-sans">
                <span>Vowel Marks:</span>
                <span class="text-[11px] font-normal text-neutral-500">Pesh (ُ), Zer (ِ), Zabar (َ)</span>
              </div>
              <div dir="rtl" class="flex flex-wrap gap-2 justify-start">
                <For each={analysis()!.phoneticBreakdownJson}>
                  {(pill) => (
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 shadow-xs">
                      <span class="font-nastaliq text-lg font-bold text-neutral-950 dark:text-white leading-none">
                        {pill.letters}
                      </span>
                      <Show when={pill.vowelNameUrdu}>
                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-sans">
                          {pill.vowelNameUrdu}
                        </span>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Grapheme Decomposer Bar */}
          <Show when={analysis()!.graphemesJson.length > 0}>
            <div class="space-y-1.5">
              <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between font-sans">
                <span>Letter-by-Letter Breakdown:</span>
                <span class="text-[11px] font-normal text-neutral-500">Isolated alphabet blocks</span>
              </div>
              <div dir="rtl" class="flex flex-wrap gap-2 justify-start">
                <For each={analysis()!.graphemesJson}>
                  {(g) => (
                    <div
                      class={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-2 rounded-xl border-2 shadow-xs ${
                        g.isAspiratedDigraph
                          ? 'bg-neutral-200 dark:bg-neutral-700 border-neutral-400 dark:border-neutral-500'
                          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      <span class="text-xl font-bold font-nastaliq text-neutral-950 dark:text-white leading-tight">
                        {g.raw}
                      </span>
                      <div class="w-full h-px bg-neutral-300 dark:bg-neutral-700 my-1" />
                      <span class="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-nastaliq">
                        {g.name}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>

        {/* TAP 2: Conversational Urdu Bridge & Morphology */}
        <Show when={tapLevel() >= 2}>
          <div class="mt-4 pt-4 border-t-2 border-neutral-200 dark:border-neutral-800 space-y-3">
            {/* Rozmarra Everyday Urdu Synonyms */}
            <Show when={analysis()!.spokenUrduSynonymsJson.length > 0}>
              <div class="space-y-1.5">
                <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between font-sans">
                  <span>Everyday Spoken Equivalent:</span>
                  <span class="text-[11px] font-normal text-neutral-500">Words you say at home</span>
                </div>
                <div dir="rtl" class="flex flex-wrap gap-2 justify-start">
                  <For each={analysis()!.spokenUrduSynonymsJson}>
                    {(syn) => (
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 cursor-pointer shadow-xs transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTTS(syn);
                        }}
                      >
                        <span class="font-nastaliq text-base">{syn}</span>
                        <Volume2 size={13} class="opacity-80" />
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Simple Conversational Urdu Explanation */}
            <div class="bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 p-3 rounded-xl space-y-1">
              <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-sans">
                Simple Explanation in Conversational Urdu:
              </div>
              <p dir="rtl" class="text-sm font-nastaliq font-bold leading-relaxed text-neutral-950 dark:text-neutral-50 text-right">
                {analysis()!.urduSimpleExplanation}
              </p>
            </div>

            {/* Morphological Root Bridge & Cousins */}
            <Show when={analysis()!.arabicRoot || (analysis()!.familiarCousinsJson && analysis()!.familiarCousinsJson!.length > 0)}>
              <div class="space-y-1.5">
                <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between font-sans">
                  <span>Word Root Family: {analysis()!.arabicRoot ? `[${analysis()!.arabicRoot}]` : ''}</span>
                  <span class="text-[11px] font-normal text-neutral-500">Related cousin words</span>
                </div>
                <div dir="rtl" class="flex flex-wrap gap-2 justify-start">
                  <Show when={analysis()!.familiarCousinsJson && analysis()!.familiarCousinsJson!.length > 0}>
                    <For each={analysis()!.familiarCousinsJson}>
                      {(cousin) => (
                        <span class="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-100 text-xs font-bold font-nastaliq shadow-xs">
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
              <div class="bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-700 p-3 rounded-xl space-y-1">
                <div class="text-xs font-bold text-purple-950 dark:text-purple-200 font-sans">
                  Persian Izafat Relationship:
                </div>
                <p dir="rtl" class="text-xs font-nastaliq font-bold leading-relaxed text-purple-950 dark:text-purple-100 text-right">
                  {analysis()!.izafatBreakdownUrdu}
                </p>
              </div>
            </Show>
          </div>
        </Show>

        {/* TAP 3: Full Literary & Philosophical Gloss */}
        <Show when={tapLevel() >= 3}>
          <div class="mt-4 pt-4 border-t-2 border-neutral-200 dark:border-neutral-800 space-y-3">
            {/* English Contextual Gloss */}
            <div class="text-left bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-700 p-3.5 rounded-xl space-y-1">
              <div class="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider font-sans">
                English Contextual Meaning:
              </div>
              <p class="text-base font-bold text-neutral-950 dark:text-white font-sans">
                {analysis()!.englishContextualGloss}
              </p>
              <Show when={analysis()!.literaryNuanceNote}>
                <div class="w-full h-px bg-indigo-200 dark:bg-indigo-800 my-2" />
                <div class="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider font-sans">
                  Literary & Cultural Context:
                </div>
                <p class="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans mt-0.5">
                  {analysis()!.literaryNuanceNote}
                </p>
              </Show>
            </div>
          </div>
        </Show>

        {/* Footer Hint Button */}
        <div class="mt-4 pt-3.5 border-t border-neutral-200 dark:border-neutral-800">
          <Show
            when={tapLevel() < 3}
            fallback={
              <div class="w-full text-center text-xs font-bold text-neutral-500 py-1 font-sans">
                ✓ All 3 clues revealed • Tap another word or press Space to continue
              </div>
            }
          >
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-[0.99]"
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