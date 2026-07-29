export class BrowserMidletHost {
  getAppProperty(name: string): string {
    return name === 'MIDlet-Version' ? '1.0' : '';
  }

  destroyApp(_unconditional: boolean): void {}
  notifyDestroyed(): void {}

  platformRequest(url: string): boolean {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
}
