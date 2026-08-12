export const enum InputBit {
  Up = 2,
  Left = 4,
  Right = 32,
  Down = 64,
  Fire = 256,
  Key0 = 1024,
  Key1 = 2048,
  Key2 = 4096,
  Key3 = 8192,
  Key4 = 16384,
  Key5 = 32768,
  Key6 = 65536,
  Key7 = 131072,
  Key8 = 262144,
  Key9 = 524288,
  Star = 1048576,
  Hash = 2097152,
  LeftSoftKey = 4194304,
  RightSoftKey = 8388608,
  Back = 33554432,
}

export function keyCodeToInputBit(keyCode: number, getGameAction: (keyCode: number) => number): InputBit | 0 {
  switch (keyCode) {
    case -10:
      return 0;
    case -8:
      return InputBit.Back;
    case -7:
      return InputBit.RightSoftKey;
    case -6:
      return InputBit.LeftSoftKey;
    case 35:
      return InputBit.Hash;
    case 42:
      return InputBit.Star;
    case 48:
      return InputBit.Key0;
    case 49:
      return InputBit.Key1;
    case 50:
      return InputBit.Key2;
    case 51:
      return InputBit.Key3;
    case 52:
      return InputBit.Key4;
    case 53:
      return InputBit.Key5;
    case 54:
      return InputBit.Key6;
    case 55:
      return InputBit.Key7;
    case 56:
      return InputBit.Key8;
    case 57:
      return InputBit.Key9;
  }

  try {
    switch (getGameAction(keyCode)) {
      case 1:
        return InputBit.Up;
      case 2:
        return InputBit.Left;
      case 5:
        return InputBit.Right;
      case 6:
        return InputBit.Down;
      case 8:
        return InputBit.Fire;
      default:
        return 0;
    }
  } catch (error) {
    if (error instanceof RangeError) return 0;
    throw error;
  }
}
