const frame = document.querySelector('#emulator');
const bootNote = document.querySelector('#boot-note');
const status = document.querySelector('#status');
const screenFrame = document.querySelector('.screen-frame');

function resizeScreenInteger() {
  const baseWidth = 176;
  const baseHeight = 220;
  const availableWidth = Math.max(baseWidth, Math.min(528, window.innerWidth - 64));
  const scale = Math.max(1, Math.min(3, Math.floor(availableWidth / baseWidth)));
  screenFrame.style.width = `${baseWidth * scale}px`;
  screenFrame.style.height = `${baseHeight * scale}px`;
  screenFrame.dataset.scale = `${scale}x`;
}

resizeScreenInteger();
window.addEventListener('resize', resizeScreenInteger);

function emulatorTarget() {
  const doc = frame.contentDocument;
  return doc?.querySelector('#display') || doc?.body;
}

function sendKey(code, type) {
  const target = emulatorTarget();
  if (!target) return;
  target.focus();
  const keyMap = {
    ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
    Enter: 'Enter', F1: 'F1', F2: 'F2'
  };
  target.dispatchEvent(new KeyboardEvent(type, { code, key: keyMap[code], bubbles: true }));
}

document.querySelectorAll('[data-code]').forEach((button) => {
  const press = (event) => {
    event.preventDefault();
    button.classList.add('active');
    sendKey(button.dataset.code, 'keydown');
  };
  const release = (event) => {
    event.preventDefault();
    button.classList.remove('active');
    sendKey(button.dataset.code, 'keyup');
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', (event) => {
    if (button.classList.contains('active')) release(event);
  });
});

frame.addEventListener('load', () => {
  status.textContent = 'Laufzeit geladen. Klicke einmal in den Bildschirm, um Audio und Steuerung zu aktivieren.';
  setTimeout(() => { bootNote.hidden = true; }, 2500);
});

document.querySelector('#restart').addEventListener('click', () => {
  bootNote.hidden = false;
  frame.contentWindow.location.reload();
});

document.querySelector('#fullscreen').addEventListener('click', () => {
  document.querySelector('.screen-frame').requestFullscreen?.();
});
