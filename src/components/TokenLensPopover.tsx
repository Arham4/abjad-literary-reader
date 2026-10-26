import { createEffect, createSignal, onCleanup, Show, For } from 'solid-js';
import { computePosition, autoUpdate, offset, flip, shift } from '@floating-ui/dom';
import {
  activeTokenId,
  activeTargetEl,
  activePhrase,
  tapLevel,
  advanceTapLevel,
  closeTokenLens,
  tokensMap,
  analysesMap,
  playTTS,
  playWordAudio,
  scriptTradition,
  theme,
  isTokenInVault,
  toggleTokenInVault,
  togglePhraseInVault,
  vaultItems,
} from '../store/readerStore';
import { Volume2, X, Bookmark } from 'lucide-solid';

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

  const token = () => {
    if (activeTokenId()) return tokensMap()[activeTokenId()!];
    if (activePhrase()) {
      const p = activePhrase()!;
      return {
        id: 'phrase_active',
        paragraphId: '',
        tokenIndex: -1,
        surfaceForm: p.phraseText,
        normalizedForm: p.phraseText,
        sentenceIndex: 0,
        isWord: true,
        compoundGroupId: 'compound_phrase',
      };
    }
    return null;
  };

  const analysis = () => {
    if (activeTokenId()) return analysesMap()[activeTokenId()!];
    if (activePhrase()) return activePhrase();
    return null;
  };

  const isSavedToVault = () => {
    if (activeTokenId()) return isTokenInVault(activeTokenId()!);
    if (activePhrase()) {
      const p = activePhrase()!;
      return vaultItems().some(
        (item) => item.normalizedSurface === p.phraseText || item.vocalizedSurface === p.vocalizedForm
      );
    }
    return false;
  };

  const handleToggleVault = () => {
    if (activeTokenId()) {
      toggleTokenInVault(activeTokenId()!);
    } else if (activePhrase()) {
      togglePhraseInVault(activePhrase()!);
    }
  };

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
    if (isMobile() || !popoverRef) return;

    if (!target) {
      // Center popover for multi-word phrase decoding from text selection
      Object.assign(popoverRef.style, {
        left: '50%',
        top: '18%',
        transform: 'translateX(-50%)',
        position: 'fixed',
      });
      return;
    }

    // Reset inline transform from phrase mode if any
    popoverRef.style.transform = '';

    computePosition(target, popoverRef, {
      strategy: 'fixed',
      placement: 'top',
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: ['bottom'],
          padding: { top: 76, bottom: 70, left: 16, right: 16 },
        }),
        shift({
          mainAxis: true,
          crossAxis: true,
          padding: { top: 76, bottom: 70, left: 16, right: 16 },
        }),
      ],
    }).then(({ x, y }) => {
      if (popoverRef) {
        Object.assign(popoverRef.style, {
          left: `${Math.round(x)}px`,
          top: `${Math.round(y)}px`,
          position: 'fixed',
        });
      }
    });
  };

  // Auto-scroll and recompute position when tap level advances
  createEffect(() => {
    const level = tapLevel();
    if (popoverRef && (activeTokenId() || activePhrase())) {
      updatePosition();
      if (level > 1) {
        setTimeout(() => {
          if (popoverRef) {
            popoverRef.scrollTo({ top: popoverRef.scrollHeight, behavior: 'smooth' });
          }
        }, 60);
      }
    }
  });

  const [isWordAudioPlaying, setIsWordAudioPlaying] = createSignal(false);

  const wordToSpeak = () => {
    const a = analysis();
    const t = token();
    const voc = a?.vocalizedForm || '';
    const surf = t?.surfaceForm || t?.normalizedForm || '';

    // If vocalized form has Madda (آ or \u0653) but surface lacks it, prefer vocalizedForm so Madd is guaranteed
    if (voc && (voc.includes('آ') || voc.includes('\u0653')) && (!surf || (!surf.includes('آ') && !surf.includes('\u0653')))) {
      return voc;
    }
    return surf || voc;
  };

  const handleListenWord = async (e: MouseEvent) => {
    e.stopPropagation();
    if (isWordAudioPlaying()) return;
    setIsWordAudioPlaying(true);
    const handle = await playWordAudio(wordToSpeak());
    if (handle) {
      handle.onEnded(() => setIsWordAudioPlaying(false));
      handle.onError(() => setIsWordAudioPlaying(false));
    } else {
      setIsWordAudioPlaying(false);
    }
  };

  // Re-anchor when activeTargetEl changes or when activePhrase changes
  createEffect(() => {
    const target = activeTargetEl();
    const phrase = activePhrase();
    teardownAutoUpdate();

    if (phrase && popoverRef && !isMobile()) {
      updatePosition();
    } else if (target && popoverRef && !isMobile()) {
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
    <Show when={(activeTokenId() || activePhrase()) && token() && analysis()}>
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
        class={`z-50 transition-all duration-200 overflow-y-auto ${
          isMobile()
            ? 'fixed bottom-0 inset-x-0 rounded-t-3xl max-h-[85vh] shadow-2xl p-5 border-t-2 animate-slideUp'
            : 'w-[440px] rounded-2xl shadow-2xl p-5 sm:p-6 border cursor-pointer'
        } ${
          theme() === 'midnight'
            ? 'bg-[#18191E] border-neutral-700/80 text-[#ECE7DE]'
            : theme() === 'sepia'
            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#28201A] shadow-[0_20px_45px_-10px_rgba(45,30,15,0.22)]'
            : 'bg-white border-[#E2D8CC] text-[#1F1B17] shadow-[0_20px_45px_-10px_rgba(60,45,25,0.15)]'
        }`}
        style={
          isMobile()
            ? { 'padding-bottom': 'max(1.75rem, env(safe-area-inset-bottom))' }
            : {
                'min-width': '380px',
                'max-width': '460px',
                'max-height': 'calc(100vh - 150px)',
              }
        }
      >
        {/* Mobile drag handle */}
        <Show when={isMobile()}>
          <div class="w-12 h-1.5 bg-neutral-400/40 rounded-full mx-auto mb-3.5" />
        </Show>

        {/* Header: Tap Progress & Controls */}
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-black/10 dark:border-white/10 select-none">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class={`px-2.5 py-1 rounded-full text-xs font-serif font-bold text-white shrink-0 tracking-wide ${
                tapLevel() === 1
                  ? theme() === 'sepia'
                    ? 'bg-[#3A2D23] text-[#FAF6EC]'
                    : theme() === 'midnight'
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'bg-neutral-900 text-white'
                  : tapLevel() === 2
                  ? theme() === 'sepia'
                    ? 'bg-[#1E4D2B] text-white'
                    : 'bg-emerald-700 text-white'
                  : theme() === 'sepia'
                  ? 'bg-[#2B3A67] text-white'
                  : 'bg-indigo-700 text-white'
              }`}
            >
              Clue {tapLevel()} of 3
            </span>
            <span class="text-xs font-bold opacity-90 truncate font-sans">
              {tapLevel() === 1 && (activePhrase() || token()?.compoundGroupId ? '1: Sound Out Compound' : '1: Sound It Out (Zero Spoilers)')}
              {tapLevel() === 2 && '2: Everyday Spoken Urdu Bridge'}
              {tapLevel() === 3 && '3: English Meaning & Nuance'}
            </span>
            <Show when={token()?.compoundGroupId || activePhrase()}>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded font-sans uppercase tracking-wider bg-amber-500/20 text-amber-600 shrink-0">
                محاورہ / مرکب
              </span>
            </Show>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <Show when={activeTokenId() || activePhrase()}>
              <button
                type="button"
                title={isSavedToVault() ? 'Remove from Vocabulary Vault' : 'Save to Vocabulary Vault'}
                class={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSavedToVault()
                    ? theme() === 'sepia'
                      ? 'bg-[#F0E2CD] text-[#7C3E08] border border-[#DECCAE] shadow-xs'
                      : theme() === 'midnight'
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60 shadow-xs'
                      : 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                    : theme() === 'sepia'
                    ? 'hover:bg-[#EAE0CF] text-[#4A3E35] border border-[#D4C5AD]'
                    : theme() === 'midnight'
                    ? 'hover:bg-white/10 text-neutral-300 border border-neutral-700'
                    : 'hover:bg-neutral-100 text-neutral-700 border border-neutral-300'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVault();
                }}
              >
                <Bookmark
                  size={12}
                  class={isSavedToVault() ? 'fill-current text-amber-600' : ''}
                />
                <span>{isSavedToVault() ? 'Saved' : 'Save'}</span>
              </button>
            </Show>

            <button
              type="button"
              title="Close"
              class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors cursor-pointer shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                closeTokenLens();
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TAP 1: The Optical & Phonetic Unblocker */}
        <div class="space-y-4">
          {/* Large Vocalized Calligraphic Display */}
          <div class="text-center pt-3 pb-2 sm:pt-4 sm:pb-3">
            <div
              dir="rtl"
              class={`text-4xl sm:text-6xl tracking-wide select-text font-bold text-inherit pt-2 pb-5 sm:pb-7 mb-2 sm:mb-3 ${
                scriptTradition() === 'naskh' ? 'font-naskh' : 'font-nastaliq'
              }`}
              style={{
                'line-height': scriptTradition() === 'naskh' ? '1.9' : '2.3',
              }}
            >
              {analysis()!.vocalizedForm}
            </div>

            <div class="pt-1">
              <button
                type="button"
                title="Listen to word pronunciation"
                class={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer ${
                  theme() === 'sepia'
                    ? 'bg-[#3A2D23] hover:bg-[#2A1F17] text-[#FAF6EC]'
                    : theme() === 'midnight'
                    ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                } ${isWordAudioPlaying() ? 'ring-2 ring-amber-400 scale-102' : ''}`}
                onClick={handleListenWord}
              >
                <Volume2 size={15} class={isWordAudioPlaying() ? 'animate-pulse text-amber-300' : ''} />
                <span>{isWordAudioPlaying() ? 'Playing pronunciation...' : 'Listen to pronunciation'}</span>
              </button>
            </div>
          </div>

          {/* Structured Vowel Pills (RTL flex row) */}
          <Show when={analysis()!.phoneticBreakdownJson.length > 0}>
            <div class="space-y-1.5">
              <div class="text-xs font-bold opacity-85 flex items-center justify-between font-sans">
                <span>Vowel Marks:</span>
                <span class="text-[11px] font-normal opacity-70">Pesh (ُ), Zer (ِ), Zabar (َ)</span>
              </div>
              <div dir="rtl" class="flex flex-wrap gap-2 justify-start">
                <For each={analysis()!.phoneticBreakdownJson}>
                  {(pill) => (
                    <div
                      class={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-xs ${
                        theme() === 'sepia'
                          ? 'bg-[#F2EAE0] border-[#D9CEBA]'
                          : theme() === 'midnight'
                          ? 'bg-[#202229] border-neutral-700'
                          : 'bg-neutral-100 border-neutral-200'
                      }`}
                    >
                      <span class="font-nastaliq text-lg font-bold leading-normal py-0.5">
                        {pill.letters}
                      </span>
                      <Show when={pill.vowelNameUrdu}>
                        <span
                          class={`text-[11px] font-bold px-2 py-0.5 rounded-md font-sans ${
                            theme() === 'sepia'
                              ? 'bg-[#E5DAC6] text-[#2C221E]'
                              : theme() === 'midnight'
                              ? 'bg-neutral-700 text-neutral-100'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
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
              <div class="text-xs font-bold opacity-85 flex items-center justify-between font-sans">
                <span>Letter-by-Letter Breakdown:</span>
                <span class="text-[11px] font-normal opacity-70">Isolated alphabet blocks</span>
              </div>
              <div dir="rtl" class="flex flex-wrap gap-2 justify-start">
                <For each={analysis()!.graphemesJson}>
                  {(g) => (
                    <div
                      class={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-2 rounded-xl border shadow-xs ${
                        theme() === 'sepia'
                          ? g.isAspiratedDigraph
                            ? 'bg-[#E9DFCE] border-[#C8BCA4]'
                            : 'bg-[#F2EAE0] border-[#D9CEBA]'
                          : theme() === 'midnight'
                          ? g.isAspiratedDigraph
                            ? 'bg-neutral-700 border-neutral-600'
                            : 'bg-neutral-800 border-neutral-700'
                          : g.isAspiratedDigraph
                          ? 'bg-neutral-200 border-neutral-300'
                          : 'bg-neutral-100 border-neutral-200'
                      }`}
                    >
                      <span class="text-xl font-bold font-nastaliq leading-normal py-0.5">
                        {g.raw}
                      </span>
                      <div class="w-full h-px bg-black/10 dark:bg-white/10 my-1" />
                      <span class="text-xs font-bold opacity-75 font-nastaliq">
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
          <div class="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
            {/* Rozmarra Everyday Urdu Synonyms */}
            <Show when={analysis()!.spokenUrduSynonymsJson.length > 0}>
              <div class="space-y-1.5">
                <div class="text-xs font-bold opacity-85 flex items-center justify-between font-sans">
                  <span>Everyday Spoken Equivalent:</span>
                  <span class="text-[11px] font-normal opacity-70">Words you say at home</span>
                </div>
                <div dir="rtl" class="flex flex-wrap gap-2 justify-start">
                  <For each={analysis()!.spokenUrduSynonymsJson}>
                    {(syn) => (
                      <button
                        type="button"
                        class={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold cursor-pointer shadow-xs transition-colors ${
                          theme() === 'sepia'
                            ? 'bg-[#EBF3EC] border-[#A2CCA6] text-[#194324] hover:bg-[#DDEBDE]'
                            : theme() === 'midnight'
                            ? 'bg-emerald-950/50 border-emerald-700 text-emerald-200 hover:bg-emerald-900/60'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          playTTS(syn);
                        }}
                      >
                        <span class="font-nastaliq text-base leading-normal py-0.5">{syn}</span>
                        <Volume2 size={13} class="opacity-80" />
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Simple Conversational Urdu Explanation */}
            <div
              class={`p-3 rounded-xl border space-y-1 ${
                theme() === 'sepia'
                  ? 'bg-[#F2EAE0] border-[#D9CEBA]'
                  : theme() === 'midnight'
                  ? 'bg-[#202229] border-neutral-700'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div class="text-xs font-bold opacity-85 font-sans">
                Simple Explanation in Conversational Urdu:
              </div>
              <p dir="rtl" class="text-sm font-nastaliq font-bold leading-relaxed text-right">
                {analysis()!.urduSimpleExplanation}
              </p>
            </div>

            {/* Morphological Root Bridge & Cousins */}
            <Show when={analysis()!.arabicRoot || (analysis()!.familiarCousinsJson && analysis()!.familiarCousinsJson!.length > 0)}>
              <div class="space-y-1.5">
                <div class="text-xs font-bold opacity-85 flex items-center justify-between font-sans">
                  <span>Word Root Family: {analysis()!.arabicRoot ? `[${analysis()!.arabicRoot}]` : ''}</span>
                  <span class="text-[11px] font-normal opacity-70">Related cousin words</span>
                </div>
                <div dir="rtl" class="flex flex-wrap gap-2 justify-start">
                  <Show when={analysis()!.familiarCousinsJson && analysis()!.familiarCousinsJson!.length > 0}>
                    <For each={analysis()!.familiarCousinsJson}>
                      {(cousin) => (
                        <span
                          class={`px-2.5 py-1 rounded-lg border text-xs font-bold font-nastaliq shadow-xs ${
                            theme() === 'sepia'
                              ? 'bg-[#FDF3E7] border-[#E8C59A] text-[#8C4300]'
                              : theme() === 'midnight'
                              ? 'bg-blue-950/40 border-blue-800 text-blue-200'
                              : 'bg-blue-50 border-blue-200 text-blue-900'
                          }`}
                        >
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
              <div
                class={`p-3 rounded-xl border space-y-1 ${
                  theme() === 'sepia'
                    ? 'bg-[#F6EFF8] border-[#D5BFE2] text-[#4A245C]'
                    : theme() === 'midnight'
                    ? 'bg-purple-950/40 border-purple-800 text-purple-200'
                    : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}
              >
                <div class="text-xs font-bold font-sans">
                  Persian Izafat Relationship:
                </div>
                <p dir="rtl" class="text-xs font-nastaliq font-bold leading-relaxed text-right">
                  {analysis()!.izafatBreakdownUrdu}
                </p>
              </div>
            </Show>
          </div>
        </Show>

        {/* TAP 3: Full Literary & Philosophical Gloss */}
        <Show when={tapLevel() >= 3}>
          <div class="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
            {/* English Contextual Gloss */}
            <div
              class={`p-3.5 rounded-xl border space-y-1 text-left ${
                theme() === 'sepia'
                  ? 'bg-[#F1ECE3] border-[#CFC0AC]'
                  : theme() === 'midnight'
                  ? 'bg-[#1E222D] border-neutral-700'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div class="text-xs font-bold uppercase tracking-wider font-sans opacity-70">
                English Contextual Meaning:
              </div>
              <p class="text-base font-bold font-serif leading-snug">
                {analysis()!.englishContextualGloss}
              </p>
              <Show when={analysis()!.literaryNuanceNote}>
                <div class="w-full h-px bg-black/10 dark:bg-white/10 my-2" />
                <div class="text-xs font-bold uppercase tracking-wider font-sans opacity-70">
                  Literary & Cultural Context:
                </div>
                <p class="text-xs leading-relaxed font-sans mt-0.5 opacity-90">
                  {analysis()!.literaryNuanceNote}
                </p>
              </Show>
            </div>
          </div>
        </Show>

        {/* Footer Hint Button */}
        <div class="mt-4 pt-3.5 border-t border-black/10 dark:border-white/10">
          <Show
            when={tapLevel() < 3}
            fallback={
              <div class="w-full text-center text-xs font-bold opacity-60 py-1 font-sans">
                ✓ All 3 clues revealed • Tap another word or phrase to decode
              </div>
            }
          >
            <button
              type="button"
              class={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-[0.99] ${
                theme() === 'sepia'
                  ? 'bg-[#3A2D23] hover:bg-[#2A1F17] text-[#FAF6EC]'
                  : theme() === 'midnight'
                  ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
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