const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeElement {
  constructor() {
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.listeners = new Map();
    this._classes = new Set();
    this.classList = { add: name => this._classes.add(name) };
    this.offsetWidth = 10;
    this.value = '';
    this.textContent = '';
    this._innerHTML = '';
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === '') this.children = [];
  }

  get innerHTML() { return this._innerHTML; }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  dispatch(type, event = {}) {
    for (const handler of this.listeners.get(type) || []) handler(event);
  }
  focus() {}
  getBoundingClientRect() { return { left: 0 }; }
}

function loadApp() {
  const ids = ['logo', 'editModal', 'editInput', 'submitEdit', 'editBtn', 'refreshBtn'];
  const elements = Object.fromEntries(ids.map(id => [id, new FakeElement()]));
  let nextTimerId = 1;
  const activeTimers = new Set();

  const document = {
    getElementById(id) { return elements[id]; },
    createElement() { return new FakeElement(); },
    addEventListener() {},
    querySelectorAll(selector) {
      if (selector !== '.char') return [];
      const chars = [];
      const visit = node => {
        for (const child of node.children) {
          if (child._classes.has('char')) chars.push(child);
          visit(child);
        }
      };
      visit(elements.logo);
      return chars;
    }
  };

  const context = {
    document,
    window: { location: { href: 'http://localhost/' } },
    setInterval() {
      const id = nextTimerId++;
      activeTimers.add(id);
      return id;
    },
    clearInterval(id) { activeTimers.delete(id); },
    Math
  };

  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  vm.runInContext(source, context);
  return { context, elements, activeTimers };
}

test('renderLogo clears timers attached to the previous characters', () => {
  const { context, elements, activeTimers } = loadApp();
  context.renderLogo('OLD TEXT');
  const oldChar = elements.logo.children[0].children[0];
  context.startRandomizing(oldChar);
  assert.equal(activeTimers.size, 1);

  context.renderLogo('NEW TEXT');

  assert.equal(activeTimers.size, 0);
  assert.equal(vm.runInContext('intervals.size', context), 0);
});

test('pressing Enter applies edited text and closes the modal', () => {
  const { elements, context } = loadApp();
  elements.editBtn.dispatch('click');
  elements.editInput.value = 'TypeGraph';
  elements.editInput.dispatch('keydown', { key: 'Enter', preventDefault() {} });

  assert.equal(elements.editModal.style.display, 'none');
  assert.equal(vm.runInContext('userText', context), 'TypeGraph');
  assert.equal(elements.logo.children.length, 1);
});

test('pressing Escape closes the editor without replacing the current text', () => {
  const { elements, context } = loadApp();
  vm.runInContext("userText = 'Keep this'", context);
  context.renderLogo('Keep this');
  elements.editBtn.dispatch('click');
  elements.editInput.value = 'Discard this';
  elements.editInput.dispatch('keydown', { key: 'Escape' });

  assert.equal(elements.editModal.style.display, 'none');
  assert.equal(vm.runInContext('userText', context), 'Keep this');
  assert.equal(elements.logo.children.length, 3);
});
