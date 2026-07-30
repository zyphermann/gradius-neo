export class BrowserApplicationHost {
  getAppProperty(name: string): string {
    return name === 'MIDlet-Version' ? '1.0' : '';
  }

  destroyApp(_unconditional: boolean): void {}
  notifyDestroyed(): void {}
}
