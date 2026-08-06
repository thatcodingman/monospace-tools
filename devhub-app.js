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
