export class MenuCommand {
  static readonly SCREEN = 1;
  static readonly BACK = 2;
  static readonly CANCEL = 3;
  static readonly OK = 4;
  static readonly HELP = 5;
  static readonly STOP = 6;
  static readonly EXIT = 7;
  static readonly ITEM = 8;

  constructor(
    private readonly label: string,
    private readonly commandType: number,
    private readonly priority: number,
  ) {
    if (label === null || label === undefined) throw new TypeError('Command label is null');
  }

  getLabel(): string {
    return this.label;
  }

  getCommandType(): number {
    return this.commandType;
  }

  getPriority(): number {
    return this.priority;
  }
}
