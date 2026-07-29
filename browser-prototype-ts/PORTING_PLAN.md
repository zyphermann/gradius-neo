# Gradius Neo: Portierung nach TypeScript und HTML Canvas

## Ziel

Das originale J2ME-Spiel wird ohne Java-Laufzeit, FreeJ2ME oder CheerpJ als eigenständige Browser-Anwendung ausgeführt.

Die dekompilierten Klassen werden so direkt wie möglich nach TypeScript übertragen. Eine kleine Kompatibilitätsschicht bildet die verwendeten J2ME-APIs auf Browser-APIs ab. Spiellogik, Konstanten, Tabellen und Ressourcenformate bleiben zunächst unverändert.

Der vorhandene Ordner `../browser-prototype` bleibt unberührt und dient als ausführbare Referenz. Die dekompilierten Quellen in `../decompiled/src` bleiben ebenfalls unverändert.

## Ausgangsmaterial

- `../decompiled/src/GradiusNeo.java`: MIDlet-Einstieg und Lebenszyklus
- `../decompiled/src/a.java`: Hilfs- beziehungsweise Renderingcode
- `../decompiled/src/b.java`: Hauptklasse mit Spielschleife, Spiellogik und Zuständen
- `../decompiled/resources`: Bilder, Leveldaten, CSV-artige Daten und MIDI-Dateien
- `../gradius_neo_176x220-71722.jar`: unveränderte Referenz-JAR
- `../browser-prototype`: funktionierende FreeJ2ME-Web-Referenz

## Grundregeln für die Portierung

1. Zunächst Verhalten erhalten, nicht aufräumen.
2. Obfuskierte Namen bleiben während der ersten Portierung bestehen.
3. Umbenennungen erfolgen erst nach einem nachweislich funktionierenden Port.
4. Java-Aufrufe werden möglichst durch gleichnamige TypeScript-Methoden abgebildet.
5. Ressourcen werden zunächst unverändert geladen und dekodiert.
6. Jede Etappe bekommt einen kleinen Test oder einen sichtbaren Vergleich.
7. Darstellung erfolgt intern immer mit 176 × 220 Pixeln und wird nur ganzzahlig skaliert.

## Phase 1: Projektgrundlage

- Vite-Projekt mit TypeScript einrichten.
- Strikte TypeScript-Prüfung aktivieren.
- Verzeichnisse anlegen:
  - `src/j2me`: Kompatibilitätsschicht
  - `src/game`: übertragene Spielklassen
  - `src/runtime`: Spielstart, Zeitsteuerung und Ressourcenverwaltung
  - `public/assets`: unveränderte Spielressourcen
  - `tests`: Tests für kritische Java-Semantik und Ressourcenformate
- Entwicklungs-, Build- und Testbefehle definieren.
- Canvas mit logischer Größe 176 × 220 anlegen.
- Integer-Skalierung für 1×, 2×, 3× und größere ganzzahlige Faktoren implementieren.
- Pixelglättung deaktivieren.

Ergebnis: Eine leere, lokal und als Produktions-Build ausführbare Canvas-Anwendung.

## Phase 2: Java-Semantik in TypeScript

Java und JavaScript unterscheiden sich in einigen für alten Spielecode wichtigen Details. Dafür werden zentrale Hilfsfunktionen erstellt.

### Zahlen

- 32-Bit-Integeroperationen mit `| 0`, `Math.imul` und unsigned shifts korrekt abbilden.
- Java-Division ganzer Zahlen in Richtung null runden.
- Überläufe von `int`, `short` und `byte` reproduzieren.
- Vorzeichenbehaftete Java-Bytes korrekt konvertieren.
- Java-`char` als unsigned 16-Bit-Wert behandeln.
- Falls verwendet: 64-Bit-`long` mit `bigint` oder geprüfter Number-Darstellung abbilden.

### Arrays und Objekte

- Primitive Arrays mit passenden Typed Arrays abbilden, sofern ihr Verhalten passt.
- Mehrdimensionale Java-Arrays korrekt initialisieren.
- Java-Standardwerte reproduzieren: `0`, `false` und `null`.
- Arraygrenzen während der Portierung nach Möglichkeit prüfen.

