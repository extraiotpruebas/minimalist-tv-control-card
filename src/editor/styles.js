const EDITOR_CSS = `
:host { display: block; }
.ed { display: grid; gap: 8px; padding-bottom: 16px; }
.ed-h { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.ed-h span { flex: 1; min-width: 0; }
.ed-h.l1 { font-size: 1.05rem; margin-top: 18px; padding-bottom: 6px; border-bottom: 1px solid var(--divider-color, rgb(127 127 127 / 0.3)); }
.ed-h.l2 { font-size: 0.95rem; margin-top: 10px; }
.ed-h.l3 { font-size: 0.85rem; font-weight: 500; opacity: 0.8; margin-top: 4px; }
.ed-h.litem { font-weight: 400; font-size: 0.9rem; }
.ed-note { font-size: 0.8rem; opacity: 0.7; }
.ed-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.ed button {
  font: inherit; font-size: 0.82rem; padding: 5px 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--divider-color, rgb(127 127 127 / 0.4));
  background: var(--secondary-background-color, transparent); color: var(--primary-text-color, inherit);
}
.ed button:disabled { opacity: 0.35; cursor: default; }
.ed-h button { padding: 2px 9px; }
.ed-alert { padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; border-inline-start: 4px solid; background: rgb(127 127 127 / 0.08); }
.ed-alert.error { border-color: var(--error-color, #db4437); }
.ed-alert.warning { border-color: var(--warning-color, #ffa600); }
.ed-alert.info { border-color: var(--info-color, #039be5); }
.ed-alert .ed-btns { margin-top: 8px; }

.ed-swatches { display: flex; gap: 8px; }
.ed-sw { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--divider-color, rgb(127 127 127 / 0.5)); box-sizing: border-box; }
.ed-sw.base { border-style: dashed; opacity: 0.6; }

.ed-fold { border: 1px solid var(--divider-color, rgb(127 127 127 / 0.3)); border-radius: 12px; background: var(--card-background-color, transparent); }
.ed-fold .ed-fold { background: var(--secondary-background-color, rgb(127 127 127 / 0.06)); }
.ed-fold > summary { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; list-style: none; border-radius: 12px; }
.ed-fold > summary::-webkit-details-marker { display: none; }
.ed-fold > summary::before {
  content: ''; flex: none; width: 7px; height: 7px; opacity: 0.6;
  border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
  transform: rotate(-45deg); transition: transform 0.15s;
}
.ed-fold[open] > summary::before { transform: rotate(45deg); }
.ed-fold > summary:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: -2px; }
.ed-fold-main { flex: 1; min-width: 0; display: grid; }
.ed-fold-title { font-weight: 600; font-size: 0.95rem; }
.ed-fold.l1 > summary .ed-fold-title { font-size: 1.02rem; }
.ed-fold.l3 > summary .ed-fold-title { font-weight: 500; font-size: 0.88rem; }
.ed-fold-sum { font-size: 0.78rem; opacity: 0.65; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ed-fold-body { display: grid; gap: 8px; padding: 2px 12px 12px; }
@media (prefers-reduced-motion: reduce) { .ed-fold > summary::before { transition: none; } }
`;

export { EDITOR_CSS };
