import { Show } from 'solid-js';
import {
  currentSentence,
  allStorySentences,
  isPlaying,
  playSentence,
  toggleAudio,
  theme,
  openVoiceSettings,
  ttsVoice,
  selectedText,
  isSelectionPlaying,
  playSelectedText,
  stopSelectionAudio,
} from '../store/readerStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, Mic } from 'lucide-solid';

export default function AudioBar() {
  const activeS = () => currentSentence();
  const sentencesList = () => allStorySentences();

  const handleNext = () => {
    const list = sentencesList();
    if (!list.length) return;
    const currentIdx = activeS() ? activeS()!.globalIndex : -1;
    if (currentIdx + 1 < list.length) {
      playSentence(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    const list = sentencesList();
    if (!list.length) return;
    const currentIdx = activeS() ? activeS()!.globalIndex : 1;
    if (currentIdx - 1 >= 0) {
      playSentence(currentIdx - 1);
    }
  };

  return (
    <div
      class={`fixed bottom-0 inset-x-0 z-20 border-t backdrop-blur-md transition-all duration-200 shadow-lg ${
        theme() === 'midnight'
          ? 'bg-[#121316]/95 border-neutral-800 text-[#E7E2D8]'
          : theme() === 'sepia'
          ? 'bg-[#F4EFE6]/95 border-[#D8CCBA] text-[#28201A]'
          : 'bg-[#FAF6EE]/95 border-[#E8DFC9] text-[#1C1917]'
      }`}
      style={{ 'padding-bottom': 'max(0.4rem, env(safe-area-inset-bottom))' }}
    >
      <div class="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Active Sentence Text or Status / Selected Text */}
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div
            class={`p-1 sm:p-1.5 rounded-md shrink-0 shadow-xs ${
              theme() === 'sepia'
                ? 'bg-[#3A2D23] text-[#FAF6EC]'
                : theme() === 'midnight'
                ? 'bg-white text-neutral-900'
                : 'bg-neutral-900 text-white'
            }`}
          >
            <Volume2 size={15} />
          </div>
          <div class="text-xs truncate text-right min-w-0 flex-1" dir="rtl">
            <Show
              when={selectedText()}
              fallback={
                <Show
                  when={activeS()}
                  fallback={
                    <span class="opacity-60 font-sans text-[11px] sm:text-xs">
                      Tap Play to listen to sentence narration
                    </span>
                  }
                >
                  <span class="font-nastaliq text-xs sm:text-sm font-bold leading-relaxed">
                    {activeS()!.text}
                  </span>
                </Show>
              }
            >
              <div class="flex items-center gap-1.5 justify-end">
                <span class="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded tracking-wide uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                  سُنو Selection
                </span>
                <span class="font-nastaliq text-xs sm:text-sm font-bold leading-relaxed truncate">
                  {selectedText()}
                </span>
              </div>
            </Show>
          </div>
        </div>

        {/* Audio Controls (compact row on all viewports) */}
        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Selection Play Button when text is selected */}
          <Show when={selectedText()}>
            <button
              type="button"
              title={isSelectionPlaying() ? 'Pause Selection' : 'Play Selection (سُنو)'}
              class={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95 ${
                theme() === 'sepia'
                  ? 'bg-[#8C5D35] hover:bg-[#724B2B] text-white'
                  : theme() === 'midnight'
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-900'
                  : 'bg-[#8C5D35] hover:bg-[#724B2B] text-white'
              }`}
              onClick={() => {
                if (isSelectionPlaying()) {
                  stopSelectionAudio();
                } else {
                  playSelectedText();
                }
              }}
            >
              <Show when={isSelectionPlaying()} fallback={<Play size={11} fill="currentColor" />}>
                <Pause size={11} />
              </Show>
              <span class="font-nastaliq text-xs font-bold leading-none inline" dir="rtl">سُنو</span>
              <span class="hidden md:inline text-[10px] font-sans">
                {isSelectionPlaying() ? 'Pause' : 'Selection'}
              </span>
            </button>
          </Show>

          <button
            type="button"
            title="Previous Sentence"
            class="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 disabled:opacity-20 cursor-pointer"
            disabled={!activeS() || activeS()!.globalIndex === 0}
            onClick={handlePrev}
          >
            <SkipBack size={14} />
          </button>

          <button
            type="button"
            title={isPlaying() ? 'Pause Narration' : 'Play Sentence Narration'}
            class={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
              theme() === 'sepia'
                ? 'bg-[#3A2D23] hover:bg-[#2A1F17] text-[#FAF6EC]'
                : theme() === 'midnight'
                ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
            onClick={toggleAudio}
          >
            <Show when={isPlaying()} fallback={<Play size={13} />}>
              <Pause size={13} />
            </Show>
            <span>{isPlaying() ? 'Pause' : 'Play Narration'}</span>
          </button>

          <button
            type="button"
            title="Next Sentence"
            class="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 disabled:opacity-20 cursor-pointer"
            disabled={!activeS() || activeS()!.globalIndex >= sentencesList().length - 1}
            onClick={handleNext}
          >
            <SkipForward size={14} />
          </button>

          <div class="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5 shrink-0" />

          {/* Voice Selector Quick Pill */}
          <button
            type="button"
            title="Urdu Voice & Narrator Settings (آواز اور راوی)"
            onClick={openVoiceSettings}
            class={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              theme() === 'sepia'
                ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border-[#D8CCBA] text-[#28201A]'
                : theme() === 'midnight'
                ? 'bg-[#1E2026] hover:bg-[#282B33] border-neutral-700 text-[#E7E2D8]'
                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-800'
            }`}
          >
            <Mic size={12} class="shrink-0" />
            <span class="font-nastaliq text-xs font-bold leading-none inline" dir="rtl">
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

          <Show when={activeS() && sentencesList().length > 0}>
            <span class="text-[10px] sm:text-[11px] font-mono opacity-60 ml-1">
              {activeS()!.globalIndex + 1}/{sentencesList().length}
            </span>
          </Show>
        </div>
      </div>
    </div>
  );
}