### Spracheigenschaften

- Methodenüberladungen über optionale Parameter oder interne Dispatcher abbilden.
- Statische und Instanzfelder eindeutig trennen.
- Konstruktorverkettung manuell prüfen.
- Java-Stringvergleiche und `null`-Verhalten erhalten.
- Benötigte Teile von `Vector` und `Hashtable` durch kompatible Wrapper abbilden.

Ergebnis: Kleine getestete Hilfsbibliothek für Java-kompatible Rechen- und Datenoperationen.

## Phase 3: J2ME-Kompatibilitätsschicht

Nur die vom Spiel tatsächlich verwendeten APIs werden implementiert.

### `Graphics`

- `setColor(int)` und `setColor(r, g, b)`
- `getColor()`
- `fillRect`, `drawRect` und `drawLine`
- `drawString` und gegebenenfalls `drawSubstring`
- `drawImage`
- Clip-Verwaltung: `setClip`, `clipRect`, `getClipX/Y/Width/Height`
- Anchor-Flags wie `LEFT`, `RIGHT`, `HCENTER`, `TOP`, `BOTTOM` und `VCENTER`
- Übersetzung der J2ME-Zeichenoperationen auf Canvas 2D
- Exakte Pixelpositionen ohne Antialiasing-Verschiebung prüfen

### `Image`

- Laden von Ressourcen anhand eines J2ME-Pfades
- `createImage(path)`
- `createImage(width, height)` für veränderliche Bilder
- `createImage(byte[], offset, length)`, falls verwendet
- `getGraphics()` für Offscreen-Canvas
- Breite und Höhe
- Unterstützung für die tatsächlich verwendeten Bildformate

### `Font`

- J2ME-Fontkonstanten
- `getFont` und `getDefaultFont`
- `stringWidth`, `charWidth` und `getHeight`
- Browserfont so konfigurieren, dass Menüs und HUD möglichst ähnlich ausfallen

### `GameCanvas`

- `getGraphics()`
- `flushGraphics()` und Teilbereichsvariante
- Tastenzustände über `getKeyStates()`
- J2ME-Keycodes und Game-Action-Zuordnung
- Fokusverlust behandeln, damit keine Taste hängen bleibt

### Display und MIDlet

- Minimale Klassen für `MIDlet`, `Display`, `Displayable` und `Command`
- `Display.getDisplay()` und `setCurrent()`
- `startApp`, `pauseApp` und `destroyApp`

Ergebnis: Ein kleines Testprogramm kann über die J2ME-ähnliche API auf dem Browser-Canvas zeichnen und Eingaben lesen.

## Phase 4: Ressourcen analysieren und laden

- Alle Dateien aus `decompiled/resources` nach `public/assets` übernehmen.
- Eine Ressourcenliste mit Größe, vermutetem Format und Verwendung erstellen.
- PNG-Dateien direkt über Browser-APIs laden.
- Dateien ohne Endung anhand von Magic Bytes und Zugriffscode untersuchen.
- `img_*`-Dateien gemäß den Routinen aus `b.java` dekodieren.
- `csv_*`-Dateien mit exakt derselben Byte- und Trennzeichenlogik einlesen.
- Level-, Gegner- und Animationstabellen unverändert übernehmen.
- Ressourcenpfade mit und ohne führenden Slash unterstützen.
- Ladefehler mit Dateiname und aufrufender Spielphase sichtbar protokollieren.

Ergebnis: Sämtliche Spielressourcen können reproduzierbar geladen und in diagnostischen Ansichten dargestellt werden.

## Phase 5: `a.java` übertragen

- Klasse zunächst mechanisch nach `src/game/A.ts` übertragen.
- Feldtypen aus Zuweisungen und Verwendung ableiten.
- Java-Arrays und numerische Operationen mit den Hilfsfunktionen abbilden.
- Aufrufe von `Graphics` und `Font` möglichst unverändert belassen.
- Methodenüberladungen zusammenführen.
- Für jede übertragene Methode prüfen, ob der Decompiler Kontrollfluss korrekt rekonstruiert hat.
- Kleine Renderingtests oder Snapshots für verwendete Zeichenmethoden erstellen.

