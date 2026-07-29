export const LOGICAL_WIDTH = 176;
export const LOGICAL_HEIGHT = 220;

export interface IntegerScaleOptions {
  maxScale?: number;
  horizontalMargin?: number;
  verticalReserve?: number;
}

export function calculateIntegerScale(
  viewportWidth: number,
  viewportHeight: number,
  options: IntegerScaleOptions = {},
): number {
  const maxScale = options.maxScale ?? 6;
  const availableWidth = Math.max(LOGICAL_WIDTH, viewportWidth - (options.horizontalMargin ?? 48));
  const availableHeight = Math.max(LOGICAL_HEIGHT, viewportHeight - (options.verticalReserve ?? 150));

  return Math.max(
    1,
    Math.min(
      maxScale,
      Math.floor(availableWidth / LOGICAL_WIDTH),
      Math.floor(availableHeight / LOGICAL_HEIGHT),
    ),
  );
}

export function applyIntegerScale(element: HTMLElement, scale: number): void {
  element.style.width = `${LOGICAL_WIDTH * scale}px`;
  element.style.height = `${LOGICAL_HEIGHT * scale}px`;
  element.dataset.scale = String(scale);
}
