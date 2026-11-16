import React, { useEffect, useRef } from 'react';
import { formatSuggestionText } from '../../utils/categoryThumbnailMap.js';

/**
 * SearchAutocompleteOverlay
 * 
 * Floating visual autocomplete overlay that appears when the user is typing.
 * Renders category thumbnail previews on the left and differentiator text in bold,
 * exactly matching the quick-commerce UI reference design.
 * 
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the overlay is visible
 * @param {string} props.query - Current search query text
 * @param {Array} props.suggestions - Autocomplete suggestions
 * @param {function} props.onSelectSuggestion - Callback when suggestion is tapped (suggestion) => void
 * @param {function} props.onClose - Callback to close overlay
 */
export default function SearchAutocompleteOverlay({
  isOpen,
  query,
  suggestions = [],
  onSelectSuggestion,
  onClose,
}) {
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (onClose) onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onClose]);

  if (!isOpen || !suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="search-autocomplete-overlay"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e2e8f0',
        borderTop: 'none',
        zIndex: 2500,
        maxHeight: '440px',
        overflowY: 'auto',
        animation: 'overlaySlideDown 0.18s ease-out',
      }}
    >
      <style>{`
        @keyframes overlaySlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .search-suggest-item:active {
          background-color: #f1f5f9 !important;
        }
        .search-suggest-item:hover {
          background-color: #f8fafc;
        }
      `}</style>

      <div style={{ padding: '6px 0' }}>
        {suggestions.map((item, index) => {
          const formatted = formatSuggestionText(item.text, query);

          return (
            <div
              key={item.id || `${item.text}-${index}`}
              className="search-suggest-item"
              onClick={() => onSelectSuggestion(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSuggestion(item);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f8fafc' : 'none',
                gap: '14px',
              }}
            >
              {/* Category / Product Thumbnail */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.text}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '3px',
                    }}
                    onError={(e) => {
                      // Fallback icon if image fails to load
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '🔍';
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>🔍</span>
                )}
              </div>

              {/* Suggestion Text with Bold Differentiator Matching Reference */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.98rem',
                    color: '#1e293b',
                    lineHeight: 1.3,
                    letterSpacing: '-0.1px',
                  }}
                >
                  {formatted.mode === 'prefix_bold' ? (
                    <>
                      <strong style={{ fontWeight: 800, color: '#0f172a' }}>
                        {formatted.boldPart}
                      </strong>
                      <span style={{ fontWeight: 400, color: '#64748b' }}>
                        {formatted.normalPart}
                      </span>
                    </>
                  ) : formatted.mode === 'suffix_bold' ? (
                    <>
                      <span style={{ fontWeight: 400, color: '#64748b' }}>
                        {formatted.normalPart}
                      </span>
                      <strong style={{ fontWeight: 800, color: '#0f172a' }}>
                        {formatted.boldPart}
                      </strong>
                    </>
                  ) : formatted.mode === 'substring' ? (
                    <>
                      <strong style={{ fontWeight: 800, color: '#0f172a' }}>
                        {formatted.boldPart}
                      </strong>
                      <span style={{ fontWeight: 500, color: '#64748b' }}>
                        {formatted.normalPart}
                      </span>
                      <strong style={{ fontWeight: 800, color: '#0f172a' }}>
                        {formatted.afterPart}
                      </strong>
                    </>
                  ) : (
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {item.text}
                    </span>
                  )}
                </div>

                {/* Sub-label if available (category or item type) */}
                {item.category && item.category !== item.text && (
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: '#94a3b8',
                      fontWeight: 500,
                      marginTop: '2px',
                    }}
                  >
                    in {item.category}
                  </div>
                )}
              </div>

              {/* Subtle navigation arrow icon */}
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