Ergebnis: Die Hilfsklasse kompiliert und kann unabhängig getestet werden.

## Phase 6: `GradiusNeo.java` übertragen

- Klasse nach `src/game/GradiusNeo.ts` übertragen.
- MIDlet-Lebenszyklus auf den Browserstart abbilden.
- Erstellung von `B`, Anzeige und Start der Spielschleife verbinden.
- Pause bei unsichtbarem Tab und Fortsetzung beim Aktivieren vorsehen.

Ergebnis: Der originale Einstiegspunkt erzeugt die Hauptklasse, ohne dass Spiellogik entfernt oder neu geschrieben wird.

## Phase 7: `b.java` mechanisch übertragen

Die Hauptklasse wird nicht zunächst verstanden oder neu strukturiert. Sie wird abschnittsweise in möglichst gleicher Form übersetzt.

### Reihenfolge

1. Konstanten und statische Felder
2. Instanzfelder
3. Konstruktor und Initialisierung
4. Ressourcenmethoden
5. Renderingmethoden
6. Eingabe- und Menümethoden
7. Spieler-, Projektil- und Kollisionsmethoden
8. Gegner- und Bossmethoden
9. Level- und Skriptmethoden
10. Hauptschleife und Zustandswechsel

### Mechanische Übersetzungsregeln

- `boolean`, `int`, `short`, `byte` und Arrays explizit typisieren.
- `this` und statische Zugriffe korrekt erhalten.
- Java-Casts durch passende Konvertierungsfunktionen ersetzen.
- `switch`, Schleifen und Sprunglogik strukturell unverändert lassen.
- Leere oder synthetische Decompilerblöcke markieren, aber nicht ungeprüft entfernen.
- Jeder Portierungsblock muss kompilieren, bevor der nächste übernommen wird.
- Provisorische Typen werden mit `TODO(port)` gekennzeichnet; `any` nur lokal und vorübergehend verwenden.

### Decompiler-Risiken

- Die Vineflower-Ausgabe mit `decompiled/cfr-src` vergleichen, wenn Kontrollfluss unplausibel erscheint.
- Bei widersprüchlichen Ausgaben Bytecode mit `javap -c` prüfen.
- Reihenfolge von Nebenwirkungen in komplexen Ausdrücken erhalten.
- Unleserliche Ausdrücke zuerst in temporäre Variablen zerlegen, ohne ihre Reihenfolge zu ändern.

Ergebnis: Die gesamte Hauptklasse ist in TypeScript vorhanden und der Compiler meldet keine fehlenden Symbole mehr.

## Phase 8: Spielschleife und Zeitsteuerung

- J2ME-Threadstart durch eine kontrollierte asynchrone Schleife ersetzen.
- `Thread.sleep(ms)` ohne Blockieren des Browserthreads abbilden.
- Zunächst das originale Timing beibehalten.
- Rendering und Update nicht voreilig trennen.
- Optional später auf `requestAnimationFrame` synchronisieren.
- Große Zeitsprünge nach Tabwechsel begrenzen.
- Eingaben pro logischem Frame stabil erfassen.
- Originalgeschwindigkeit mit der Emulatorreferenz vergleichen.

Ergebnis: Titelbildschirm und Hauptschleife laufen dauerhaft ohne den Browser zu blockieren.

## Phase 9: Audio und MIDI

- Verwendung von `Manager`, `Player` und `PlayerListener` exakt erfassen.
- MIDI-Dateien mit einer Browser-kompatiblen MIDI/Soundfont-Lösung abspielen.
- Wiedergabe, Stop, Loop und End-of-Media-Ereignisse implementieren.
- Browser-Autoplay-Sperre über einen bewussten ersten Benutzerklick lösen.
- Soundeffekte und Musik getrennt steuerbar machen.
- Das Spiel darf bei deaktiviertem oder fehlgeschlagenem Audio nicht abstürzen.

Ergebnis: Musik und Effekte folgen den ursprünglichen Zustandswechseln.

## Phase 10: RecordStore und Speicherstände

