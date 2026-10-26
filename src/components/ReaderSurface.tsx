import { For, Show } from 'solid-js';
import {
  paragraphs,
  tokensMap,
  analysesMap,
  activeTokenId,
  openTokenLens,
  advanceTapLevel,
  scriptTradition,
  fontSizePx,
  showIzafatHighlights,
  currentSentence,
  isPlaying,
} from '../store/readerStore';

export default function ReaderSurface() {
  // Delegated Click Handler on .abjad-reader-surface (Zero per-span listeners!)
  const handleSurfaceClick = (e: MouseEvent) => {
    // If user has highlighted a text selection, do not open single word lens
    if (typeof window !== 'undefined') {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 1) {
        return;
      }
    }

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
      class={`abjad-reader-surface w-full ${
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
      <For each={paragraphs().filter((p) => p.paragraphIndex >= 0)}>
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
                  const isCurrentSentence = () => {
                    const activeS = currentSentence();
                    if (!activeS || !isPlaying()) return false;
                    return activeS.paragraphId === paragraph.id && token.sentenceIndex === activeS.sentenceIndex;
                  };

                  if (!token.isWord) {
                    // Non-word punctuation or whitespace
                    return (
                      <span
                        class={isCurrentSentence() ? 'sentence-token-active' : ''}
                        data-active-sentence={isCurrentSentence() ? 'true' : undefined}
                      >
                        {token.surfaceForm}
                      </span>
                    );
                  }

                  const isIzafat = () => showIzafatHighlights() && Boolean(token.izafatGroupId);
                  const isCompound = () => Boolean(token.compoundGroupId);
                  const isCompoundActive = () => {
                    if (!token.compoundGroupId) return false;
                    const activeId = activeTokenId();
                    if (!activeId) return false;
                    const activeTok = tokensMap()[activeId];
                    return Boolean(
                      activeTok &&
                      activeTok.paragraphId === token.paragraphId &&
                      activeTok.compoundGroupId &&
                      activeTok.compoundGroupId === token.compoundGroupId
                    );
                  };

                  const tokenWordDisplay = () => {
                    const activeId = activeTokenId();
                    if (!activeId) return token.surfaceForm;
                    const activeTok = tokensMap()[activeId];
                    const activeAna = analysesMap()[activeId];

                    // 1. Part of active compound: resolve only this token's constituent word
                    if (
                      token.compoundGroupId &&
                      activeTok?.compoundGroupId === token.compoundGroupId &&
                      activeTok?.paragraphId === token.paragraphId &&
                      activeAna?.vocalizedForm
                    ) {
                      const cTokens = pTokens.filter(
                        (t) => t.isWord && t.compoundGroupId && t.compoundGroupId === token.compoundGroupId
                      );
                      const parts = activeAna.vocalizedForm.trim().split(/\s+/);
                      const idx = cTokens.findIndex((t) => t.id === token.id);
                      if (idx >= 0 && idx < parts.length) {
                        return parts[idx];
                      }
                    }

                    // 2. Single word token (non-compound)
                    if (activeId === token.id && analysesMap()[token.id]?.vocalizedForm) {
                      const voc = analysesMap()[token.id]!.vocalizedForm;
                      if (!voc.includes(' ')) return voc;
                    }

                    return token.surfaceForm;
                  };

                  return (
                    <span
                      class={`${isIzafat() ? 'izafat-group' : ''} ${
                        isCompound() ? 'compound-group' : ''
                      } ${isCurrentSentence() ? 'sentence-token-active' : ''}`}
                      data-compound-group={token.compoundGroupId || undefined}
                      data-compound-active={isCompoundActive() ? 'true' : undefined}
                      data-active-sentence={isCurrentSentence() ? 'true' : undefined}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        class="abjad-word-token"
                        data-token-id={token.id}
                        data-active={activeTokenId() === token.id ? 'true' : undefined}
                      >
                        {tokenWordDisplay()}
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
