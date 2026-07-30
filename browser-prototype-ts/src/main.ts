import './style.css';
import { Graphics } from './j2me/lcdui/Graphics';
import { Image as J2MEImage } from './j2me/lcdui/Image';
import { applyIntegerScale, calculateIntegerScale, LOGICAL_HEIGHT, LOGICAL_WIDTH } from './runtime/integer-scale';
import { ResourceManager } from './runtime/resources';

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required UI element is missing: ${selector}`);
  return element;
}

const canvas = requireElement<HTMLCanvasElement>('#game');
const shell = requireElement<HTMLElement>('.display-shell');
const scaleLabel = requireElement<HTMLElement>('#scale');
const inputLabel = requireElement<HTMLElement>('#input');
const maybeContext = canvas.getContext('2d', { alpha: false });
if (!maybeContext) throw new Error('Canvas 2D is unavailable');
const context: CanvasRenderingContext2D = maybeContext;
context.imageSmoothingEnabled = false;
const graphics = new Graphics(context, LOGICAL_WIDTH, LOGICAL_HEIGHT);

function resize(): void {
  const scale = calculateIntegerScale(window.innerWidth, window.innerHeight);
  applyIntegerScale(shell, scale);
  scaleLabel.textContent = `${scale}×`;
}

function drawFoundationScreen(): void {
  context.fillStyle = '#03060c';
  context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  context.strokeStyle = '#112b4c';
  context.lineWidth = 1;
  for (let x = 0; x < LOGICAL_WIDTH; x += 16) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, LOGICAL_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y < LOGICAL_HEIGHT; y += 16) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(LOGICAL_WIDTH, y + 0.5);
    context.stroke();
  }

  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.font = 'bold 12px monospace';
  context.fillStyle = '#f2f7ff';
  context.fillText('GRADIUS NEO', LOGICAL_WIDTH / 2, 78);
  context.font = '8px monospace';
  context.fillStyle = '#77c9ff';
  context.fillText('TYPESCRIPT PORT', LOGICAL_WIDTH / 2, 96);
  context.fillStyle = '#7f94aa';
  context.fillText('CANVAS 176 x 220 READY', LOGICAL_WIDTH / 2, 122);
  context.fillText('PRESS ARROW KEYS', LOGICAL_WIDTH / 2, 138);
}

async function preloadResources(): Promise<void> {
  const resources = new ResourceManager();
  inputLabel.textContent = 'Loading resources …';
  await resources.preloadAll((loaded, total) => {
    inputLabel.textContent = `Resources: ${loaded}/${total}`;
  });
  await J2MEImage.preloadResources(resources);
  inputLabel.textContent = 'Starting Gradius Neo …';
  const { DirectGameRunner } = await import('./game/direct/DirectGameRunner');
  const runner = new DirectGameRunner(canvas, graphics, resources, (error) => {
    inputLabel.textContent = `Direct error: ${error instanceof Error ? error.message : String(error)}`;
  });
  runner.start();
  inputLabel.textContent = `Direct port · ${resources.list().length} resources`;
}

window.addEventListener('resize', resize);
canvas.addEventListener('pointerdown', () => canvas.focus());

resize();
drawFoundationScreen();
canvas.focus();

void preloadResources().catch((error: unknown) => {
  inputLabel.textContent = `Resource error: ${error instanceof Error ? error.message : String(error)}`;
  console.error(error);
});
