// ============ Shared helpers ============

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = original; }, 1200);
  });
}

// ============ JSON Formatter ============
(function () {
  const input = document.getElementById('jsonInput');
  const output = document.getElementById('jsonOutput');
  const statusRow = document.getElementById('jsonStatus');
  const indentSelect = document.getElementById('jsonIndent');
  const formatBtn = document.getElementById('jsonFormatBtn');
  const minifyBtn = document.getElementById('jsonMinifyBtn');
  const copyBtn = document.getElementById('jsonCopyBtn');
  const clearBtn = document.getElementById('jsonClearBtn');
  if (!input || !output) return; // not on this page

  function setStatus(valid, message) {
    statusRow.innerHTML = `<span class="status-dot ${valid ? 'valid' : 'invalid'}"></span><span class="status-text ${valid ? 'valid' : 'invalid'}">${escapeHtml(message)}</span>`;
  }

  function run(mode) {
    const raw = input.value.trim();
    if (!raw) {
      output.textContent = '';
      statusRow.innerHTML = '';
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const indent = indentSelect.value === 'tab' ? '\t' : parseInt(indentSelect.value, 10);
      const text = mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
      output.textContent = text;
      setStatus(true, 'Valid JSON');
    } catch (err) {
      output.textContent = '';
      setStatus(false, err.message);
    }
  }

  formatBtn.addEventListener('click', () => run('format'));
  minifyBtn.addEventListener('click', () => run('minify'));
  copyBtn.addEventListener('click', () => copyToClipboard(output.textContent, copyBtn));
  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    statusRow.innerHTML = '';
    input.focus();
  });
})();

// ============ Base64 Encode/Decode ============
(function () {
  const input = document.getElementById('b64Input');
  const output = document.getElementById('b64Output');
  const statusRow = document.getElementById('b64Status');
  const encodeBtn = document.getElementById('b64EncodeBtn');
  const decodeBtn = document.getElementById('b64DecodeBtn');
  const copyBtn = document.getElementById('b64CopyBtn');
  const clearBtn = document.getElementById('b64ClearBtn');
  if (!input || !output) return;

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function setStatus(valid, message) {
    statusRow.innerHTML = message
      ? `<span class="status-dot ${valid ? 'valid' : 'invalid'}"></span><span class="status-text ${valid ? 'valid' : 'invalid'}">${escapeHtml(message)}</span>`
      : '';
  }

  encodeBtn.addEventListener('click', () => {
    try {
      output.textContent = utf8ToBase64(input.value);
      setStatus(true, 'Encoded');
    } catch (err) {
      output.textContent = '';
      setStatus(false, 'Could not encode this input');
    }
  });

  decodeBtn.addEventListener('click', () => {
    try {
      output.textContent = base64ToUtf8(input.value.trim());
      setStatus(true, 'Decoded');
    } catch (err) {
      output.textContent = '';
      setStatus(false, 'Not valid Base64');
    }
  });

  copyBtn.addEventListener('click', () => copyToClipboard(output.textContent, copyBtn));
  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    statusRow.innerHTML = '';
    input.focus();
  });
})();

