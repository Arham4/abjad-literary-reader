import { For, Show } from 'solid-js';
import {
  paragraphs,
  tokensMap,
  activeTokenId,
  openTokenLens,
  advanceTapLevel,
  scriptTradition,
  fontSizePx,
  showIzafatHighlights,
  currentSentenceIndex,
} from '../store/readerStore';

export default function ReaderSurface() {
  // Delegated Click Handler on .abjad-reader-surface (Zero per-span listeners!)
  const handleSurfaceClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('.abjad-word-token');
    if (!target) return;
    const tokenId = target.dataset.tokenId;
    if (!tokenId) return;

    if (activeTokenId() === tokenId) {
      advanceTapLevel(); // 1 -> 2 -> 3 (never toggles closed on repeat click)
    } else {
      openTokenLens(tokenId, target);
    }
  };

  // Delegated Keydown Handler on .abjad-reader-surface
  const handleSurfaceKeyDown = (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const target = (e.target as HTMLElement).closest<HTMLElement>('.abjad-word-token');
    if (!target) return;

    e.preventDefault(); // Prevents Space from jump-scrolling the viewport
    const tokenId = target.dataset.tokenId;
    if (!tokenId) return;

    if (activeTokenId() === tokenId) {
      advanceTapLevel();
    } else {
      openTokenLens(tokenId, target);
    }
  };

  return (
    <div
      class={`abjad-reader-surface max-w-4xl mx-auto px-4 py-8 ${
        scriptTradition() === 'naskh' ? 'font-naskh' : 'font-nastaliq'
      }`}
      style={{
        'font-size': `${fontSizePx()}px`,
      }}
      onClick={handleSurfaceClick}
      onKeyDown={handleSurfaceKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Urdu Literary Text Reader Surface"
    >
      <For each={paragraphs()}>
        {(paragraph) => {
          // Collect all tokens for this paragraph
          const pTokens = Object.values(tokensMap()).filter(
            (t) => t.paragraphId === paragraph.id
          ).sort((a, b) => a.tokenIndex - b.tokenIndex);

          // Group tokens into sentences or render with izafat group markers
          return (
            <div class="abjad-paragraph-block relative">
              <For each={pTokens}>
                {(token) => {
                  const isCurrentSentence = () =>
                    currentSentenceIndex() !== null && token.sentenceIndex === currentSentenceIndex();

                  if (!token.isWord) {
                    // Non-word punctuation or whitespace
                    return (
                      <span
                        class={`${isCurrentSentence() ? 'sentence-highlight-active' : ''}`}
                      >
                        {token.surfaceForm}
                      </span>
                    );
                  }

                  const isIzafat = () => showIzafatHighlights() && Boolean(token.izafatGroupId);

                  return (
                    <span
                      class={`${isIzafat() ? 'izafat-group' : ''} ${
                        isCurrentSentence() ? 'sentence-highlight-active' : ''
                      }`}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        class="abjad-word-token"
                        data-token-id={token.id}
                        data-active={activeTokenId() === token.id ? 'true' : undefined}
                      >
                        {token.surfaceForm}
                      </span>
                    </span>
                  );
                }}
              </For>
            </div>
          );
        }}
      </For>
    </div>
  );
}
