import { createSignal, Show, For, onMount } from 'solid-js';
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
  BookOpen,
  Headphones,
  Keyboard,
} from 'lucide-solid';

export default function TutorialModal() {
  const initialSlide = () => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('slide');
      if (q && ['1', '2', '3', '4'].includes(q)) return parseInt(q, 10);
    }
    return 1;
  };

  const [currentSlide, setCurrentSlide] = createSignal(initialSlide());
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

  // Sample words spoken at home for Slide 1
  const spokenSampleWords = [
    { urdu: 'پانی', roman: 'paani', english: 'water' },
    { urdu: 'دروازہ', roman: 'darwaza', english: 'door' },
    { urdu: 'کھڑکی', roman: 'khirki', english: 'window' },
    { urdu: 'حکومت', roman: 'hukumat', english: 'government' },
  ];

  return (
    <Show when={isTutorialOpen()}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
        onClick={closeTutorial}
      >
        {/* Modal Window */}
        <div
          class={`relative w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
            theme() === 'midnight'
              ? 'bg-[#18191D] border-neutral-700/80 text-[#ECE7DE]'
              : theme() === 'sepia'
              ? 'bg-[#FAF5EC] border-[#D8CCBA] text-[#201813] shadow-[0_25px_60px_-15px_rgba(45,30,15,0.3)]'
              : 'bg-[#FCFBF8] border-[#DCD3C5] text-[#1F1B17]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            class={`px-5 sm:px-7 py-4 border-b flex items-center justify-between ${
              theme() === 'sepia'
                ? 'bg-[#F4ECE1] border-[#D8CCBA]'
                : theme() === 'midnight'
                ? 'bg-[#1F2026] border-neutral-800'
                : 'bg-[#F6F2EA] border-[#E0D7C8]'
            }`}
          >
            <div class="flex items-center gap-2.5">
              <span
                class={`p-1.5 rounded-lg shadow-xs ${
                  theme() === 'sepia'
                    ? 'bg-[#3A2D23] text-[#FAF6EC]'
                    : theme() === 'midnight'
                    ? 'bg-white text-neutral-900'
                    : 'bg-neutral-900 text-white'
                }`}
              >
                <HelpCircle size={16} />
              </span>
              <span class="font-bold text-sm tracking-tight font-serif">
                How Abjad Reader Works
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold opacity-60 font-mono">
                {currentSlide()} / {totalSlides}
              </span>
              <button
                type="button"
                title="Close Tutorial"
                class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
                onClick={closeTutorial}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Slide Content (Scrollable) */}
          <div class="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 text-sm leading-relaxed">
            {/* SLIDE 1: The Core Insight */}
            <Show when={currentSlide() === 1}>
              <div class="space-y-4">
                <div
                  class={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs border ${
                    theme() === 'sepia'
                      ? 'bg-[#F4ECE1] border-[#D8CCBA] text-[#3A2D23]'
                      : theme() === 'midnight'
                      ? 'bg-neutral-800 border-neutral-700 text-white'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <Ear size={28} />
                </div>

                <div class="text-center space-y-1.5">
                  <h3 class="text-xl sm:text-2xl font-bold font-serif tracking-tight">
                    You already know the spoken language.
                  </h3>
                  <p class="text-sm font-medium opacity-80 max-w-lg mx-auto">
                    The written cursive script is the only hurdle between you and Urdu literature.
                  </p>
                </div>

                {/* Spoken Word Examples */}
                <div
                  class={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                    theme() === 'sepia'
                      ? 'bg-[#F2EAE0] border-[#D8CCBA]'
                      : theme() === 'midnight'
                      ? 'bg-[#202229] border-neutral-700'
                      : 'bg-white border-[#E0D7C8]'
                  }`}
                >
                  <div class="text-xs font-bold uppercase tracking-wider opacity-75 font-sans">
                    Words you already use at home every day:
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <For each={spokenSampleWords}>
                      {(item) => (
                        <button
                          type="button"
                          class={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1 shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${
                            theme() === 'sepia'
                              ? 'bg-[#FAF6EC] hover:bg-[#F0E6D4] border-[#D8CCBA] text-[#201813]'
                              : theme() === 'midnight'
                              ? 'bg-[#252830] hover:bg-[#2D303A] border-neutral-600 text-white'
                              : 'bg-[#FCFBF8] hover:bg-neutral-50 border-neutral-200 text-neutral-900'
                          }`}
                          onClick={() => playTTS(item.urdu)}
                          title={`Click to listen to "${item.urdu}"`}
                        >
                          <div class="flex items-center gap-1">
                            <span class="font-nastaliq text-2xl font-bold leading-tight" dir="rtl">
                              {item.urdu}
                            </span>
                            <Volume2 size={13} class="opacity-50" />
                          </div>
                          <span class="text-xs font-bold opacity-80">{item.roman}</span>
                          <span class="text-[11px] opacity-60 italic">{item.english}</span>
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                {/* The Core Mechanism Explanation */}
                <div
                  class={`p-4 rounded-xl border space-y-1.5 ${
                    theme() === 'sepia'
                      ? 'bg-[#F7EFE4] border-[#DECFC0]'
                      : theme() === 'midnight'
                      ? 'bg-[#1D2027] border-neutral-700'
                      : 'bg-[#F8F5EE] border-neutral-200'
                  }`}
                >
                  <p class="text-sm font-semibold leading-relaxed">
                    💡 Why does your brain freeze when looking at Nastaliq?
                  </p>
                  <p class="text-xs sm:text-sm leading-relaxed opacity-85">
                    Because letters connect into complex calligraphic ligatures. Your eyes cannot immediately tell where one letter ends and another begins.
                  </p>
                  <p class="text-xs sm:text-sm leading-relaxed opacity-85">
                    Abjad Reader gives you <strong>3 progressive clues</strong> for every single word so you can decode the cursive script step-by-step.
                  </p>
                </div>
              </div>
            </Show>

            {/* SLIDE 2: The 3 Progressive Clues */}
            <Show when={currentSlide() === 2}>
              <div class="space-y-4">
                <div class="text-center space-y-1">
                  <h3 class="text-xl sm:text-2xl font-bold font-serif tracking-tight">
                    The 3-Tap Clue Rule
                  </h3>
                  <p class="text-sm font-medium opacity-75">
                    We never spoil the English translation immediately. Each tap reveals one clue:
                  </p>
                </div>

                <div class="space-y-3">
                  {/* Clue 1 Card */}
                  <div
                    class={`p-4 sm:p-5 rounded-2xl border space-y-2.5 transition-all shadow-xs ${
                      theme() === 'sepia'
                        ? 'bg-[#F2EAE0] border-[#D8CCBA]'
                        : theme() === 'midnight'
                        ? 'bg-[#202229] border-neutral-700'
                        : 'bg-white border-[#E2D9CC]'
                    }`}
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2.5">
                        <span
                          class={`px-2.5 py-1 rounded-full text-xs font-serif font-bold tracking-wide shrink-0 ${
                            theme() === 'sepia'
                              ? 'bg-[#3A2D23] text-[#FAF6EC]'
                              : theme() === 'midnight'
                              ? 'bg-neutral-100 text-neutral-900'
                              : 'bg-neutral-900 text-white'
                          }`}
                        >
                          Tap 1
                        </span>
                        <span class="font-bold text-sm sm:text-base font-serif">
                          Sound It Out (Zero Spoilers)
                        </span>
                      </div>
                      <span class="text-[11px] font-sans font-bold opacity-50 uppercase tracking-wider hidden sm:inline">
                        Optical Decoding
                      </span>
                    </div>

                    <p class="text-xs sm:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      Hear the isolated word spoken aloud, see full vowel markings (<em>Pesh ُ, Zer ِ, Zabar َ</em>), and see each cursive letter separated into individual alphabet blocks so your eyes break the cursive connection.
                    </p>

                    <div class="flex flex-wrap gap-1.5 pt-1">
                      <span
                        class={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium font-sans ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#3A2D23]'
                            : theme() === 'midnight'
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                        }`}
                      >
                        🔊 Native Audio
                      </span>
                      <span
                        class={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium font-sans ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#3A2D23]'
                            : theme() === 'midnight'
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                        }`}
                      >
                        َ ِ ُ Vowel Marks
                      </span>
                      <span
                        class={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium font-sans ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#3A2D23]'
                            : theme() === 'midnight'
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                        }`}
                      >
                        Isolated Alphabet Blocks
                      </span>
                    </div>
                  </div>

                  {/* Clue 2 Card */}
                  <div
                    class={`p-4 sm:p-5 rounded-2xl border space-y-2.5 transition-all shadow-xs ${
                      theme() === 'sepia'
                        ? 'bg-[#F2EAE0] border-[#D8CCBA]'
                        : theme() === 'midnight'
                        ? 'bg-[#202229] border-neutral-700'
                        : 'bg-white border-[#E2D9CC]'
                    }`}
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2.5">
                        <span class="px-2.5 py-1 rounded-full text-xs font-serif font-bold tracking-wide shrink-0 bg-[#1E4D2B] text-white">
                          Tap 2
                        </span>
                        <span class="font-bold text-sm sm:text-base font-serif">
                          The Spoken Bridge (Rozmarra)
                        </span>
                      </div>
                      <span class="text-[11px] font-sans font-bold opacity-50 uppercase tracking-wider hidden sm:inline">
                        Household Urdu
                      </span>
                    </div>

                    <p class="text-xs sm:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      Still stuck? Tap again to see the simple, everyday spoken equivalent you already say at home (<em>Rozmarra</em>), a plain conversational Urdu explanation, and related root-family words.
                    </p>

                    <div class="flex flex-wrap gap-1.5 pt-1">
                      <span
                        class={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium font-sans ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#1E4D2B]'
                            : theme() === 'midnight'
                            ? 'bg-neutral-800 border-neutral-700 text-emerald-300'
                            : 'bg-neutral-50 border-neutral-200 text-emerald-800'
                        }`}
                      >
                        Home Spoken Equivalent
                      </span>
                      <span
                        class={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium font-sans ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#1E4D2B]'
                            : theme() === 'midnight'
                            ? 'bg-neutral-800 border-neutral-700 text-emerald-300'
                            : 'bg-neutral-50 border-neutral-200 text-emerald-800'
                        }`}
                      >
                        Simple Urdu Explanation
                      </span>
                      <span
                        class={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium font-sans ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#1E4D2B]'
                            : theme() === 'midnight'
                            ? 'bg-neutral-800 border-neutral-700 text-emerald-300'
                            : 'bg-neutral-50 border-neutral-200 text-emerald-800'
                        }`}
                      >
                        Word Root Cousins
                      </span>
                    </div>
                  </div>

                  {/* Clue 3 Card */}
                  <div
                    class={`p-4 sm:p-5 rounded-2xl border space-y-2.5 transition-all shadow-xs ${
                      theme() === 'sepia'
                        ? 'bg-[#F2EAE0] border-[#D8CCBA]'
                        : theme() === 'midnight'
                        ? 'bg-[#202229] border-neutral-700'
                        : 'bg-white border-[#E2D9CC]'
                    }`}
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2.5">
                        <span class="px-2.5 py-1 rounded-full text-xs font-serif font-bold tracking-wide shrink-0 bg-[#2B3A67] text-white">
                          Tap 3
                        </span>
                        <span class="font-bold text-sm sm:text-base font-serif">
                          English Meaning & Literary Nuance
                        </span>
                      </div>
                      <span class="text-[11px] font-sans font-bold opacity-50 uppercase tracking-wider hidden sm:inline">
                        Full Definition
                      </span>
                    </div>

                    <p class="text-xs sm:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      If the spoken clues weren't enough, the third tap reveals the complete contextual English translation, historical background, and cultural nuance notes from Urdu literature.
                    </p>

                    <div class="flex flex-wrap gap-1.5 pt-1">
                      <span
                        class={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium font-sans ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#2B3A67]'
                            : theme() === 'midnight'
                            ? 'bg-neutral-800 border-neutral-700 text-indigo-300'
                            : 'bg-neutral-50 border-neutral-200 text-indigo-800'
                        }`}
                      >
                        English Contextual Meaning
                      </span>
                      <span
                        class={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium font-sans ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#2B3A67]'
                            : theme() === 'midnight'
                            ? 'bg-neutral-800 border-neutral-700 text-indigo-300'
                            : 'bg-neutral-50 border-neutral-200 text-indigo-800'
                        }`}
                      >
                        Literary & Cultural Notes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Show>

            {/* SLIDE 3: Live Interactive Practice */}
            <Show when={currentSlide() === 3}>
              <div class="space-y-4">
                <div class="text-center space-y-1">
                  <h3 class="text-xl sm:text-2xl font-bold font-serif tracking-tight">
                    Try It Live: Practice on 'کھِڑْکی'
                  </h3>
                  <p class="text-sm font-medium opacity-80">
                    Tap the button below to see clues reveal step-by-step:
                  </p>
                </div>

                {/* Interactive Demo Sandbox Card */}
                <div
                  class={`p-5 rounded-2xl border space-y-4 shadow-md ${
                    theme() === 'sepia'
                      ? 'bg-[#F2EAE0] border-[#D8CCBA]'
                      : theme() === 'midnight'
                      ? 'bg-[#202229] border-neutral-700'
                      : 'bg-white border-[#E0D7C8]'
                  }`}
                >
                  {/* Step indicator */}
                  <div class="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 select-none">
                    <span
                      class={`px-2.5 py-1 rounded-full text-xs font-serif font-bold text-white shrink-0 ${
                        demoTapLevel() === 1
                          ? theme() === 'sepia'
                            ? 'bg-[#3A2D23]'
                            : 'bg-neutral-900 dark:bg-white dark:text-neutral-900'
                          : demoTapLevel() === 2
                          ? 'bg-[#1E4D2B]'
                          : 'bg-[#2B3A67]'
                      }`}
                    >
                      Clue {demoTapLevel()} of 3
                    </span>
                    <span class="font-bold text-xs sm:text-sm opacity-85">
                      {demoTapLevel() === 1 && '1: Sound It Out (Zero Spoilers)'}
                      {demoTapLevel() === 2 && '2: Everyday Spoken Bridge'}
                      {demoTapLevel() === 3 && '3: English Meaning & Nuance'}
                    </span>
                  </div>

                  {/* Vocalized Display & Audio */}
                  <div class="text-center pt-3 pb-2 sm:pt-4 sm:pb-3">
                    <div
                      class="font-nastaliq text-5xl sm:text-6xl font-bold pt-2 pb-5 sm:pb-7 mb-2 sm:mb-3"
                      style={{ 'line-height': '2.3' }}
                      dir="rtl"
                    >
                      کھِڑْکی
                    </div>
                    <div class="pt-1">
                      <button
                        type="button"
                        class={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer ${
                          theme() === 'sepia'
                            ? 'bg-[#3A2D23] hover:bg-[#2A1F17] text-[#FAF6EC]'
                            : theme() === 'midnight'
                            ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                        }`}
                        onClick={() => playTTS('کھڑکی')}
                      >
                        <Volume2 size={15} />
                        <span>Listen to pronunciation</span>
                      </button>
                    </div>
                  </div>

                  {/* CLUE 1: Phonics Tiles */}
                  <div class="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
                    <div class="text-xs font-bold opacity-80 text-left font-sans">
                      Letter-by-Letter Phonics Breakdown:
                    </div>
                    <div class="flex justify-center gap-2.5" dir="rtl">
                      <div
                        class={`flex flex-col items-center min-w-[56px] px-2.5 py-2 rounded-xl border shadow-xs ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA]'
                            : theme() === 'midnight'
                            ? 'bg-[#252830] border-neutral-600'
                            : 'bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <span class="text-xl font-bold font-nastaliq leading-tight">کھ</span>
                        <div class="w-full h-px bg-black/10 dark:bg-white/10 my-1" />
                        <span class="text-xs font-bold opacity-75 font-nastaliq">کھے</span>
                      </div>
                      <div
                        class={`flex flex-col items-center min-w-[56px] px-2.5 py-2 rounded-xl border shadow-xs ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA]'
                            : theme() === 'midnight'
                            ? 'bg-[#252830] border-neutral-600'
                            : 'bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <span class="text-xl font-bold font-nastaliq leading-tight">ڑ</span>
                        <div class="w-full h-px bg-black/10 dark:bg-white/10 my-1" />
                        <span class="text-xs font-bold opacity-75 font-nastaliq">ڑے</span>
                      </div>
                      <div
                        class={`flex flex-col items-center min-w-[56px] px-2.5 py-2 rounded-xl border shadow-xs ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA]'
                            : theme() === 'midnight'
                            ? 'bg-[#252830] border-neutral-600'
                            : 'bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <span class="text-xl font-bold font-nastaliq leading-tight">ک</span>
                        <div class="w-full h-px bg-black/10 dark:bg-white/10 my-1" />
                        <span class="text-xs font-bold opacity-75 font-nastaliq">کاف</span>
                      </div>
                      <div
                        class={`flex flex-col items-center min-w-[56px] px-2.5 py-2 rounded-xl border shadow-xs ${
                          theme() === 'sepia'
                            ? 'bg-[#FAF6EC] border-[#D8CCBA]'
                            : theme() === 'midnight'
                            ? 'bg-[#252830] border-neutral-600'
                            : 'bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <span class="text-xl font-bold font-nastaliq leading-tight">ی</span>
                        <div class="w-full h-px bg-black/10 dark:bg-white/10 my-1" />
                        <span class="text-xs font-bold opacity-75 font-nastaliq">چھوٹی یے</span>
                      </div>
                    </div>
                  </div>

                  {/* CLUE 2: Spoken Bridge */}
                  <Show when={demoTapLevel() >= 2}>
                    <div
                      class={`p-3.5 rounded-xl border space-y-1 text-left ${
                        theme() === 'sepia'
                          ? 'bg-[#EBF3EC] border-[#A2CCA6]'
                          : theme() === 'midnight'
                          ? 'bg-emerald-950/40 border-emerald-800'
                          : 'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div class="text-xs font-bold text-[#194324] dark:text-emerald-200 font-sans">
                        Everyday Spoken Urdu Bridge:
                      </div>
                      <p class="text-base font-bold font-nastaliq text-[#194324] dark:text-emerald-100" dir="rtl">
                        کھڑکی (کمرے کی کھڑکی)
                      </p>
                      <p class="text-xs sm:text-sm text-[#194324] dark:text-emerald-100 opacity-90">
                        The window in your room—the exact word you say at home every day!
                      </p>
                    </div>
                  </Show>

                  {/* CLUE 3: English Translation */}
                  <Show when={demoTapLevel() >= 3}>
                    <div
                      class={`p-3.5 rounded-xl border space-y-1 text-left ${
                        theme() === 'sepia'
                          ? 'bg-[#EEF1F6] border-[#B9C6DA]'
                          : theme() === 'midnight'
                          ? 'bg-indigo-950/40 border-indigo-800'
                          : 'bg-indigo-50 border-indigo-200'
                      }`}
                    >
                      <div class="text-xs font-bold text-[#1E2E4A] dark:text-indigo-200 uppercase tracking-wider font-sans">
                        English Contextual Meaning:
                      </div>
                      <p class="text-base font-bold font-serif text-[#1E2E4A] dark:text-white">
                        Window (opening in a wall for light and air)
                      </p>
                      <p class="text-xs sm:text-sm text-[#1E2E4A] dark:text-indigo-100 opacity-85">
                        In Manto's story <em>Khol Do</em>, the doctor commands: <strong>"Khirki khol do"</strong> (Open the window).
                      </p>
                    </div>
                  </Show>

                  {/* Advance Button */}
                  <div class="pt-2">
                    <button
                      type="button"
                      class={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-[0.99] ${
                        theme() === 'sepia'
                          ? 'bg-[#3A2D23] hover:bg-[#2A1F17] text-[#FAF6EC]'
                          : theme() === 'midnight'
                          ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                      }`}
                      onClick={() => {
                        const next = demoTapLevel() < 3 ? ((demoTapLevel() + 1) as 1 | 2 | 3) : 1;
                        setDemoTapLevel(next);
                      }}
                    >
                      <span>
                        {demoTapLevel() === 1 && 'Next Clue: Show Spoken Bridge (Tap 2) →'}
                        {demoTapLevel() === 2 && 'Next Clue: Show English Meaning (Tap 3) →'}
                        {demoTapLevel() === 3 && '↺ Reset Practice to Clue 1'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </Show>

            {/* SLIDE 4: Quick Controls */}
            <Show when={currentSlide() === 4}>
              <div class="space-y-4">
                <div
                  class={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs border ${
                    theme() === 'sepia'
                      ? 'bg-[#EBF3EC] border-[#A2CCA6] text-[#194324]'
                      : theme() === 'midnight'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <CheckCircle2 size={30} />
                </div>

                <div class="text-center space-y-1">
                  <h3 class="text-xl sm:text-2xl font-bold font-serif tracking-tight">
                    You're ready to start reading!
                  </h3>
                  <p class="text-sm font-medium opacity-80">
                    A few quick tips for your reading session:
                  </p>
                </div>

                <div class="space-y-3">
                  <div
                    class={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs ${
                      theme() === 'sepia'
                        ? 'bg-[#F2EAE0] border-[#D8CCBA]'
                        : theme() === 'midnight'
                        ? 'bg-[#202229] border-neutral-700'
                        : 'bg-white border-[#E0D7C8]'
                    }`}
                  >
                    <span class="p-2 rounded-xl bg-black/5 dark:bg-white/10 shrink-0">
                      <BookOpen size={18} />
                    </span>
                    <div class="space-y-1">
                      <span class="font-bold text-sm sm:text-base font-serif">
                        Start with Level 1: Khol Do (کھول دو)
                      </span>
                      <p class="text-xs sm:text-sm leading-relaxed opacity-85">
                        Manto’s masterpiece uses simple conversational words you already say at home (<em>darwaza, khirki, kapra, pani</em>). Perfect for training your eyes!
                      </p>
                    </div>
                  </div>

                  <div
                    class={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs ${
                      theme() === 'sepia'
                        ? 'bg-[#F2EAE0] border-[#D8CCBA]'
                        : theme() === 'midnight'
                        ? 'bg-[#202229] border-neutral-700'
                        : 'bg-white border-[#E0D7C8]'
                    }`}
                  >
                    <span class="p-2 rounded-xl bg-black/5 dark:bg-white/10 shrink-0">
                      <Headphones size={18} />
                    </span>
                    <div class="space-y-1">
                      <span class="font-bold text-sm sm:text-base font-serif">
                        Use the Audio Narration Bar
                      </span>
                      <p class="text-xs sm:text-sm leading-relaxed opacity-85">
                        At the bottom of the screen, tap "Play Narration" to hear the sentence spoken aloud in native Urdu while watching the golden karaoke highlight.
                      </p>
                    </div>
                  </div>

                  <div
                    class={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs ${
                      theme() === 'sepia'
                        ? 'bg-[#F2EAE0] border-[#D8CCBA]'
                        : theme() === 'midnight'
                        ? 'bg-[#202229] border-neutral-700'
                        : 'bg-white border-[#E0D7C8]'
                    }`}
                  >
                    <span class="p-2 rounded-xl bg-black/5 dark:bg-white/10 shrink-0">
                      <Keyboard size={18} />
                    </span>
                    <div class="space-y-1">
                      <span class="font-bold text-sm sm:text-base font-serif">
                        Keyboard & Tap Shortcuts
                      </span>
                      <p class="text-xs sm:text-sm leading-relaxed opacity-85">
                        Tap any word to decode. Press <kbd class="px-2 py-0.5 rounded border border-black/20 dark:border-white/20 font-mono font-bold text-xs">Space</kbd> to reveal the next clue, and <kbd class="px-2 py-0.5 rounded border border-black/20 dark:border-white/20 font-mono font-bold text-xs">Esc</kbd> to close any card.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer Controls */}
          <div
            class={`px-5 sm:px-7 py-4 border-t flex items-center justify-between ${
              theme() === 'sepia'
                ? 'bg-[#F4ECE1] border-[#D8CCBA]'
                : theme() === 'midnight'
                ? 'bg-[#1F2026] border-neutral-800'
                : 'bg-[#F6F2EA] border-[#E0D7C8]'
            }`}
          >
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold opacity-60 hover:opacity-100 disabled:opacity-20 cursor-pointer flex items-center gap-1 transition-opacity"
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
                        ? theme() === 'sepia'
                          ? 'w-6 bg-[#3A2D23]'
                          : 'w-6 bg-neutral-900 dark:bg-white'
                        : 'w-2 bg-black/20 dark:bg-white/20'
                    }`}
                    onClick={() => setCurrentSlide(num)}
                  />
                )}
              </For>
            </div>

            <button
              type="button"
              class={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                theme() === 'sepia'
                  ? 'bg-[#3A2D23] hover:bg-[#2A1F17] text-[#FAF6EC]'
                  : theme() === 'midnight'
                  ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
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