// ============ Regex Tester ============
(function () {
  const patternInput = document.getElementById('regexPattern');
  const flagsInput = document.getElementById('regexFlags');
  const testInput = document.getElementById('regexTest');
  const output = document.getElementById('regexOutput');
  const statusRow = document.getElementById('regexStatus');
  const groupsBox = document.getElementById('regexGroups');
  if (!patternInput || !testInput) return;

  function setStatus(valid, message) {
    statusRow.innerHTML = `<span class="status-dot ${valid ? 'valid' : 'invalid'}"></span><span class="status-text ${valid ? 'valid' : 'invalid'}">${escapeHtml(message)}</span>`;
  }

  function run() {
    const patternStr = patternInput.value;
    const testStr = testInput.value;
    const rawFlags = flagsInput.value.replace(/[^gimsuy]/g, '');

    if (!patternStr) {
      output.innerHTML = escapeHtml(testStr);
      statusRow.innerHTML = '';
      groupsBox.innerHTML = '';
      return;
    }

    let regex;
    try {
      const scanFlags = rawFlags.includes('g') ? rawFlags : rawFlags + 'g';
      regex = new RegExp(patternStr, scanFlags);
    } catch (err) {
      output.innerHTML = escapeHtml(testStr);
      setStatus(false, err.message);
      groupsBox.innerHTML = '';
      return;
    }

    let match;
    let lastIndex = 0;
    let html = '';
    let count = 0;
    let firstGroups = null;
    let iterations = 0;

    while ((match = regex.exec(testStr)) !== null) {
      iterations++;
      if (iterations > 10000) break; // safety cap against pathological patterns
      count++;
      if (count === 1) firstGroups = match.slice(1);
      html += escapeHtml(testStr.slice(lastIndex, match.index));
      html += '<mark>' + escapeHtml(match[0]) + '</mark>';
      lastIndex = match.index + match[0].length;
      if (match[0].length === 0) {
        // zero-length match (e.g. patterns like x* or a*) — advance manually
        // or exec() will keep matching the same empty position forever.
        regex.lastIndex++;
      }
    }
    html += escapeHtml(testStr.slice(lastIndex));

    output.innerHTML = html || escapeHtml(testStr);
    setStatus(true, count + (count === 1 ? ' match' : ' matches'));

    if (firstGroups && firstGroups.length) {
      groupsBox.innerHTML = '<p class="field-label" style="margin:14px 0 6px;">First match groups</p>' +
        firstGroups.map((g, i) => `<div><code>$${i + 1}</code> = ${escapeHtml(g === undefined ? '(no match)' : g)}</div>`).join('');
    } else {
      groupsBox.innerHTML = '';
    }
  }

  let debounceTimer;
  [patternInput, flagsInput, testInput].forEach((el) => {
    el.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(run, 150);
    });
  });

  run();
})();

// ============ UUID Generator ============
(function () {
  const countInput = document.getElementById('uuidCount');
  const upperCheck = document.getElementById('uuidUpper');
  const noHyphenCheck = document.getElementById('uuidNoHyphen');
  const output = document.getElementById('uuidOutput');
  const generateBtn = document.getElementById('uuidGenerateBtn');
  const copyBtn = document.getElementById('uuidCopyBtn');
  if (!output || !generateBtn) return;

  function generateOne() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  generateBtn.addEventListener('click', () => {
    let count = parseInt(countInput.value, 10);
    if (!count || count < 1) count = 1;
    if (count > 100) count = 100;
    const list = [];
    for (let i = 0; i < count; i++) {
      let id = generateOne();
      if (upperCheck.checked) id = id.toUpperCase();
      if (noHyphenCheck.checked) id = id.replace(/-/g, '');
      list.push(id);
    }
    output.textContent = list.join('\n');
  });

  copyBtn.addEventListener('click', () => copyToClipboard(output.textContent, copyBtn));

  generateBtn.click(); // show one on load
})();

// ============ Hash Generator ============
(function () {
  const input = document.getElementById('hashInput');
  if (!input) return;

  const outputs = {
    'SHA-1': document.getElementById('hashOutputSHA1'),
    'SHA-256': document.getElementById('hashOutputSHA256'),
    'SHA-384': document.getElementById('hashOutputSHA384'),
    'SHA-512': document.getElementById('hashOutputSHA512'),
  };
  const clearBtn = document.getElementById('hashClearBtn');

  async function hashText(algo, text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest(algo, bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  let runToken = 0;
  async function run() {
    const text = input.value;
    const myToken = ++runToken; // guards against out-of-order async results on rapid typing
    if (!text) {
      Object.values(outputs).forEach((el) => { el.textContent = ''; });
      return;
    }
    for (const algo of Object.keys(outputs)) {
      const hex = await hashText(algo, text);
      if (myToken !== runToken) return; // a newer input has since superseded this run
      outputs[algo].textContent = hex;
    }
  }

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(run, 150);
  });

  ['SHA1', 'SHA256', 'SHA384', 'SHA512'].forEach((id) => {
    const btn = document.getElementById('hashCopy' + id);
    if (btn) btn.addEventListener('click', () => copyToClipboard(document.getElementById(btn.dataset.target).textContent, btn));
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    Object.values(outputs).forEach((el) => { el.textContent = ''; });
    input.focus();
  });
})();

