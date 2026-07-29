import { readFile, writeFile } from 'node:fs/promises';

const target = new URL('../src/game/direct/generated/b.ts', import.meta.url);
let source = await readFile(target, 'utf8');

if (!source.includes('BrowserMidletHost as GradiusNeo')) {
  source = source.replace(
    /import \{ java,[^\n]+\} from "jree";/,
    `import { java, type int, type long, type char, type byte, type short } from "../JavaRuntime";\n` +
    `import { Command } from "../../../j2me/lcdui/Command";\n` +
    `import { Font } from "../../../j2me/lcdui/Font";\n` +
    `import { Graphics } from "../../../j2me/lcdui/Graphics";\n` +
    `import { Image } from "../../../j2me/lcdui/Image";\n` +
    `import { GameCanvas } from "../../../j2me/lcdui/game/GameCanvas";\n` +
    `import { RecordStore } from "../../../j2me/rms/RecordStore";\n` +
    `import { Manager } from "../../../j2me/media/Manager";\n` +
    `import { Player, type PlayerListener } from "../../../j2me/media/Player";\n` +
    `import { GameSupport } from "../../a";\n` +
    `import { BrowserMidletHost as GradiusNeo } from "../BrowserMidletHost";`,
  );
}

source = source
  .replace(/import \{ java, type int, type long, type char, type byte, type short \} from "jree";/,
    'import { java, type int, type long, type char, type byte, type short } from "../JavaRuntime";')
  .replace(/\.length\(\)/g, '.length')
  .replace(/([\w.()]+)\.equals\(([^)]+)\)/g, '$1 === $2')
  .replace('var2.charAt(var7)', 'var2.charCodeAt(var7)')
  .replace("var6 >= 'A' && var6 <= 'Z'", "var6 >= 65 && var6 <= 90")
  .replace("var6 - 'A' + 14", 'var6 - 65 + 14')
  .replace("var6 >= '0' && var6 <= '9'", "var6 >= 48 && var6 <= 57")
  .replace("var6 - '0' + 4", 'var6 - 48 + 4')
  .replace("var6 === '*'", 'var6 === 42')
  .replace("var6 === '#'", 'var6 === 35')
  .replace("var6 === '-'", 'var6 === 45')
  .replace("0 | '耀'", '32768')
  .replace('(500n - this.Q + var10) as int', 'Number(500n - this.Q + var10)')
  .replace(
    'b.s[1265 + (b.s[54] + var1) / 16 * 16 + (b.s[52] + var0) / 16 % 16]',
    'b.s[1265 + Math.trunc((b.s[54] + var1) / 16) * 16 + Math.trunc((b.s[52] + var0) / 16) % 16]',
  )
  .replace(/b\.a\.a\(/g, 'GameSupport.a(')
  .replace('protected constructor(var1: GradiusNeo)', 'public constructor(var1: GradiusNeo)')
  .replace(/new\s+boolean\[\]\(([^)]*)\)/g, 'new Array<boolean>($1).fill(false)')
  .replace(/\((?:int|byte|short|long|char)\)/g, '')
  .replace(/for \((int|byte|short|long|boolean|char)\s+(\w+)\s*=/g, 'for (let $2: $1 =')
  .replace(/^(\s*)(int|byte|short|long|boolean|char)\s+(\w+)\s*;/gm, '$1let $3: $2;')
  .replace(/^(\s*)(int|byte|short|long|boolean|char)\s+(\w+)\s*=/gm, '$1let $3: $2 =')
  .replace(/^(\s*)String\s+(\w+)\s*;/gm, '$1let $2: java.lang.String;')
  .replace(/^(\s*)String\s+(\w+)\s*=/gm, '$1let $2: java.lang.String =');

// Java permits fields and methods to share names. A JavaScript instance field
// shadows the prototype method, so give those methods stable generated names.
for (const name of ['k', 'l', 'm']) {
  source = source
    .replace(new RegExp(`private  ${name}\\(\\):`, 'g'), `private  ${name}__void():`)
    .replace(new RegExp(`this\\.${name}\\(\\)`, 'g'), `this.${name}__void()`);
}

// java2typescript loses the class qualifier in the large static-heavy switch
// inside g(). Restore every affected member in that method as one mechanical
// operation instead of fixing runtime ReferenceErrors one at a time.
source = source.replace(
  /(   private  g__void\(\):  void \{)([\s\S]*?)(?=\n   private  j__Graphics)/,
  (_match, header, body) => {
    const staticMethods = [
      'a__int_int_int', 'a__int_int_int_int', 'a__int_int_int_int_int',
      'a__int_int_int_int_int_int', 'b__int', 'b__int_int',
      'b__int_int_int', 'b__int_int_int_int', 'b__int_int_int_int_int_int',
      'c__int', 'c__int_int', 'c__int_int_int',
    ];
    let fixed = body
      .replace(/(?<![.\w])s\[/g, 'b.s[')
      .replace(/(?<![.\w])u\[/g, 'b.u[')
      .replace(/(?<![.\w])I\b/g, 'b.I')
      .replace(/(?<![.\w])J\b/g, 'b.J')
      .replace(/b\.u\[0\] \/ 1000/g, 'Number(b.u[0] / 1000n)');
    for (const method of staticMethods) {
      fixed = fixed.replace(new RegExp(`(?<![.\\w])${method}\\(`, 'g'), `b.${method}(`);
    }
    return header + fixed;
  },
);

source = source.replace(
  /catch \(var29\) \{\nif \(var29 instanceof java\.lang\.Throwable\) \{\n\s*\} else \{/,
  'catch (var29) {\nif (var29 instanceof java.lang.Throwable) {\n            throw new Error(`b.paint state ${b.b}: ${var29.message}`, { cause: var29 });\n         } else {',
);

await writeFile(target, source);
console.log(`Postprocessed ${target.pathname}`);