- Tatsächlich verwendete `RecordStore`-Methoden erfassen.
- Binäre Records in IndexedDB speichern; LocalStorage nur bei sehr kleinem und einfachem Format verwenden.
- Record-IDs und Java-Bytearrays unverändert erhalten.
- Versionierung für spätere Schemaänderungen vorsehen.
- Speicherstand löschen und exportieren/importieren ermöglichen.
- Verhalten bei fehlendem oder beschädigtem Speicherstand testen.

Ergebnis: Einstellungen, Highscores und Fortschritt bleiben nach Neuladen erhalten.

## Phase 11: Eingabe

- Tastaturbelegung der Emulatorreferenz übernehmen.
- Virtuelles Steuerkreuz und Aktionstasten für Touch ergänzen.
- Gamepad API optional unterstützen.
- Mehrere gleichzeitig gedrückte Tasten korrekt abbilden.
- Key-Repeat nur dort zulassen, wo J2ME ihn geliefert hätte.
- Kontextmenü, Scrollen und Browserhotkeys innerhalb der Spielsteuerung kontrolliert behandeln.

Ergebnis: Desktop-, Touch- und optional Gamepad-Steuerung funktionieren konsistent.

## Phase 12: Verifikation gegen die Referenz

Für jeden erreichten Spielzustand wird die TypeScript-Version neben `browser-prototype` verglichen.

- Titelbildschirm
- Hauptmenü
- Spielstart
- Bewegung und Schießen
- Power-up-Leiste und Optionen
- Gegneranimationen
- Kollisionen und Treffer
- Scrolling und Levelübergänge
- Bosse
- Pause, Game Over und Continue
- Highscores und Speicherstände
- Musikwechsel und Soundeffekte

Zu prüfen sind:

- Pixelpositionen und Farben
- Reihenfolge der Zeichenoperationen
- Animationsgeschwindigkeit
- Zufallsverhalten bei identischem Seed, sofern steuerbar
- Kollisionsgrenzen
- Eingabelatenz
- Ressourcen- und Speicherfehler

Ergebnis: Bekannte Abweichungen werden dokumentiert; kritische Abweichungen sind behoben.

## Phase 13: Aufräumen nach erfolgreichem Port

Erst wenn das Spiel vollständig läuft:

- Obfuskierte Felder und Methoden schrittweise semantisch benennen.
- Große Klasse in Renderer, Audio, Input, Level, Entities und State Machine zerlegen.
- Magische Zahlen als Konstanten dokumentieren.
- Unbenutzten, nachweislich toten Code entfernen.
- Debugansichten für Hitboxen, Sprites und Spielzustände ergänzen.
- Performance messen und nur nach Bedarf optimieren.

Ergebnis: Wartbare Struktur ohne unbeabsichtigte Verhaltensänderungen.

## Phase 14: Offline- und Produktions-Build

- Alle verwendeten Bibliotheken lokal bündeln.
- Keine externe Java- oder Emulatorlaufzeit verwenden.
- Service Worker für App-Shell und Spielressourcen ergänzen.
- Vollständigen Offline-Start testen.
- Cache-Versionierung und Updatehinweis implementieren.
- Produktions-Build auf Chrome, Firefox und Safari testen.
- Touchgeräte und verschiedene Pixeldichten testen.

Ergebnis: Eine statische, vollständig offlinefähige Browser-Anwendung.

## Qualitätskontrollen

- TypeScript ohne Compilerfehler
- Keine unbeabsichtigten `any`-Typen in fertigen Modulen
- Tests für Java-Zahlenkonvertierungen
- Tests für Ressourcenparser
- Tests für RecordStore
- Keine externen Laufzeitabhängigkeiten im Produktions-Build
- Keine fraktionale Canvas-Skalierung
- Keine ungefangenen Promise-Fehler
- Spiel bleibt bei deaktiviertem Audio funktionsfähig

## Unmittelbar nächster Schritt

Phase 1 umsetzen: Vite-/TypeScript-Projekt, 176×220-Canvas, Integer-Skalierung, Ressourcenverzeichnis und minimale Testinfrastruktur anlegen. Danach folgt die Java-Semantik-Hilfsbibliothek, bevor Spielcode übertragen wird.