// ============ JWT Decoder ============
(function () {
  const input = document.getElementById('jwtInput');
  if (!input) return;

  const statusRow = document.getElementById('jwtStatus');
  const headerOutput = document.getElementById('jwtHeaderOutput');
  const payloadOutput = document.getElementById('jwtPayloadOutput');
  const expNote = document.getElementById('jwtExpNote');

  function setStatus(valid, message) {
    statusRow.innerHTML = message
      ? `<span class="status-dot ${valid ? 'valid' : 'invalid'}"></span><span class="status-text ${valid ? 'valid' : 'invalid'}">${escapeHtml(message)}</span>`
      : '';
  }

  function base64UrlToUtf8(segment) {
    // JWT segments use base64url, not standard base64 — swap the alphabet and restore padding first.
    let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function run() {
    const token = input.value.trim();
    if (!token) {
      headerOutput.textContent = '';
      payloadOutput.textContent = '';
      expNote.textContent = '';
      statusRow.innerHTML = '';
      return;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      headerOutput.textContent = '';
      payloadOutput.textContent = '';
      expNote.textContent = '';
      setStatus(false, 'Not a valid JWT — expected three dot-separated parts (header.payload.signature)');
      return;
    }

    let header, payload;
    try {
      header = JSON.parse(base64UrlToUtf8(parts[0]));
    } catch (err) {
      headerOutput.textContent = '';
      payloadOutput.textContent = '';
      expNote.textContent = '';
      setStatus(false, 'Could not decode header: ' + err.message);
      return;
    }
    try {
      payload = JSON.parse(base64UrlToUtf8(parts[1]));
    } catch (err) {
      headerOutput.textContent = JSON.stringify(header, null, 2);
      payloadOutput.textContent = '';
      expNote.textContent = '';
      setStatus(false, 'Header decoded, but payload failed: ' + err.message);
      return;
    }

    headerOutput.textContent = JSON.stringify(header, null, 2);
    payloadOutput.textContent = JSON.stringify(payload, null, 2);
    setStatus(true, 'Decoded');

    if (typeof payload.exp === 'number') {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      const expired = expDate.getTime() < now.getTime();
      expNote.textContent = `exp: ${expDate.toString()} — ${expired ? 'expired' : 'not yet expired'}`;
    } else {
      expNote.textContent = '';
    }
  }

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(run, 150);
  });
})();

// ============ Case Converter ============
(function () {
  const input = document.getElementById('caseInput');
  if (!input) return;

  const output = document.getElementById('caseOutput');
  const copyBtn = document.getElementById('caseCopyBtn');
  const clearBtn = document.getElementById('caseClearBtn');

  function toWords(str) {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // split camelCase boundaries
      .replace(/[_\-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.toLowerCase());
  }

  function capitalize(w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  function convert(mode) {
    const raw = input.value;
    if (!raw.trim()) {
      output.textContent = '';
      return;
    }
    const words = toWords(raw);
    let result;
    switch (mode) {
      case 'upper': result = raw.toUpperCase(); break;
      case 'lower': result = raw.toLowerCase(); break;
      case 'title': result = words.map(capitalize).join(' '); break;
      case 'camel': result = words.map((w, i) => (i === 0 ? w : capitalize(w))).join(''); break;
      case 'snake': result = words.join('_'); break;
      case 'kebab': result = words.join('-'); break;
      default: result = raw;
    }
    output.textContent = result;
  }

  document.getElementById('caseUpperBtn').addEventListener('click', () => convert('upper'));
  document.getElementById('caseLowerBtn').addEventListener('click', () => convert('lower'));
  document.getElementById('caseTitleBtn').addEventListener('click', () => convert('title'));
  document.getElementById('caseCamelBtn').addEventListener('click', () => convert('camel'));
  document.getElementById('caseSnakeBtn').addEventListener('click', () => convert('snake'));
  document.getElementById('caseKebabBtn').addEventListener('click', () => convert('kebab'));

  copyBtn.addEventListener('click', () => copyToClipboard(output.textContent, copyBtn));
  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    input.focus();
  });

  convert('title'); // show a result on load matching the pre-filled example
})();

