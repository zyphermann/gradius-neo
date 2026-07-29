export const enum GameAction {
  None = 0,
  Up = 1,
  Left = 2,
  Right = 5,
  Down = 6,
  Fire = 8,
}

const keyToAction = new Map<string, GameAction>([
  ['ArrowUp', GameAction.Up],
  ['ArrowLeft', GameAction.Left],
  ['ArrowRight', GameAction.Right],
  ['ArrowDown', GameAction.Down],
  ['Enter', GameAction.Fire],
  ['Space', GameAction.Fire],
  ['Numpad5', GameAction.Fire],
]);

export class InputState {
  readonly pressedCodes = new Set<string>();
  private readonly onChange?: (pressed: ReadonlySet<string>) => void;

  constructor(target: HTMLElement, onChange?: (pressed: ReadonlySet<string>) => void) {
    this.onChange = onChange;
    target.addEventListener('keydown', (event) => this.handleKey(event, true));
    target.addEventListener('keyup', (event) => this.handleKey(event, false));
    target.addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clear();
    });
  }

  getGameAction(code: string): GameAction {
    return keyToAction.get(code) ?? GameAction.None;
  }

  isPressed(code: string): boolean {
    return this.pressedCodes.has(code);
  }

  clear(): void {
    if (this.pressedCodes.size === 0) return;
    this.pressedCodes.clear();
    this.onChange?.(this.pressedCodes);
  }

  private handleKey(event: KeyboardEvent, pressed: boolean): void {
    if (keyToAction.has(event.code) || /^Digit[0-9]$/.test(event.code) || event.code === 'F1' || event.code === 'F2') {
      event.preventDefault();
    }

    if (pressed) this.pressedCodes.add(event.code);
    else this.pressedCodes.delete(event.code);
    this.onChange?.(this.pressedCodes);
  }
}
