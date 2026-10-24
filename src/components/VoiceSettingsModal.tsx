import { Show, For } from 'solid-js';
import {
  isVoiceSettingsOpen,
  closeVoiceSettings,
  ttsVoice,
  setTtsVoice,
  ttsEngine,
  setTtsEngine,
  ttsRate,
  setTtsRate,
  ttsPitch,
  setTtsPitch,
  VOICE_OPTIONS,
  type VoicePersona,
  type VoiceEngine,
  testVoicePreview,
  isPreviewPlaying,
  theme,
  availableBrowserVoices,
} from '../store/readerStore';
import { X, Mic, Sparkles, Volume2, Square, Check, Sliders, Cpu } from 'lucide-solid';

export default function VoiceSettingsModal() {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isVoiceSettingsOpen()) {
      closeVoiceSettings();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  // Detect whether browser has any Urdu or Hindi voices installed locally
  const hasBrowserUrdu = () => {
    const list = availableBrowserVoices();
    return list.some((v) => v.lang.startsWith('ur') || v.lang.startsWith('hi'));
  };

  return (
    <Show when={isVoiceSettingsOpen()}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-modal-title"
      >
        {/* Backdrop click dismiss */}
        <div class="absolute inset-0" onClick={closeVoiceSettings} />

        {/* Modal Container */}
        <div
          class={`relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all z-10 ${
            theme() === 'midnight'
              ? 'bg-[#18191D] border-neutral-800 text-[#E7E2D8]'
              : theme() === 'sepia'
              ? 'bg-[#FAF6EC] border-[#D8CCBA] text-[#28201A]'
              : 'bg-[#FAF6EE] border-[#E2D8C0] text-[#1C1917]'
          }`}
        >
          {/* Header */}
          <div
            class={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
              theme() === 'midnight'
                ? 'border-neutral-800 bg-[#141518]'
                : theme() === 'sepia'
                ? 'border-[#E4D8C5] bg-[#F3EDE0]'
                : 'border-[#EDE4D0] bg-[#F5EFE1]'
            }`}
          >
            <div class="flex items-center gap-3">
              <div
                class={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                  theme() === 'sepia'
                    ? 'bg-[#3A2D23] text-[#FAF6EC]'
                    : theme() === 'midnight'
                    ? 'bg-white text-neutral-900'
                    : 'bg-neutral-900 text-white'
                }`}
              >
                <Mic size={18} />
              </div>
              <div>
                <h2 id="voice-modal-title" class="text-base sm:text-lg font-bold tracking-tight">
                  Urdu Voice & Narrator Settings
                </h2>
                <p class="text-xs opacity-75 font-serif" dir="rtl">
                  راوی اور صوتی ترتیبات کا انتخاب
                </p>
              </div>
            </div>

            <button
              type="button"
              title="Close Voice Settings"
              onClick={closeVoiceSettings}
              class="p-2 rounded-xl border border-transparent hover:border-black/10 dark:hover:border-white/10 opacity-70 hover:opacity-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1">
            {/* Section 1: Narrator Personas */}
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider opacity-70">
                  Select Narrator Persona · راوی کا انتخاب
                </span>
                <span class="text-[11px] font-semibold opacity-60">100% Free · Zero Cost</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <For each={VOICE_OPTIONS}>
                  {(opt) => {
                    const isSelected = () => ttsVoice() === opt.id;
                    return (
                      <button
                        type="button"
                        onClick={() => setTtsVoice(opt.id)}
                        class={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                          opt.recommended ? 'sm:col-span-2' : ''
                        } ${
                          isSelected()
                            ? theme() === 'sepia'
                              ? 'bg-[#EFE7D8] border-[#3A2D23] shadow-xs ring-1 ring-[#3A2D23]/30'
                              : theme() === 'midnight'
                              ? 'bg-[#22242A] border-white/40 shadow-xs ring-1 ring-white/30 text-white'
                              : 'bg-white border-neutral-900 shadow-xs ring-1 ring-neutral-900/20'
                            : theme() === 'sepia'
                            ? 'bg-[#FDFBF7] hover:bg-[#F5EFE3] border-[#E0D4C2]'
                            : theme() === 'midnight'
                            ? 'bg-[#1D1E24] hover:bg-[#25272F] border-neutral-800'
                            : 'bg-white hover:bg-neutral-50 border-[#E8DFC9]'
                        }`}
                      >
                        <div class="flex items-start gap-2.5 min-w-0">
                          {/* Radio indicator */}
                          <div
                            class={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                              isSelected()
                                ? theme() === 'sepia'
                                  ? 'bg-[#3A2D23] border-[#3A2D23] text-[#FAF6EC]'
                                  : theme() === 'midnight'
                                  ? 'bg-white border-white text-neutral-900'
                                  : 'bg-neutral-900 border-neutral-900 text-white'
                                : 'border-black/30 dark:border-white/30'
                            }`}
                          >
                            <Show when={isSelected()}>
                              <div class="w-1.5 h-1.5 rounded-full bg-current" />
                            </Show>
                          </div>

                          <div class="space-y-0.5 min-w-0">
                            <div class="flex items-center gap-1.5 flex-wrap">
                              <span class="font-bold text-xs sm:text-sm">{opt.nameEnglish}</span>
                              <span class="font-nastaliq text-sm sm:text-base font-bold leading-tight" dir="rtl">
                                {opt.nameUrdu}
                              </span>
                              <Show when={opt.recommended}>
                                <span
                                  class={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                                    theme() === 'sepia'
                                      ? 'bg-[#3A2D23] text-[#FAF6EC]'
                                      : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                  }`}
                                >
                                  Recommended
                                </span>
                              </Show>
                            </div>
                            <p class="text-[11px] opacity-75 font-medium">{opt.role}</p>
                            <p class="text-[10px] sm:text-[11px] opacity-65 leading-tight">{opt.description}</p>
                          </div>
                        </div>

                        <Show when={isSelected()}>
                          <Check size={14} class="shrink-0 mt-0.5 opacity-80" />
                        </Show>
                      </button>
                    );
                  }}
                </For>
              </div>
            </div>

            {/* Section 2: Speech Engine Selector */}
            <div class="space-y-2">
              <span class="text-xs font-bold uppercase tracking-wider opacity-70">
                Audio Engine · صوتی انجن
              </span>
              <div
                class={`p-1.5 rounded-xl border flex items-center gap-1 ${
                  theme() === 'sepia'
                    ? 'bg-[#F2EADB] border-[#DFD3C0]'
                    : theme() === 'midnight'
                    ? 'bg-[#141518] border-neutral-800'
                    : 'bg-neutral-100 border-neutral-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setTtsEngine('auto')}
                  class={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    ttsEngine() === 'auto'
                      ? theme() === 'sepia'
                        ? 'bg-[#3A2D23] text-[#FAF6EC] shadow-xs'
                        : theme() === 'midnight'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'bg-neutral-900 text-white shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Auto (Smart)
                </button>
                <button
                  type="button"
                  onClick={() => setTtsEngine('browser')}
                  class={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    ttsEngine() === 'browser'
                      ? theme() === 'sepia'
                        ? 'bg-[#3A2D23] text-[#FAF6EC] shadow-xs'
                        : theme() === 'midnight'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'bg-neutral-900 text-white shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Browser Neural
                </button>
                <button
                  type="button"
                  onClick={() => setTtsEngine('server')}
                  class={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    ttsEngine() === 'server'
                      ? theme() === 'sepia'
                        ? 'bg-[#3A2D23] text-[#FAF6EC] shadow-xs'
                        : theme() === 'midnight'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'bg-neutral-900 text-white shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Server Stream
                </button>
              </div>

              <div class="text-[11px] opacity-70 px-1 leading-relaxed">
                <Show
                  when={ttsEngine() === 'browser' || ttsEngine() === 'auto'}
                  fallback={
                    <span>Pre-cached MP3 stream from server. Minimal latency, works on all devices.</span>
                  }
                >
                  <span>
                    ⚡ Zero server RAM & zero latency: uses your browser's built-in neural speech engine
                    (Microsoft Edge Natural Asad/Uzma, Siri, or Android Google Voice).
                  </span>
                </Show>
              </div>
            </div>

            {/* Section 3: Cadence (Speed) & Pitch */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Speed / Pace */}
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold opacity-75">Reading Pace (رفتار)</span>
                  <span class="text-xs font-mono font-bold">{ttsRate()}x</span>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                  <For each={[0.8, 1.0, 1.2]}>
                    {(r) => (
                      <button
                        type="button"
                        onClick={() => setTtsRate(r)}
                        class={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          ttsRate() === r
                            ? theme() === 'sepia'
                              ? 'bg-[#3A2D23] border-[#3A2D23] text-[#FAF6EC]'
                              : theme() === 'midnight'
                              ? 'bg-white border-white text-neutral-900'
                              : 'bg-neutral-900 border-neutral-900 text-white'
                            : theme() === 'sepia'
                            ? 'bg-[#FDFBF7] border-[#DFD3C0] hover:bg-[#F5EFE3]'
                            : theme() === 'midnight'
                            ? 'bg-[#1D1E24] border-neutral-800 hover:bg-[#25272F]'
                            : 'bg-white border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        {r === 0.8 ? '0.8x Slow' : r === 1.0 ? '1.0x Normal' : '1.2x Brisk'}
                      </button>
                    )}
                  </For>
                </div>
              </div>

              {/* Pitch */}
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold opacity-75">Voice Pitch (لہجہ)</span>
                  <span class="text-xs font-mono font-bold">
                    {ttsPitch() < 1.0 ? 'Deep' : ttsPitch() > 1.0 ? 'Higher' : 'Neutral'}
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                  <For each={[0.9, 1.0, 1.1]}>
                    {(p) => (
                      <button
                        type="button"
                        onClick={() => setTtsPitch(p)}
                        class={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          ttsPitch() === p
                            ? theme() === 'sepia'
                              ? 'bg-[#3A2D23] border-[#3A2D23] text-[#FAF6EC]'
                              : theme() === 'midnight'
                              ? 'bg-white border-white text-neutral-900'
                              : 'bg-neutral-900 border-neutral-900 text-white'
                            : theme() === 'sepia'
                            ? 'bg-[#FDFBF7] border-[#DFD3C0] hover:bg-[#F5EFE3]'
                            : theme() === 'midnight'
                            ? 'bg-[#1D1E24] border-neutral-800 hover:bg-[#25272F]'
                            : 'bg-white border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        {p === 0.9 ? 'Deep' : p === 1.0 ? 'Neutral' : 'Higher'}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </div>

            {/* Section 4: Interactive Test Preview */}
            <div
              class={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                theme() === 'sepia'
                  ? 'bg-[#F5EFE3] border-[#DFD3C0]'
                  : theme() === 'midnight'
                  ? 'bg-[#1A1C22] border-neutral-800'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div class="space-y-1 text-center sm:text-left min-w-0">
                <span class="text-[11px] font-bold uppercase tracking-wider opacity-70">
                  Sample Literary Preview (Pangram) · نمونۂ کلام
                </span>
                <p class="font-nastaliq text-base sm:text-lg font-bold leading-relaxed py-1" dir="rtl">
                  ٹھنڈ میں، ایک قحط زدہ گاؤں سے گزرتے وقت ایک فارغ، بااثر اور چڑچڑے شخص کو بعض جل پری نما اژدہے نظر آئے۔
                </p>
              </div>

              <button
                type="button"
                onClick={testVoicePreview}
                class={`w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                  isPreviewPlaying()
                    ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                    : theme() === 'sepia'
                    ? 'bg-[#3A2D23] hover:bg-[#281F17] text-[#FAF6EC]'
                    : theme() === 'midnight'
                    ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
              >
                <Show when={isPreviewPlaying()} fallback={<Volume2 size={15} />}>
                  <Square size={14} class="fill-current" />
                </Show>
                <span>{isPreviewPlaying() ? 'Stop Preview' : 'سُنو آواز (Listen)'}</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            class={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${
              theme() === 'midnight'
                ? 'border-neutral-800 bg-[#141518]'
                : theme() === 'sepia'
                ? 'border-[#E4D8C5] bg-[#F3EDE0]'
                : 'border-[#EDE4D0] bg-[#F5EFE1]'
            }`}
          >
            <span class="text-xs opacity-60">Preferences saved automatically.</span>
            <button
              type="button"
              onClick={closeVoiceSettings}
              class={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                theme() === 'sepia'
                  ? 'bg-[#3A2D23] hover:bg-[#281F17] text-[#FAF6EC]'
                  : theme() === 'midnight'
                  ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
            >
              Done (محفوظ)
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