// ============ URL Encode/Decode ============
(function () {
  const input = document.getElementById('urlInput');
  if (!input) return;

  const output = document.getElementById('urlOutput');
  const statusRow = document.getElementById('urlStatus');
  const encodeBtn = document.getElementById('urlEncodeBtn');
  const decodeBtn = document.getElementById('urlDecodeBtn');
  const copyBtn = document.getElementById('urlCopyBtn');
  const clearBtn = document.getElementById('urlClearBtn');

  function setStatus(valid, message) {
    statusRow.innerHTML = message
      ? `<span class="status-dot ${valid ? 'valid' : 'invalid'}"></span><span class="status-text ${valid ? 'valid' : 'invalid'}">${escapeHtml(message)}</span>`
      : '';
  }

  encodeBtn.addEventListener('click', () => {
    try {
      output.textContent = encodeURIComponent(input.value);
      setStatus(true, 'Encoded');
    } catch (err) {
      output.textContent = '';
      setStatus(false, 'Could not encode this input');
    }
  });

  decodeBtn.addEventListener('click', () => {
    try {
      output.textContent = decodeURIComponent(input.value);
      setStatus(true, 'Decoded');
    } catch (err) {
      output.textContent = '';
      setStatus(false, 'Not validly encoded — contains a malformed % sequence');
    }
  });

  copyBtn.addEventListener('click', () => copyToClipboard(output.textContent, copyBtn));
  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    statusRow.innerHTML = '';
    input.focus();
  });
})();

// ============ Lorem Ipsum Generator ============
(function () {
  const countInput = document.getElementById('loremCount');
  if (!countInput) return;

  const unitSelect = document.getElementById('loremUnit');
  const startClassicCheck = document.getElementById('loremStartClassic');
  const output = document.getElementById('loremOutput');
  const generateBtn = document.getElementById('loremGenerateBtn');
  const copyBtn = document.getElementById('loremCopyBtn');

  const WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore ' +
    'et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea ' +
    'commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur ' +
    'excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum ' +
    'at vero accusamus iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque corrupti ' +
    'quos quas molestias excepturi sint occaecati cupiditate provident similique mollitia animi').split(' ');

  function randomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function makeSentence(wordCount) {
    const n = wordCount || 6 + Math.floor(Math.random() * 10);
    const words = [];
    for (let i = 0; i < n; i++) words.push(randomWord());
    let sentence = words.join(' ');
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
    return sentence;
  }

  function makeParagraph() {
    const sentenceCount = 4 + Math.floor(Math.random() * 3);
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) sentences.push(makeSentence());
    return sentences.join(' ');
  }

  function generate() {
    let count = parseInt(countInput.value, 10);
    if (!count || count < 1) count = 1;
    if (count > 50) count = 50;
    const unit = unitSelect.value;
    const classic = startClassicCheck.checked;
    let result = '';

    if (unit === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) words.push(randomWord());
      if (classic) {
        const classicWords = 'lorem ipsum dolor sit amet'.split(' ');
        for (let i = 0; i < Math.min(count, classicWords.length); i++) words[i] = classicWords[i];
      }
      result = words.join(' ');
      result = result.charAt(0).toUpperCase() + result.slice(1) + '.';
    } else if (unit === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) sentences.push(makeSentence());
      if (classic) sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      result = sentences.join(' ');
    } else {
      const paragraphs = [];
      for (let i = 0; i < count; i++) paragraphs.push(makeParagraph());
      if (classic) {
        paragraphs[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
          paragraphs[0].split('. ').slice(1).join('. ');
      }
      result = paragraphs.join('\n\n');
    }

    output.textContent = result;
  }

  generateBtn.addEventListener('click', generate);
  copyBtn.addEventListener('click', () => copyToClipboard(output.textContent, copyBtn));

  generate(); // show output on load
})();

