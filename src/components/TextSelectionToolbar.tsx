import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import {
  selectedText,
  setSelectedText,
  isSelectionPlaying,
  playSelectedText,
  stopSelectionAudio,
  decodeAndOpenPhraseLens,
  theme,
} from '../store/readerStore';
import { Volume2, Pause, X, Play, BookOpen } from 'lucide-solid';

interface PillCoordinates {
  top: number;
  left: number;
  isBelow: boolean;
}

export default function TextSelectionToolbar() {
  const [coords, setCoords] = createSignal<PillCoordinates | null>(null);

  const calculateSelectionPosition = () => {
    if (typeof window === 'undefined') return;
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      if (!isSelectionPlaying()) {
        setSelectedText('');
        setCoords(null);
      }
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2) {
      if (!isSelectionPlaying()) {
        setSelectedText('');
        setCoords(null);
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const readerEl = document.querySelector('.abjad-reader-surface');

    // Make sure selection is inside reader surface
    const element = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : container.parentElement;
    if (!readerEl || !element || !readerEl.contains(element)) {
      return;
    }

    setSelectedText(text);

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    // Determine placement: above selection unless close to navbar (< 85px)
    const isBelow = rect.top < 85;
    const top = isBelow ? rect.bottom + 8 : rect.top - 46;
    const center = rect.left + rect.width / 2;

    // Approximate toolbar width ~180px, clamp within viewport margins
    const left = Math.max(16, Math.min(window.innerWidth - 200, center - 90));

    setCoords({ top, left, isBelow });
  };

  onMount(() => {
    document.addEventListener('selectionchange', calculateSelectionPosition);
    window.addEventListener('scroll', calculateSelectionPosition, { passive: true });
    window.addEventListener('resize', calculateSelectionPosition, { passive: true });

    onCleanup(() => {
      document.removeEventListener('selectionchange', calculateSelectionPosition);
      window.removeEventListener('scroll', calculateSelectionPosition);
      window.removeEventListener('resize', calculateSelectionPosition);
    });
  });

  const handleToggleSelectionAudio = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelectionPlaying()) {
      stopSelectionAudio();
    } else {
      playSelectedText();
    }
  };

  const handleDecodePhrase = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = selectedText().trim();
    if (!text) return;
    await decodeAndOpenPhraseLens(text, coords());
  };

  const handleDismiss = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopSelectionAudio();
    setSelectedText('');
    setCoords(null);
    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <Show when={coords() && selectedText()}>
      <div
        class={`fixed z-40 flex items-center gap-2 px-3.5 py-2 rounded-full shadow-2xl border backdrop-blur-md transition-all duration-150 select-none ${
          theme() === 'sepia'
            ? 'bg-[#3A2D23]/95 border-[#554233] text-[#FAF6EC]'
            : theme() === 'midnight'
            ? 'bg-[#1E2026]/95 border-neutral-700 text-[#E7E2D8]'
            : 'bg-neutral-900/95 border-neutral-700 text-white'
        }`}
        style={{
          top: `${coords()!.top}px`,
          left: `${coords()!.left}px`,
        }}
        onMouseDown={(e) => e.preventDefault()} // Keeps browser text highlighted
      >
        <button
          type="button"
          title={isSelectionPlaying() ? 'Pause Selection' : 'Play Selection (سُنو)'}
          class={`flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-transform active:scale-95 ${
            isSelectionPlaying() ? 'text-amber-400' : 'hover:opacity-85'
          }`}
          onClick={handleToggleSelectionAudio}
        >
          <Show
            when={isSelectionPlaying()}
            fallback={
              <>
                <Volume2 size={14} class="shrink-0" />
                <span class="font-nastaliq text-xs font-bold leading-none inline" dir="rtl">
                  سُنو
                </span>
                <span class="text-[11px] font-sans">Play</span>
              </>
            }
          >
            <Pause size={14} class="shrink-0 animate-pulse text-amber-300" />
            <span class="font-nastaliq text-xs font-bold leading-none inline" dir="rtl">
              وقفہ
            </span>
            <span class="text-[11px] font-sans">Pause</span>
          </Show>
        </button>

        <div class="h-3.5 w-px bg-white/20 mx-0.5" />

        {/* Decode Phrase (3-Tap Clue Engine) */}
        <button
          type="button"
          title="Decode Phrase (3-Tap Meaning & Nuance)"
          class="flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-transform active:scale-95 text-amber-300 hover:text-amber-200"
          onClick={handleDecodePhrase}
        >
          <BookOpen size={14} class="shrink-0" />
          <span class="font-nastaliq text-xs font-bold leading-none inline" dir="rtl">
            معنی
          </span>
          <span class="text-[11px] font-sans font-bold">Decode Phrase</span>
        </button>

        <div class="h-3.5 w-px bg-white/20 mx-0.5" />

        <button
          type="button"
          title="Dismiss selection"
          class="p-0.5 rounded-full opacity-60 hover:opacity-100 cursor-pointer"
          onClick={handleDismiss}
        >
          <X size={12} />
        </button>
      </div>
    </Show>
  );
}
