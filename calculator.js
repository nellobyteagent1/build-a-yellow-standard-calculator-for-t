(() => {
  'use strict';

  const $expr = document.getElementById('expression');
  const $curr = document.getElementById('current');

  let current = '0';
  let expression = '';
  let prevOperand = null;
  let operator = null;
  let resetNext = false;

  const MAX_DIGITS = 15;

  function formatDisplay(val) {
    if (val === 'Error') return val;
    const num = parseFloat(val);
    if (isNaN(num)) return '0';
    // If it has a trailing dot or trailing zeros after dot during input, keep as-is
    if (val.includes('.') && (val.endsWith('.') || /\.\d*0+$/.test(val))) {
      return val;
    }
    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-8 && num !== 0)) {
      return num.toExponential(6);
    }
    return String(num);
  }

  function updateDisplay() {
    const display = formatDisplay(current);
    $curr.textContent = display;
    $expr.textContent = expression;

    // Shrink text for long numbers
    $curr.classList.remove('shrink', 'shrink-more');
    if (display.length > 12) {
      $curr.classList.add('shrink-more');
    } else if (display.length > 8) {
      $curr.classList.add('shrink');
    }
  }

  function compute(a, op, b) {
    const x = parseFloat(a);
    const y = parseFloat(b);
    if (isNaN(x) || isNaN(y)) return 'Error';
    switch (op) {
      case '+': return x + y;
      case '−': return x - y;
      case '×': return x * y;
      case '÷': return y === 0 ? 'Error' : x / y;
      default: return y;
    }
  }

  function inputDigit(d) {
    if (resetNext) {
      current = d;
      resetNext = false;
    } else if (current === '0' && d !== '0') {
      current = d;
    } else if (current === '0' && d === '0') {
      return; // prevent leading zeros
    } else {
      if (current.replace(/[^0-9]/g, '').length >= MAX_DIGITS) return;
      current += d;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (resetNext) {
      current = '0.';
      resetNext = false;
      updateDisplay();
      return;
    }
    if (!current.includes('.')) {
      current += '.';
      updateDisplay();
    }
  }

  function inputOperator(op) {
    clearActiveOp();
    const val = parseFloat(current);
    if (prevOperand === null) {
      prevOperand = val;
    } else if (!resetNext) {
      const result = compute(prevOperand, operator, val);
      if (result === 'Error') {
        current = 'Error';
        expression = '';
        prevOperand = null;
        operator = null;
        resetNext = true;
        updateDisplay();
        return;
      }
      prevOperand = result;
      current = String(result);
    }
    operator = op;
    expression = formatDisplay(String(prevOperand)) + ' ' + op;
    resetNext = true;
    updateDisplay();
    highlightActiveOp(op);
  }

  function calculate() {
    if (operator === null || prevOperand === null) return;
    clearActiveOp();
    const val = parseFloat(current);
    const result = compute(prevOperand, operator, val);
    expression = formatDisplay(String(prevOperand)) + ' ' + operator + ' ' + formatDisplay(current) + ' =';
    if (result === 'Error') {
      current = 'Error';
    } else {
      current = String(result);
    }
    prevOperand = null;
    operator = null;
    resetNext = true;
    updateDisplay();
  }

  function clearAll() {
    current = '0';
    expression = '';
    prevOperand = null;
    operator = null;
    resetNext = false;
    clearActiveOp();
    updateDisplay();
  }

  function backspace() {
    if (resetNext || current === 'Error') {
      clearAll();
      return;
    }
    current = current.length > 1 ? current.slice(0, -1) : '0';
    updateDisplay();
  }

  function percent() {
    const val = parseFloat(current);
    if (isNaN(val)) return;
    current = String(val / 100);
    updateDisplay();
  }

  function highlightActiveOp(op) {
    document.querySelectorAll('.key--op').forEach(btn => {
      if (btn.dataset.value === op) btn.classList.add('active');
    });
  }

  function clearActiveOp() {
    document.querySelectorAll('.key--op').forEach(btn => btn.classList.remove('active'));
  }

  // Ripple effect
  function createRipple(btn, x, y) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (x - rect.left - size / 2) + 'px';
    ripple.style.top = (y - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  // Click handler
  document.querySelector('.keys').addEventListener('click', e => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    createRipple(btn, e.clientX, e.clientY);
    handleAction(btn.dataset.action, btn.dataset.value);
  });

  function handleAction(action, value) {
    switch (action) {
      case 'digit': inputDigit(value); break;
      case 'decimal': inputDecimal(); break;
      case 'operator': inputOperator(value); break;
      case 'equals': calculate(); break;
      case 'clear': clearAll(); break;
      case 'backspace': backspace(); break;
      case 'percent': percent(); break;
    }
  }

  // Keyboard support
  const keyMap = {
    '0': ['digit', '0'], '1': ['digit', '1'], '2': ['digit', '2'],
    '3': ['digit', '3'], '4': ['digit', '4'], '5': ['digit', '5'],
    '6': ['digit', '6'], '7': ['digit', '7'], '8': ['digit', '8'],
    '9': ['digit', '9'], '.': ['decimal'], ',': ['decimal'],
    '+': ['operator', '+'], '-': ['operator', '−'],
    '*': ['operator', '×'], '/': ['operator', '÷'],
    'x': ['operator', '×'], 'X': ['operator', '×'],
    'Enter': ['equals'], '=': ['equals'],
    'Escape': ['clear'], 'c': ['clear'], 'C': ['clear'],
    'Backspace': ['backspace'], 'Delete': ['backspace'],
    '%': ['percent'],
  };

  document.addEventListener('keydown', e => {
    const mapping = keyMap[e.key];
    if (!mapping) return;
    e.preventDefault();
    handleAction(mapping[0], mapping[1]);

    // Visual feedback for keyboard press
    const selector = mapping[0] === 'digit'
      ? `.key[data-value="${mapping[1]}"][data-action="digit"]`
      : mapping[0] === 'operator'
        ? `.key[data-value="${mapping[1]}"]`
        : `.key[data-action="${mapping[0]}"]`;
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('pressed');
      const center = btn.getBoundingClientRect();
      createRipple(btn, center.left + center.width / 2, center.top + center.height / 2);
      setTimeout(() => btn.classList.remove('pressed'), 120);
    }
  });

  updateDisplay();
})();
