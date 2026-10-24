import { createSignal, Show, For } from 'solid-js';
import { isTutorialOpen, closeTutorial, playTTS, theme } from '../store/readerStore';
import {
  X,
  Volume2,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  CheckCircle2,
  Ear,
  Sparkles,
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
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        onClick={closeTutorial}
      >
        {/* Modal Window */}
        <div
          class={`relative w-full max-w-xl rounded-2xl shadow-2xl border-2 flex flex-col max-h-[92vh] overflow-hidden ${
            theme() === 'midnight'
              ? 'bg-[#18191d] border-neutral-700 text-white'
              : 'bg-[#FCFBF8] border-neutral-300 text-neutral-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-[#1f2026]">
            <div class="flex items-center gap-2.5">
              <span class="p-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs">
                <HelpCircle size={16} />
              </span>
              <span class="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                How Abjad Reader Works
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-neutral-600 dark:text-neutral-400 font-mono">
                {currentSlide()} / {totalSlides}
              </span>
              <button
                type="button"
                title="Close Tutorial"
                class="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors cursor-pointer"
                onClick={closeTutorial}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Slide Content (Scrollable) */}
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm leading-relaxed">
            {/* SLIDE 1: The Mission */}
            <Show when={currentSlide() === 1}>
              <div class="space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center mx-auto shadow-xs">
                  <Ear size={28} />
                </div>
                <div class="text-center space-y-1.5">
                  <h3 class="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    You already know the spoken language.
                  </h3>
                  <p class="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                    The written script is the only hurdle between you and Urdu literature.
                  </p>
                </div>

                <div class="p-4 rounded-xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 shadow-xs space-y-2">
                  <div class="flex items-start gap-3">
                    <span class="text-lg leading-none mt-0.5">💡</span>
                    <div class="space-y-1.5 text-xs">
                      <p class="font-bold text-neutral-900 dark:text-white text-sm">
                        Does your brain freeze when looking at Nastaliq script?
                      </p>
                      <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        That is completely normal. In everyday conversation, you already understand words like{' '}
                        <strong class="text-neutral-950 dark:text-white underline decoration-neutral-400">دروازہ (darwaza)</strong>,{' '}
                        <strong class="text-neutral-950 dark:text-white underline decoration-neutral-400">کھڑکی (khirki)</strong>,{' '}
                        <strong class="text-neutral-950 dark:text-white underline decoration-neutral-400">پانی (paani)</strong>, and{' '}
                        <strong class="text-neutral-950 dark:text-white underline decoration-neutral-400">حکومت (hukumat)</strong>.
                      </p>
                      <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        However, when printed in cursive Nastaliq calligraphy, your eyes can't immediately see where one letter ends and another begins. Abjad Reader trains your eyes to break that cursive code step-by-step.
                      </p>
                    </div>
                  </div>
                </div>

                <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400 text-center">
                  Instead of frustrating you with a dictionary, we give you 3 progressive clues for every word.
                </p>
              </div>
            </Show>

            {/* SLIDE 2: The 3-Tap Rule */}
            <Show when={currentSlide() === 2}>
              <div class="space-y-3.5">
                <div class="text-center space-y-1">
                  <h3 class="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    The 3-Tap Progressive Clues
                  </h3>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    Why we don't immediately give away the English translation:
                  </p>
                </div>

                <div class="space-y-3">
                  {/* Step 1 Card */}
                  <div class="p-3.5 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xs space-y-1.5">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs">
                        Tap 1
                      </span>
                      <span class="font-bold text-sm text-neutral-900 dark:text-white">
                        Sound It Out (Zero Spoilers)
                      </span>
                    </div>
                    <p class="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed pl-1">
                      Hear the isolated word spoken aloud, see full vowel markings (Pesh, Zer, Zabar), and see each letter separated into clean phonics blocks so your eyes decode the cursive connections.
                    </p>
                  </div>

                  {/* Step 2 Card */}
                  <div class="p-3.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs space-y-1.5">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-bold text-xs">
                        Tap 2
                      </span>
                      <span class="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                        The Spoken Bridge (Rozmarra)
                      </span>
                    </div>
                    <p class="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed pl-1">
                      Still stuck? Tap again to see the simple, everyday spoken word you say at home and related root family words you already know.
                    </p>
                  </div>

                  {/* Step 3 Card */}
                  <div class="p-3.5 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/30 shadow-xs space-y-1.5">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md bg-indigo-700 text-white font-bold text-xs">
                        Tap 3
                      </span>
                      <span class="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                        English Meaning (Final Safety Net)
                      </span>
                    </div>
                    <p class="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed pl-1">
                      If the spoken clues weren't enough, the third tap reveals the full literary English translation and cultural nuance notes.
                    </p>
                  </div>
                </div>
              </div>
            </Show>

            {/* SLIDE 3: Live Interactive Practice (Using the word 'Khirki') */}
            <Show when={currentSlide() === 3}>
              <div class="space-y-3.5">
                <div class="text-center space-y-1">
                  <h3 class="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                    Try It Live: Practice on the word 'Khirki'
                  </h3>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    Tap the button below to see how clues advance step-by-step:
                  </p>
                </div>

                {/* Interactive Demo Sandbox Card */}
                <div class="p-4 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-md space-y-3">
                  {/* Step indicator */}
                  <div class="flex items-center justify-between text-xs pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
                    <span
                      class={`px-2.5 py-1 rounded-md font-bold text-xs ${
                        demoTapLevel() === 1
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : demoTapLevel() === 2
                          ? 'bg-emerald-700 text-white'
                          : 'bg-indigo-700 text-white'
                      }`}
                    >
                      Clue {demoTapLevel()} of 3
                    </span>
                    <span class="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                      {demoTapLevel() === 1 && '1: Sound It Out'}
                      {demoTapLevel() === 2 && '2: Everyday Spoken Bridge'}
                      {demoTapLevel() === 3 && '3: English Meaning'}
                    </span>
                  </div>

                  {/* Vocalized Display & Audio */}
                  <div class="text-center py-2 space-y-2">
                    <div class="font-nastaliq text-5xl font-bold text-neutral-950 dark:text-white" dir="rtl">
                      کھِڑْکی
                    </div>
                    <div>
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold shadow-sm transition-all cursor-pointer"
                        onClick={() => playTTS('کھڑکی')}
                      >
                        <Volume2 size={15} class="text-white dark:text-neutral-900" />
                        <span>Listen to pronunciation</span>
                      </button>
                    </div>
                  </div>

                  {/* CLUE 1 CONTENT: Letters & Vowels */}
                  <div class="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 text-left">
                      Isolated Letter Blocks:
                    </div>
                    <div class="flex justify-center gap-2" dir="rtl">
                      <div class="flex flex-col items-center min-w-[50px] px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 shadow-xs">
                        <span class="text-lg font-bold font-nastaliq text-neutral-900 dark:text-white leading-tight">کھ</span>
                        <div class="w-full h-px bg-neutral-300 dark:bg-neutral-700 my-1" />
                        <span class="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 font-sans">کھے</span>
                      </div>
                      <div class="flex flex-col items-center min-w-[50px] px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 shadow-xs">
                        <span class="text-lg font-bold font-nastaliq text-neutral-900 dark:text-white leading-tight">ڑ</span>
                        <div class="w-full h-px bg-neutral-300 dark:bg-neutral-700 my-1" />
                        <span class="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 font-sans">ڑے</span>
                      </div>
                      <div class="flex flex-col items-center min-w-[50px] px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 shadow-xs">
                        <span class="text-lg font-bold font-nastaliq text-neutral-900 dark:text-white leading-tight">ک</span>
                        <div class="w-full h-px bg-neutral-300 dark:bg-neutral-700 my-1" />
                        <span class="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 font-sans">کاف</span>
                      </div>
                      <div class="flex flex-col items-center min-w-[50px] px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 shadow-xs">
                        <span class="text-lg font-bold font-nastaliq text-neutral-900 dark:text-white leading-tight">ی</span>
                        <div class="w-full h-px bg-neutral-300 dark:bg-neutral-700 my-1" />
                        <span class="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 font-sans">چھوٹی یے</span>
                      </div>
                    </div>
                  </div>

                  {/* CLUE 2 CONTENT: Spoken Bridge */}
                  <Show when={demoTapLevel() >= 2}>
                    <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 space-y-1 text-left">
                      <div class="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Everyday Spoken Urdu Bridge:
                      </div>
                      <p class="text-sm font-bold font-nastaliq text-emerald-950 dark:text-emerald-100" dir="rtl">
                        کھڑکی (کمرے کی کھڑکی / دریچہ)
                      </p>
                      <p class="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                        The window in your room—the exact word you say at home every day!
                      </p>
                    </div>
                  </Show>

                  {/* CLUE 3 CONTENT: English Meaning */}
                  <Show when={demoTapLevel() >= 3}>
                    <div class="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-700 space-y-1 text-left">
                      <div class="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        English Contextual Meaning:
                      </div>
                      <p class="text-sm font-bold text-neutral-900 dark:text-white">
                        Window / Casement (opening in a wall for light and air)
                      </p>
                      <p class="text-xs text-neutral-700 dark:text-neutral-300">
                        In Manto's story *Khol Do*, the doctor commands: <em>"Khirki khol do"</em> (Open the window).
                      </p>
                    </div>
                  </Show>

                  {/* Demo Button to advance clue */}
                  <div class="pt-2">
                    <button
                      type="button"
                      class="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      onClick={() => {
                        const next = demoTapLevel() < 3 ? ((demoTapLevel() + 1) as 1 | 2 | 3) : 1;
                        setDemoTapLevel(next);
                      }}
                    >
                      <span>
                        {demoTapLevel() === 1 && 'Click for Clue 2: Show Spoken Bridge →'}
                        {demoTapLevel() === 2 && 'Click for Clue 3: Show English Meaning →'}
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
                <div class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 size={30} />
                </div>
                <div class="text-center space-y-1">
                  <h3 class="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    You're ready to start reading!
                  </h3>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    A few quick tips for your reading session:
                  </p>
                </div>

                <div class="space-y-2.5 text-xs">
                  <div class="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 shadow-xs flex items-start gap-3">
                    <span class="text-lg">📖</span>
                    <div>
                      <span class="font-bold text-sm text-neutral-900 dark:text-white">Start with Level 1: Khol Do (کھول دو)</span>
                      <p class="text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
                        Manto’s masterpiece uses everyday colloquial words you know from speaking (*darwaza, khirki, kapra, pani*). Perfect for your first read!
                      </p>
                    </div>
                  </div>

                  <div class="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 shadow-xs flex items-start gap-3">
                    <span class="text-lg">🎧</span>
                    <div>
                      <span class="font-bold text-sm text-neutral-900 dark:text-white">Use the Audio Narration Bar</span>
                      <p class="text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
                        At the bottom of the screen, tap "Play Narration" to hear the whole sentence read aloud while watching the script highlight.
                      </p>
                    </div>
                  </div>

                  <div class="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 shadow-xs flex items-start gap-3">
                    <span class="text-lg">⌨️</span>
                    <div>
                      <span class="font-bold text-sm text-neutral-900 dark:text-white">Keyboard Shortcuts</span>
                      <p class="text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
                        Press <kbd class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono font-bold">Space</kbd> to advance clues, and <kbd class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono font-bold">Esc</kbd> to close any card.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer Controls */}
          <div class="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-[#1f2026]">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
              disabled={currentSlide() === 1}
              onClick={prevSlide}
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>

            {/* Dots */}
            <div class="flex items-center gap-2">
              <For each={[1, 2, 3, 4]}>
                {(num) => (
                  <button
                    type="button"
                    class={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide() === num
                        ? 'w-6 bg-neutral-900 dark:bg-white'
                        : 'w-2 bg-neutral-300 dark:bg-neutral-700'
                    }`}
                    onClick={() => setCurrentSlide(num)}
                  />
                )}
              </For>
            </div>

            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
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