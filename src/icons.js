const paths = {
  bag: '<path d="M7 8V6a5 5 0 0 1 10 0v2M6 7h12l3 4v10H3V11z"/><path d="M7 12h10v5H7zM9 7V5h6v2"/>',
  party: '<circle cx="9" cy="8" r="3"/><path d="M2 20v-3c0-6 14-6 14 0v3zM16 5a3 3 0 0 1 0 6m2 3q4 0 4 5"/>',
  map: '<path d="m2 6 6-3 7 3 7-3v15l-7 3-7-3-6 3zM8 3v15m7-12v15"/><path d="m4 14 5-4 5 3 5-4"/>',
  save: '<path d="M3 3h14l4 4v14H3zM7 3v6h9V3M7 21v-8h10v8"/><path d="M13 4v3"/>',
  settings: '<path d="m9 3 1-2h4l1 2 3 2 2 .5 2 3-1 2v3l1 2-2 3-2 .5-3 2-1 2h-4l-1-2-3-2-2-.5-2-3 1-2v-3l-1-2 2-3L6 5z" transform="translate(1 1) scale(.91)"/><circle cx="12" cy="12" r="3.5"/>',
  quit: '<path d="M12 2v10M7 5a9 9 0 1 0 10 0"/>',
  menu: '<path d="M3 6h18M3 12h14M3 18h10"/>',
  signal: '<path d="M3 18v3m5-8v8m5-13v13m5-18v18"/>',
  pin: '<path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  beacon: '<path d="m3 15 4-1 2-8 4 13 3-10 2 4h4"/>',
};
export function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
}
export const insignia = '<svg viewBox="0 0 56 46" fill="none" aria-hidden="true"><path d="M3 4h8l15 30-4 8zM18 4h8l8 16-4 8z" fill="#46e6f2"/><path d="m49 3-21 39h-8L41 3zM55 14 40 42h-8l15-28z" fill="#ff367e"/></svg>';
