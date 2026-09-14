// Mismo dibujo que icons.svg, pero como texto embebido: así funcionan los
// íconos aunque la página se abra directo desde el disco (sin servidor).
// Uso:
//   1) En HTML estático: <span data-icon="user"></span> y que lo pinte
//      render-icons.js solo.
//   2) En strings armados por JS: `${Icons.check}` directo adentro del template.
const Icons = {
  user: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><circle cx="12" cy="8" r="3.4" stroke="#131A2B" stroke-width="1.8" fill="none"/><path d="M4.5 19.5c0-4 3.4-6.7 7.5-6.7s7.5 2.7 7.5 6.7" stroke="#131A2B" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',

  plus: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" stroke="#131A2B" stroke-width="1.8" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="#131A2B" stroke-width="1.8" stroke-linecap="round"/></svg>',

  receipt: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><path d="M6 2.5h12v18.3l-2.2-1.4-2.1 1.4-2.2-1.4-2.1 1.4-2.2-1.4-1.2.8V2.5z" stroke="#131A2B" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="8.5" y1="7" x2="15.5" y2="7" stroke="#131A2B" stroke-width="1.6" stroke-linecap="round"/><line x1="8.5" y1="10.5" x2="15.5" y2="10.5" stroke="#131A2B" stroke-width="1.6" stroke-linecap="round"/><line x1="8.5" y1="14" x2="13" y2="14" stroke="#131A2B" stroke-width="1.6" stroke-linecap="round"/></svg>',

  ticket: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><rect x="3" y="6.5" width="18" height="11" rx="2" stroke="#131A2B" stroke-width="1.8" fill="none"/><line x1="9.5" y1="6.5" x2="9.5" y2="17.5" stroke="#131A2B" stroke-width="1.8" stroke-dasharray="2.2 2.2"/></svg>',

  arrowLeft: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12" stroke="#131A2B" stroke-width="1.8" stroke-linecap="round"/><polyline points="11 6 5 12 11 18" stroke="#131A2B" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',

  close: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" stroke="#131A2B" stroke-width="1.8" stroke-linecap="round"/><line x1="18" y1="6" x2="6" y2="18" stroke="#131A2B" stroke-width="1.8" stroke-linecap="round"/></svg>',

  check: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><polyline points="5 13 9.5 17.5 19 7" stroke="#131A2B" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',

  minus: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" stroke="#131A2B" stroke-width="1.8" stroke-linecap="round"/></svg>',

  card: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><rect x="2.5" y="6" width="19" height="13" rx="2" stroke="#131A2B" stroke-width="1.8" fill="none"/><line x1="2.5" y1="10" x2="21.5" y2="10" stroke="#131A2B" stroke-width="1.8"/><line x1="6" y1="14.5" x2="10" y2="14.5" stroke="#131A2B" stroke-width="1.8" stroke-linecap="round"/></svg>',
}
