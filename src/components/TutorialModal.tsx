import { createSignal, Show, For } from 'solid-js';
import { isTutorialOpen, closeTutorial, playTTS, theme } from '../store/readerStore';
import {
  X,
  Sparkles,
  Volume2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Ear,
  Eye,
  Languages,
} from 'lucide-solid';

export default function TutorialModal() {
  const [currentSlide, setCurrentSlide] = createSignal(1);
  const [demoTapLevel, setDemoTapLevel] = createSignal<1 | 2 | 3>(1);

  const totalSlides = 4;

  const nextSlide = () => {
    if (currentSlide() < totalSlides) {
      setCurrentSlide(currentSlide() + 1);
    } else {
      closeTutorial();
    }
  };

  const prevSlide = () => {
    if (currentSlide() > 1) {
      setCurrentSlide(currentSlide() - 1);
    }
  };

  return (
    <Show when={isTutorialOpen()}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        onClick={closeTutorial}
      >
        {/* Modal Window */}
        <div
          class={`relative w-full max-w-xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
            theme() === 'midnight'
              ? 'bg-[#18191d] border-neutral-800 text-[#E7E2D8]'
              : theme() === 'sepia'
              ? 'bg-[#FAF4E8] border-[#E2D6C0] text-[#29221E]'
              : 'bg-[#FFFCF7] border-[#E8DFC9] text-[#1C1917]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-amber-600 text-white shadow-xs">
                <HelpCircle size={16} />
              </span>
              <span class="font-bold text-sm tracking-tight">How Abjad Reader Works</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-neutral-400 font-mono">
                {currentSlide()} / {totalSlides}
              </span>
              <button
                type="button"
                title="Close Tutorial"
                class="p-1.5 rounded-lg hover:bg-neutral-500/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                onClick={closeTutorial}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Slide Content (Scrollable) */}
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm leading-relaxed">
            {/* SLIDE 1: The Mission */}
            <Show when={currentSlide() === 1}>
              <div class="space-y-4">
                <div class="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto">
                  <Ear size={26} />
                </div>
                <div class="text-center space-y-1.5">
                  <h3 class="text-lg sm:text-xl font-bold tracking-tight">
                    You already know the spoken language.
                  </h3>
                  <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    The written script is the only hurdle between you and Urdu literature.
                  </p>
                </div>

                <div class="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2 text-xs">
                  <div class="flex items-start gap-2.5">
                    <span class="text-amber-600 font-bold text-base leading-none mt-0.5">💡</span>
                    <div>
                      <p class="font-semibold text-neutral-800 dark:text-neutral-200">
                        Does your brain freeze when looking at Nastaliq script?
                      </p>
                      <p class="text-neutral-600 dark:text-neutral-400 mt-1">
                        That is completely normal. In conversational speech, you already recognize words like{' '}
                        <span class="font-semibold italic">hukūmat</span>,{' '}
                        <span class="font-semibold italic">mukhtasar</span>, or{' '}
                        <span class="font-semibold italic">tabādalah</span>. But in dense cursive calligraphy, it's hard to tell where one letter ends and another begins.
                      </p>
                    </div>
                  </div>
                </div>

                <p class="text-xs text-neutral-600 dark:text-neutral-400 text-center">
                  Abjad Reader is designed to train your eyes to decode the letters and connect them directly to your spoken vocabulary.
                </p>
              </div>
            </Show>

            {/* SLIDE 2: The 3-Tap Rule */}
            <Show when={currentSlide() === 2}>
              <div class="space-y-4">
                <div class="text-center space-y-1">
                  <h3 class="text-lg sm:text-xl font-bold tracking-tight">
                    The 3-Tap Rule (No Spoonfeeding)
                  </h3>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400">
                    Why we don't immediately give you an English translation:
                  </p>
                </div>

                <div class="space-y-2.5">
                  {/* Step 1 Card */}
                  <div class="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1">
                    <div class="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300">
                      <span class="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px]">1</span>
                      <span>Tap 1: Sound It Out (Zero Spoilers)</span>
                    </div>
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 pl-7">
                      Hear the isolated word spoken aloud, see full vowel markings (پیش، زبر، زیر), and see each letter separated so you can decode the cursive connections.
                    </p>
                  </div>

                  {/* Step 2 Card */}
                  <div class="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
                    <div class="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                      <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">2</span>
                      <span>Tap 2: The Spoken Bridge (Rozmarra)</span>
                    </div>
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 pl-7">
                      Still stuck? Tap again to see the simple, everyday word you say at home and related root family words you already know.
                    </p>
                  </div>

                  {/* Step 3 Card */}
                  <div class="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-1">
                    <div class="flex items-center gap-2 font-bold text-xs text-indigo-800 dark:text-indigo-300">
                      <span class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">3</span>
                      <span>Tap 3: English Meaning (Final Safety Net)</span>
                    </div>
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 pl-7">
                      If the spoken clues weren't enough, the third tap reveals the full literary English translation and cultural nuance notes.
                    </p>
                  </div>
                </div>
              </div>
            </Show>

            {/* SLIDE 3: Live Interactive Practice */}
            <Show when={currentSlide() === 3}>
              <div class="space-y-3.5">
                <div class="text-center space-y-1">
                  <h3 class="text-base sm:text-lg font-bold tracking-tight">
                    Try It Live: Tap the word below
                  </h3>
                  <p class="text-xs text-neutral-500">
                    Experience how the 3 clues guide you step-by-step:
                  </p>
                </div>

                {/* Interactive Demo Sandbox Card */}
                <div class="p-4 rounded-xl border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 space-y-3">
                  {/* Step indicator */}
                  <div class="flex items-center justify-between text-xs pb-2 border-b border-black/10 dark:border-white/10">
                    <span
                      class={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        demoTapLevel() === 1
                          ? 'bg-amber-600 text-white'
                          : demoTapLevel() === 2
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      Clue {demoTapLevel()} of 3
                    </span>
                    <span class="text-neutral-500 text-[11px]">
                      {demoTapLevel() === 1 && 'Sound It Out'}
                      {demoTapLevel() === 2 && 'Everyday Spoken Bridge'}
                      {demoTapLevel() === 3 && 'English Meaning'}
                    </span>
                  </div>

                  {/* Vocalized Display & Audio */}
                  <div class="text-center py-1">
                    <div class="font-nastaliq text-4xl text-neutral-900 dark:text-neutral-100" dir="rtl">
                      تَبادَلَہ
                    </div>
                    <button
                      type="button"
                      class="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-medium cursor-pointer hover:bg-amber-500/25"
                      onClick={() => playTTS('تَبادَلَہ')}
                    >
                      <Volume2 size={13} />
                      <span>Listen to pronunciation</span>
                    </button>
                  </div>

                  {/* CLUE 1 CONTENT: Letters & Vowels */}
                  <div class="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
                    <div class="text-[11px] font-semibold text-neutral-500 text-right">
                      Isolated Letters (حروف):
                    </div>
                    <div class="flex justify-center gap-1.5" dir="rtl">
                      <span class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-xs font-nastaliq">ت (تے)</span>
                      <span class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-xs font-nastaliq">ب (بے)</span>
                      <span class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-xs font-nastaliq">ا (الف)</span>
                      <span class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-xs font-nastaliq">د (دال)</span>
                      <span class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-xs font-nastaliq">ل (لام)</span>
                      <span class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-xs font-nastaliq">ہ (ہ)</span>
                    </div>
                  </div>

                  {/* CLUE 2 CONTENT: Spoken Bridge */}
                  <Show when={demoTapLevel() >= 2}>
                    <div class="space-y-2 pt-2 border-t border-emerald-500/20 text-right" dir="rtl">
                      <div class="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        روزمرہ بول چال (Words you say at home):
                      </div>
                      <div class="flex gap-2 justify-end">
                        <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-nastaliq">
                          لین دین / بدلی
                        </span>
                        <span class="px-2 py-0.5 rounded bg-blue-500/15 text-blue-800 dark:text-blue-300 text-xs font-nastaliq">
                          مادہ: ب-د-ل (بدلنا)
                        </span>
                      </div>
                      <p class="text-[11px] text-neutral-500 font-nastaliq">
                        ایک چیز دے کر دوسری لینے کا عمل۔
                      </p>
                    </div>
                  </Show>

                  {/* CLUE 3 CONTENT: English Meaning */}
                  <Show when={demoTapLevel() >= 3}>
                    <div class="space-y-1 pt-2 border-t border-indigo-500/20 text-left">
                      <div class="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                        English Contextual Meaning:
                      </div>
                      <p class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        Mutual exchange / transfer / handover
                      </p>
                      <p class="text-[11px] text-neutral-500">
                        Refers to the transfer of prisoners and partition refugees across the border.
                      </p>
                    </div>
                  </Show>

                  {/* Demo Button to advance clue */}
                  <div class="pt-2">
                    <button
                      type="button"
                      class="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      onClick={() => {
                        const next = demoTapLevel() < 3 ? ((demoTapLevel() + 1) as 1 | 2 | 3) : 1;
                        setDemoTapLevel(next);
                      }}
                    >
                      <span>
                        {demoTapLevel() === 1 && 'Next Clue: Show Spoken Bridge (Tap 2) →'}
                        {demoTapLevel() === 2 && 'Next Clue: Show English Meaning (Tap 3) →'}
                        {demoTapLevel() === 3 && '↺ Reset Clues to Clue 1'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </Show>

            {/* SLIDE 4: Ready to Read */}
            <Show when={currentSlide() === 4}>
              <div class="space-y-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={26} />
                </div>
                <div class="text-center space-y-1">
                  <h3 class="text-lg sm:text-xl font-bold tracking-tight">
                    You're ready to start reading!
                  </h3>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400">
                    A few quick tips for your reading session:
                  </p>
                </div>

                <div class="space-y-2 text-xs">
                  <div class="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-start gap-2.5">
                    <span class="text-base">📖</span>
                    <div>
                      <span class="font-bold">Start with Level 2</span>
                      <p class="text-neutral-500 mt-0.5">
                        *Toba Tek Singh* by Saadat Hasan Manto uses everyday colloquial vocabulary that is perfect for getting started.
                      </p>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-start gap-2.5">
                    <span class="text-base">🎧</span>
                    <div>
                      <span class="font-bold">Use the Audio Narration Bar</span>
                      <p class="text-neutral-500 mt-0.5">
                        At the bottom of the screen, tap "Play Narration" to hear the whole sentence read aloud while watching the script highlight.
                      </p>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-start gap-2.5">
                    <span class="text-base">⌨️</span>
                    <div>
                      <span class="font-bold">Keyboard Shortcuts</span>
                      <p class="text-neutral-500 mt-0.5">
                        Press <kbd class="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">Space</kbd> to advance clues, and <kbd class="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">Esc</kbd> to close any card.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer Controls */}
          <div class="px-5 py-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
              disabled={currentSlide() === 1}
              onClick={prevSlide}
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>

            {/* Dots */}
            <div class="flex items-center gap-1.5">
              <For each={[1, 2, 3, 4]}>
                {(num) => (
                  <button
                    type="button"
                    class={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide() === num ? 'w-5 bg-amber-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                    onClick={() => setCurrentSlide(num)}
                  />
                )}
              </For>
            </div>

            <button
              type="button"
              class="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              onClick={nextSlide}
            >
              <span>{currentSlide() === totalSlides ? 'Start Reading' : 'Next'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
