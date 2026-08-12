// Platform-facing API used by the game. The current browser implementation
// delegates to the former J2ME compatibility classes. A Python or another
// native frontend can implement the same small surface without reproducing
// the original javax.microedition package hierarchy.
export { MenuCommand } from './MenuCommand';
export { Clock } from './Clock';
export { Font } from './Font';
export { Graphics } from './Graphics';
export { Image } from './Image';
export { intDiv, intRemainder, toByte, toInt, toShort, uint8, uint16, uint32 } from './IntegerMath';
export { GameSurface, type ResourceStream } from './GameSurface';
export { AudioManager } from './audio/AudioManager';
export { AudioPlayer, type AudioPlayerListener } from './audio/AudioPlayer';
export { SaveStorage, type SaveStorageBackend } from './SaveStorage';
