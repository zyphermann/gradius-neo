import { readFile, writeFile } from 'node:fs/promises';

const [inputPath, outputPath, fromText = '100', toText = '16'] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node patch-frame-period.mjs INPUT.class OUTPUT.class [FROM_MS] [TO_MS]');
}

const classFile = await readFile(inputPath);
if (classFile.readUInt32BE(0) !== 0xcafebabe) {
  throw new Error(`${inputPath} is not a Java class file`);
}

const fromValue = BigInt(fromText);
const toValue = BigInt(toText);
const constantPoolCount = classFile.readUInt16BE(8);
let offset = 10;
let replacements = 0;

for (let index = 1; index < constantPoolCount; index += 1) {
  const tag = classFile.readUInt8(offset++);

  switch (tag) {
    case 1: {
      const length = classFile.readUInt16BE(offset);
      offset += 2 + length;
      break;
    }
    case 3:
    case 4:
      offset += 4;
      break;
    case 5:
    case 6:
      if (tag === 5 && classFile.readBigInt64BE(offset) === fromValue) {
        classFile.writeBigInt64BE(toValue, offset);
        replacements += 1;
      }
      offset += 8;
      index += 1;
      break;
    case 7:
    case 8:
    case 16:
    case 19:
    case 20:
      offset += 2;
      break;
    case 9:
    case 10:
    case 11:
    case 12:
    case 17:
    case 18:
      offset += 4;
      break;
    case 15:
      offset += 3;
      break;
    default:
      throw new Error(`Unsupported constant-pool tag ${tag} at index ${index}`);
  }
}

if (replacements !== 1) {
  throw new Error(`Expected exactly one long constant ${fromValue}, found ${replacements}`);
}

await writeFile(outputPath, classFile);
console.log(`Patched one CONSTANT_Long from ${fromValue} ms to ${toValue} ms.`);
