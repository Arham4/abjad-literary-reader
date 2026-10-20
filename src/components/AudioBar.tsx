import { Show } from 'solid-js';
import {
  paragraphs,
  currentSentenceIndex,
  isPlaying,
  playSentence,
  stopAudio,
  toggleAudio,
  theme,
} from '../store/readerStore';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-solid';

export default function AudioBar() {
  const currentSentence = () => {
    const pList = paragraphs();
    if (!pList.length || currentSentenceIndex() === null) return null;
    return pList[0].sentencesJson.find((s) => s.index === currentSentenceIndex());
  };

  const totalSentences = () => {
    const pList = paragraphs();
    if (!pList.length) return 0;
    return pList[0].sentencesJson.length;
  };

  const handleNext = () => {
    const nextIdx = (currentSentenceIndex() ?? -1) + 1;
    if (nextIdx < totalSentences()) {
      playSentence(nextIdx);
    }
  };

  const handlePrev = () => {
    const prevIdx = (currentSentenceIndex() ?? 1) - 1;
    if (prevIdx >= 0) {
      playSentence(prevIdx);
    }
  };

  return (
    <div
      class={`fixed bottom-0 inset-x-0 z-20 border-t backdrop-blur-md transition-all duration-200 shadow-lg ${
        theme() === 'midnight'
          ? 'bg-[#121316]/95 border-neutral-800 text-[#E7E2D8]'
          : theme() === 'sepia'
          ? 'bg-[#F2E9D8]/95 border-[#E2D6C0] text-[#29221E]'
          : 'bg-[#FAF6EE]/95 border-[#E8DFC9] text-[#1C1917]'
      }`}
    >
      <div class="max-w-4xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Active Sentence Text or Status */}
        <div class="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
          <div class="p-1.5 rounded-md bg-amber-500/10 text-amber-600 shrink-0">
            <Volume2 size={16} />
          </div>
          <div class="text-xs truncate text-right w-full sm:w-auto" dir="rtl">
            <Show
              when={currentSentence()}
              fallback={
                <span class="text-neutral-400 font-sans">
                  کسی جملے کا صوتی مطالعہ شروع کرنے کے لیے بٹن دبائیں۔ (Play narration)
                </span>
              }
            >
              <span class="font-nastaliq text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                {currentSentence()!.text}
              </span>
            </Show>
          </div>
        </div>

        {/* Audio Controls */}
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            title="Previous Sentence"
            class="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 disabled:opacity-30 cursor-pointer"
            disabled={currentSentenceIndex() === null || currentSentenceIndex() === 0}
            onClick={handlePrev}
          >
            <SkipBack size={16} />
          </button>

          <button
            type="button"
            title={isPlaying() ? 'Pause' : 'Play Narration'}
            class="px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            onClick={toggleAudio}
          >
            <Show when={isPlaying()} fallback={<Play size={14} />}>
              <Pause size={14} />
            </Show>
            <span>{isPlaying() ? 'وقفہ' : 'صوتی قرأت'}</span>
          </button>

          <button
            type="button"
            title="Next Sentence"
            class="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 disabled:opacity-30 cursor-pointer"
            disabled={
              currentSentenceIndex() === null ||
              currentSentenceIndex()! >= totalSentences() - 1
            }
            onClick={handleNext}
          >
            <SkipForward size={16} />
          </button>

          <Show when={currentSentenceIndex() !== null}>
            <span class="text-[11px] font-mono opacity-60 ml-2">
              {currentSentenceIndex()! + 1} / {totalSentences()}
            </span>
          </Show>
        </div>
      </div>
    </div>
  );
}