// ============ Cron Expression Explainer ============
(function () {
  const input = document.getElementById('cronInput');
  if (!input) return;

  const output = document.getElementById('cronOutput');
  const statusRow = document.getElementById('cronStatus');
  const explainBtn = document.getElementById('cronExplainBtn');

  // Index 0 = January. Cron's month field is 1-indexed (1 = January), so every
  // lookup below subtracts 1 before indexing this array — e.g. field value 1 -> MONTHS[0].
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // Index 0 = Sunday. Cron allows both 0 and 7 for Sunday; field value 7 is normalized to 0 before indexing.
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function setStatus(valid, message) {
    statusRow.innerHTML = message
      ? `<span class="status-dot ${valid ? 'valid' : 'invalid'}"></span><span class="status-text ${valid ? 'valid' : 'invalid'}">${escapeHtml(message)}</span>`
      : '';
  }

  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // Parses one cron field into a sorted array of concrete integer values within [min, max].
  // Supports: *  */step  a-b  a-b/step  a,b,c  and any comma-combination of the above.
  function parseField(field, min, max) {
    const values = new Set();
    for (const part of field.split(',')) {
      const stepMatch = part.match(/^(.+)\/(\d+)$/);
      const base = stepMatch ? stepMatch[1] : part;
      const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;
      if (!step || step < 1) throw new Error(`invalid step in "${part}"`);

      let rangeStart, rangeEnd;
      if (base === '*') {
        rangeStart = min; rangeEnd = max;
      } else if (base.includes('-')) {
        const [a, b] = base.split('-').map((n) => parseInt(n, 10));
        if (Number.isNaN(a) || Number.isNaN(b)) throw new Error(`invalid range "${base}"`);
        rangeStart = a; rangeEnd = b;
      } else {
        const n = parseInt(base, 10);
        if (Number.isNaN(n)) throw new Error(`invalid value "${base}"`);
        rangeStart = n; rangeEnd = n;
      }
      if (rangeStart < min || rangeEnd > max || rangeStart > rangeEnd) {
        throw new Error(`"${part}" out of range (expected ${min}-${max})`);
      }
      for (let v = rangeStart; v <= rangeEnd; v += step) values.add(v);
    }
    return Array.from(values).sort((a, b) => a - b);
  }

  function describeList(values, formatter) {
    const parts = values.map(formatter);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] + ' and ' + parts[1];
    return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function explain(expr) {
    const fields = expr.trim().split(/\s+/);
    if (fields.length !== 5) {
      throw new Error(`expected 5 fields (minute hour day month weekday), got ${fields.length}`);
    }
    const [minField, hourField, domField, monthField, dowField] = fields;

    const minutes = parseField(minField, 0, 59);
    const hours = parseField(hourField, 0, 23);
    const doms = parseField(domField, 1, 31);
    // Month field is 1-indexed in cron syntax (1 = January); parseField keeps it 1-indexed too.
    const months = parseField(monthField, 1, 12);
    // Day-of-week accepts 0-7 (both 0 and 7 mean Sunday); normalize 7 -> 0 after parsing so lookups stay 0-6.
    const dowsRaw = parseField(dowField, 0, 7);
    const dows = Array.from(new Set(dowsRaw.map((d) => (d === 7 ? 0 : d)))).sort((a, b) => a - b);

    const everyMinute = minField === '*';
    const everyHour = hourField === '*';
    const everyDom = domField === '*';
    const everyMonth = monthField === '*';
    const everyDow = dowField === '*';

    // Time-of-day phrase
    let timePhrase;
    if (everyMinute && everyHour) {
      timePhrase = 'every minute';
    } else if (everyMinute) {
      timePhrase = `every minute during hour ${describeList(hours, (h) => pad2(h) + ':00')}`;
    } else if (everyHour) {
      timePhrase = minutes.length === 1 && minutes[0] === 0
        ? 'at the top of every hour'
        : `at minute ${describeList(minutes, String)} of every hour`;
    } else {
      // specific minute(s) and specific hour(s): build HH:MM combinations
      const times = [];
      for (const h of hours) for (const m of minutes) times.push(`${pad2(h)}:${pad2(m)}`);
      timePhrase = times.length === 1 ? `at ${times[0]}` : `at ${describeList(times, String)}`;
    }

    // Date phrase
    let datePhrase;
    const domPhrase = everyDom ? null : `the ${describeList(doms, ordinal)}`;
    const dowPhrase = everyDow ? null : `on ${describeList(dows, (d) => DAYS[d])}`;
    const monthPhrase = everyMonth ? null : `in ${describeList(months, (m) => MONTHS[m - 1])}`;

    const dateParts = [];
    if (domPhrase && dowPhrase) {
      // cron treats day-of-month and day-of-week as OR'd when both are restricted
      dateParts.push(`${domPhrase} of the month, or ${dowPhrase}`);
    } else if (domPhrase) {
      dateParts.push(`${domPhrase} of the month`);
    } else if (dowPhrase) {
      dateParts.push(dowPhrase);
    } else {
      dateParts.push('every day');
    }
    if (monthPhrase) dateParts.push(monthPhrase);

    return `Runs ${timePhrase}, ${dateParts.join(', ')}.`;
  }

  function run() {
    const expr = input.value;
    if (!expr.trim()) {
      output.textContent = '';
      statusRow.innerHTML = '';
      return;
    }
    try {
      const description = explain(expr);
      output.textContent = description;
      setStatus(true, 'Valid cron expression');
    } catch (err) {
      output.textContent = '';
      setStatus(false, err.message);
    }
  }

  explainBtn.addEventListener('click', run);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });

  run(); // show a result on load for the pre-filled example
})();
