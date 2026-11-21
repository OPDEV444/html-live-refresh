import { route, garden } from './world.js';
import { icon, insignia } from './icons.js';
import portrait from './assets/zero-two.webp';

const $ = id => document.getElementById(id);
const entries = ['Bag', 'Party', 'Map', 'Save', 'Settings', 'Quit'];
const intro = 'Heh… So this is Verdant Vale? Not bad at all.';
const speeds = { Standard: 32, Fast: 12, Instant: 0 };

export function createHud(state, game) {
  document.querySelector('[data-insignia]').innerHTML = insignia;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  document.querySelector('.pilot-art').src = portrait;
  $('comms-face').src = portrait;
  $('location-name').textContent = garden.name;
  $('archive').innerHTML = route.map(([id, name], i) =>
    '<div class="route-row ' + (id === garden.id ? 'current' : '') + '"><span class="archive-index">' +
    String(i + 1).padStart(2, '0') + '</span>' + name + '</div>').join('');

  let mode = 'field';

  let selected = 0;
  let arrivalTimer;
  let typingTimer;
  let pages = [];
  let page = 0;
  let typed = 0;
  let afterDialogue;

  function banner() {
    clearTimeout(arrivalTimer);
    $('arrival').textContent = 'Entered ' + garden.name;
    $('arrival').hidden = false;
    arrivalTimer = setTimeout(() => { $('arrival').hidden = true; }, 2100);
  }
  function changeMode(next) {
    mode = next;
    game.release();
    const paused = mode === 'menu' || mode === 'detail' || mode === 'title';
    $('console').classList.toggle('command', paused);
    $('archive').hidden = paused;
    $('menu-panel').hidden = mode !== 'menu';
    $('detail').hidden = mode !== 'detail' && mode !== 'title';
    $('map-view').hidden = true;
    $('state').textContent = mode === 'title' ? 'Standby' : paused ? 'Paused' : mode === 'dialogue' ? 'Dialogue' : 'Exploration';
    $('field-status').textContent = paused ? 'FEED PAUSED' : 'LIVE FEED';
    $('talk').disabled = paused;
    $('menu-toggle').disabled = mode === 'title';
    $('menu-toggle').setAttribute('aria-expanded', String(paused));
    $('talk-label').textContent = mode === 'dialogue' ? 'Continue' : 'Interact';
    if (!paused) $('console-title').textContent = 'Location archive';
  }
  function ambient() {
    $('speaker').textContent = 'Zero Two';
    $('speech').textContent = intro;
    $('comms-face').src = portrait;
  }
  function stopText() { clearInterval(typingTimer); }
  function displayLine() {
    stopText();
    const line = pages[page];
    $('speaker').textContent = line.speaker || 'Zero Two';
    $('comms-face').src = line.portrait || portrait;
    typed = 0;
    $('speech').textContent = '';
    const delay = speeds[state.textSpeed];
    const reveal = () => {
      typed = delay ? typed + 1 : line.text.length;
      $('speech').textContent = line.text.slice(0, typed);
      if (typed >= line.text.length) stopText();
    };
    reveal();
    if (typed < line.text.length) typingTimer = setInterval(reveal, delay);
  }
  function talk(lines, onComplete) {
    if (mode !== 'field') return;
    pages = lines;
    page = 0;
    afterDialogue = onComplete;
    changeMode('dialogue');
    displayLine();
  }
  function endDialogue(complete) {
    stopText();
    if (complete) afterDialogue?.();
    afterDialogue = null;
    changeMode('field');
    ambient();
  }
  function confirmTalk() {
    if (mode === 'field') { game.interact(); return; }
    if (mode !== 'dialogue') return;
    const line = pages[page].text;
    if (typed < line.length) {
      stopText(); typed = line.length; $('speech').textContent = line; return;
    }
    if (++page < pages.length) displayLine();
    else endDialogue(true);
  }
  function menu() {
    changeMode('menu');
    $('console-title').textContent = 'Pause menu';
    $('menu-panel').querySelectorAll('button')[selected].focus();
  }
  function action(label, handler, secondary = false) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = secondary ? 'action secondary' : 'action';
    el.textContent = label;
    el.addEventListener('click', handler);
    $('detail').append(el);
    return el;
  }
  function detailText(title, text) {
    $('detail').replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = title;
    const p = document.createElement('p');
    p.textContent = text;
    p.setAttribute('role', 'status');
    $('detail').append(heading, p);
    return p;
  }
  function title() {
    changeMode('title');
    $('console-title').textContent = 'Verdant Vale';
    const note = detailText('Field session closed', 'Start in The Garden or restore your last local save.');
    action('Load saved game', () => {
      if (restore(note)) resume();
    }).focus();
    action('Start new session', () => { game.reset(); resume(); banner(); }, true);
  }
  function restore(note) {
    try {
      if (!game.load()) { note.textContent = 'No local save found.'; return false; }
      note.textContent = 'Saved position and field data restored.';
      return true;
    } catch { note.textContent = 'Could not read the local save.'; return false; }
  }
  function detail(name) {
    changeMode('detail'); $('console-title').textContent = name;
    if (name === 'Bag') {
      detailText(state.hasPass ? 'Garden field pass × 1' : 'Your bag is empty',
        state.hasPass ? 'A route record issued by the Garden relay.' : 'Check the field relay near your starting position.');
    } else if (name === 'Party') {
      detailText('Zero Two', 'Pilot 002 · Party leader. Currently exploring The Garden.');
    } else if (name === 'Map') {
      detailText(garden.name, 'Area 01 · Your position on the meadow survey.');
      $('map-view').hidden = false;
    } else if (name === 'Save') {
      const note = detailText('Local save slot', 'Store your tile, facing, bag and text speed in this browser.');
      action('Save current game', () => {
        try { game.save(); note.textContent = 'Game saved in this browser.'; }
        catch { note.textContent = 'Could not write the local save.'; }
      });
      action('Load saved game', () => restore(note), true);
    } else if (name === 'Settings') {
      detailText('Dialogue playback', 'Choose how quickly dialogue appears.');
      const speed = action('Text speed · ' + state.textSpeed, () => {
        const options = Object.keys(speeds);
        state.textSpeed = options[(options.indexOf(state.textSpeed) + 1) % options.length];
        speed.textContent = 'Text speed · ' + state.textSpeed;
      });
    } else if (name === 'Quit') {
      detailText('Leave the field?', 'Return to the title screen. Progress since your last save will be lost.');
      action('Return to title', title);
    }
    action('Back to menu', menu, true);
    $('detail').querySelector('button').focus();
  }
  function resume() {
    changeMode('field'); ambient(); $('menu-toggle').focus({ preventScroll:true });
  }
  function toggle() {
    if (mode === 'title') return;
    if (mode === 'dialogue') endDialogue(false);
    if (mode === 'field') menu(); else resume();
  }
  $('menu-panel').innerHTML = entries.map(name => '<button class="menu-entry">' + icon(name.toLowerCase()) +
    name + '<span aria-hidden="true">›</span></button>').join('');
  $('menu-panel').querySelectorAll('button').forEach((b,i) => {
    b.addEventListener('focus', () => { selected = i; });
    b.addEventListener('click', () => { selected = i; detail(entries[i]); });
  });
  $('talk').addEventListener('click', confirmTalk);
  $('menu-toggle').addEventListener('click', toggle);

  function key(k, shift) {
    if (k === 'escape') { if (mode === 'detail') menu(); else toggle(); return true; }
    if (mode === 'field') { if (k === 'z') { confirmTalk(); return true; } return false; }
    if (mode === 'dialogue') {
      if (k === 'z' || k === 'enter') confirmTalk();
      if (k === 'x') endDialogue(false);
      return true;
    }
    if (k === 'x') {
      if (mode === 'detail') menu();
      else if (mode === 'menu') resume();
      return true;
    }
    const group = mode === 'menu' ? $('menu-panel') : $('detail');
    const buttons = [...group.querySelectorAll('button')];
    const index = Math.max(0, buttons.indexOf(document.activeElement));
    if (k === 'z' || k === 'enter' || k === ' ') buttons[index]?.click();
    const prev = ['w','arrowup'].includes(k) || (k === 'tab' && shift);
    if (prev || ['s','arrowdown','tab'].includes(k)) buttons[(index + (prev ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    return true;
  }
  ambient(); banner();
  return { key, talk, get mode() { return mode; } };
}
