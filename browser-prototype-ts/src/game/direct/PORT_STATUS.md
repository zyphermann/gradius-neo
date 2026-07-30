# Direkte Portierung von `b.java`

Quelle: `../../../decompiled/src/b.java` (8.713 Zeilen)

Die vollständige Portierung liegt jetzt als reguläre Quelle in `GradiusNeoGame.ts` vor. Die frühere Generator-/Postprocessor-Stufe ist nicht mehr Teil des Builds; weitere Refactorings erfolgen direkt an dieser Datei und werden über Git versioniert.

Die direkte Fassung ist über `?direct=1` separat startbar. Ohne diesen Parameter bleibt der bisherige, spielbare Prototyp aktiv.

## Übersetzungsregeln

- `int[]` → `Int32Array`
- `short[]` → `Int16Array`
- `byte[]` → `Int8Array`
- `long[]` → sichere JavaScript-Zeitwerte in `Float64Array`
- Java-Ganzzahldivision → `Math.trunc(...)`
- Überladungen → per Java-AST und tatsächlicher Signatur eindeutige Namen, etwa `a__String` oder `a__Graphics_int_int`
- J2ME-Aufrufe → bestehende Mini-J2ME-Schicht

## Stand

- [x] vollständige Klasse inklusive sämtlicher Methoden mechanisch erzeugt
- [x] Java-Überladungen anhand der vom Compiler aufgelösten Signaturen umbenannt
- [x] alle lokalen Java-Deklarationen und primitiven Casts syntaktisch bereinigt
- [x] komplette generierte Datei wird von `tsc` akzeptiert
- [x] Originalfelder und zentrale Arrays
- [x] Konstruktor und alle darin gesetzten Arraywerte
- [x] Browserfassung der 100-ms-Hauptschleife
- [x] vollständiges Keycode-Bitmapping `g(int)`
- [x] Ressourcen-Lader `a(String)`
- [x] beide Entity-Allokatoren und verkettete Freilisten aus Zeilen 994–1084
- [x] sämtliche Kollisions-, Audio- und Update-Methoden mechanisch enthalten
- [x] vollständiger `paint(Graphics)`-Switch mechanisch enthalten
- [x] Browser-Scheduler statt der blockierenden Java-`while`-Schleife
- [x] opt-in Start aus `main.ts` über `?direct=1`
- [ ] verbleibende Laufzeitfehler der Adapter nacheinander beheben

## Noch notwendige Adapterphase

- generierte JRE-Typen und `BigInt` auf unsere Java-Zahlenhelfer abbilden
- Node-spezifische Teile von `jree` durch kleine browsernative Java-Helfer ersetzen
- MIDI-Verhalten der derzeitigen `Manager`/`Player`-Stubs ergänzen
- Startmodus im Browser testen und Laufzeitfehler der Reihe nach beseitigen
