# J2ME-API-Inventar für `b.java`

## Zweck und Methode

Dieses Dokument enthält alle direkten Aufrufe der importierten Java-/J2ME-Klassen in `../decompiled/src/b.java`. Zusätzlich sind geerbte Methoden von `GameCanvas` sowie weitere Laufzeitabhängigkeiten aufgeführt, die für eine direkte TypeScript-Portierung relevant sind.

Grundlage ist die Vineflower-Ausgabe mit 8.713 Zeilen. Die Aufrufhäufigkeiten wurden mechanisch aus dieser Datei ermittelt und anschließend an den jeweiligen Codestellen geprüft.

Offizielle Referenzen:

- [Graphics, MIDP 2.0](https://docs.oracle.com/javame/config/cldc/ref-impl/midp2.0/jsr118/javax/microedition/lcdui/Graphics.html)
- [GameCanvas, MIDP 2.0](https://docs.oracle.com/javame/config/cldc/ref-impl/midp2.0/jsr118/javax/microedition/lcdui/game/GameCanvas.html)
- [Canvas, MIDP 2.0](https://docs.oracle.com/javame/config/cldc/ref-impl/midp2.0/jsr118/javax/microedition/lcdui/Canvas.html)
- [Image, MIDP 2.0](https://docs.oracle.com/javame/config/cldc/ref-impl/midp2.0/jsr118/javax/microedition/lcdui/Image.html)
- [Font, MIDP 2.0](https://docs.oracle.com/javame/config/cldc/ref-impl/midp2.0/jsr118/javax/microedition/lcdui/Font.html)
- [Command, MIDP 2.0](https://docs.oracle.com/javame/config/cldc/ref-impl/midp2.0/jsr118/javax/microedition/lcdui/Command.html)
- [Manager](https://docs.oracle.com/javame/8.0/api/meep/api/javax/microedition/media/Manager.html)
- [Player](https://docs.oracle.com/javame/8.0/api/meep/api/javax/microedition/media/Player.html)
- [RecordStore](https://docs.oracle.com/javame/config/cldc/ref-impl/midp1.0/jsr037/javax/microedition/rms/RecordStore.html)
- [Hashtable](https://docs.oracle.com/javase/8/docs/api/java/util/Hashtable.html)
- [CLDC-1.0-Klassen einschließlich InputStream](https://docs.oracle.com/javame/config/cldc/ref-impl/cldc1.0/cldcapi.pdf)

## Zusammenfassung

| Klasse | Benötigte Oberfläche | Einschätzung |
|---|---:|---|
| `InputStream` | 2 Methoden | Durch geladenen `Uint8Array` ersetzbar |
| `Hashtable` | Konstruktor + 2 Methoden | Durch `Map<string, Player>` ersetzbar |
| `Command` | Konstruktor + `getLabel()` | Sehr kleiner Datencontainer |
| `Font` | `getFont()` + `getHeight()` | Kleine Metrik-/Canvas-Font-Abstraktion |
| `Graphics` | 12 Methoden | Wichtigster Teil der Canvas-Schicht |
| `Image` | eine verwendete Factory | Asynchrones Vorladen erforderlich |
| `GameCanvas`/`Canvas` | Konstruktor + 13 Methoden/Callbacks | Browser-Canvas, Fokus und Eingabe |
| `Manager` | eine Factory | MIDI-Player erzeugen |
| `Player` | 6 Methoden | Kleine Zustandsmaschine um MIDI-Wiedergabe |
| `PlayerListener` | ein Callback | Im Spiel leer, daher zunächst No-op |
| `RecordStore` | Factory + 6 Methoden | Ein fester Record mit 78 Bytes genügt |

## `java.io.InputStream`

### Verwendungen

```java
v = this.getClass().getResourceAsStream("/" + var1);
v.read(y);
v.close();
```

Fundstelle: `b.java:964–966`.

Benötigt werden:

- `read(byte[] destination): int`
- `close(): void`

Außerdem wird ein `InputStream` direkt an `Manager.createPlayer()` übergeben.

### TypeScript-Minimum

Ein allgemeiner Stream ist nicht nötig. Für Datenressourcen kann der Ressourcenloader einen vollständigen `Uint8Array` liefern. `read()` kopiert höchstens `destination.length` Bytes hinein und liefert die kopierte Länge; `close()` kann zunächst ein No-op sein.

Wichtig: Java-`byte[]` ist vorzeichenbehaftet. Die Rohdaten sollten als `Uint8Array` gespeichert und beim Zugriff, wo Java-Vorzeichenverhalten erwartet wird, explizit mit `toInt8()` konvertiert werden.

## `java.util.Hashtable`

### Verwendungen

```java
private Hashtable V = new Hashtable();
Player cached = (Player)this.V.get(this.R);
this.V.put(this.R, player);
```

Benötigt werden:

- `new Hashtable()`
- `get(key): value | null`
- `put(key, value): previousValue | null`

Die Tabelle ist ausschließlich ein Cache von MIDI-Pfad zu `Player`. Ein `Map<string, Player>` reicht aus. Zu beachten ist nur, dass Java `Hashtable.get()` bei fehlendem Schlüssel `null` liefert, während `Map.get()` `undefined` liefert.

## `javax.microedition.lcdui.Command`

### Verwendungen

Sieben Objekte werden statisch erzeugt:

```java
new Command(label, 1, 1)
```

Später werden zwei Labels gelesen:

```java
E[index].getLabel()
```

Benötigt werden:

- `new Command(label: string, commandType: int, priority: int)`
- `getLabel(): string`

`commandType` und `priority` beeinflussen den Spielablauf nicht. Es werden keine Commands bei einem Displayable registriert. Die TypeScript-Klasse kann daher zunächst nur das Label speichern.

## `javax.microedition.lcdui.Font`

### Direkte Verwendungen

`Font.getFont(face, style, size)` wird fünfmal aufgerufen:

- einmal `getFont(32, 0, 0)`
- dreimal `getFont(64, 0, 8)`
- einmal `getFont(32, 0, 8)`

Die numerischen J2ME-Konstanten bedeuten:

- `32`: `FACE_MONOSPACE`
- `64`: `FACE_PROPORTIONAL`
- `0` bei Style: `STYLE_PLAIN`
- `0` bei Size: `SIZE_MEDIUM`
- `8`: `SIZE_SMALL`

Zusätzlich wird über `Graphics.getFont()` zweimal `Font.getHeight()` aufgerufen.

Benötigt werden:

- `Font.getFont(face, style, size): Font`
- `getHeight(): int`

### Indirekte Anforderung

Das Spiel übergibt `Font` außerdem an Methoden der Klasse `a`. Daher muss deren Port später geprüft werden, bevor die Font-Schicht als vollständig gilt. Für `b.java` allein sind nur die beiden obigen Methoden notwendig.

### Canvas-Abbildung

Die Klasse sollte mindestens folgende Daten halten:

- Face: monospace oder proportional
- Style: normal
- logische Pixelhöhe
- vorbereiteter CSS-Fontstring für `CanvasRenderingContext2D.font`

`getHeight()` muss stabil und unabhängig von Browser-spezifischen Textmetriken sein, weil der Wert für vertikale Menüabstände verwendet wird.

## `javax.microedition.lcdui.Graphics`

### Vollständige Methodenliste

| Methode | Aufrufe in `b.java` | Benötigte Signatur |
|---|---:|---|
| `drawRegion` | 95 | `(image, sx, sy, width, height, transform, dx, dy, anchor)` |
| `setColor` | 33 | `(rgb)` und `(red, green, blue)` |
| `fillRect` | 18 | `(x, y, width, height)` |
| `drawString` | 18 | `(text, x, y, anchor)` |
| `drawLine` | 11 | `(x1, y1, x2, y2)` |
| `getFont` | 5 | `(): Font` |
| `setFont` | 5 | `(font)` |
| `drawImage` | 4 | `(image, x, y, anchor)` |
| `translate` | 4 | `(x, y)` |
| `setClip` | 3 | `(x, y, width, height)` |
| `getTranslateX` | 2 | `(): int` |
| `getTranslateY` | 2 | `(): int` |

Andere `Graphics`-Methoden werden in `b.java` nicht verwendet. Insbesondere werden keine Bögen, Polygone, runden Rechtecke, RGB-Arrays oder Stroke-Styles benötigt.

### Farben

Beide Überladungen werden gebraucht:

```java
setColor(0xRRGGBB)
setColor(red, green, blue)
```

Der aktuelle Farbwert wird ausschließlich für nachfolgende Primitive und Text verwendet. Bilder ignorieren ihn.

### Translation und Clip

J2ME speichert eine aktuelle Translation im `Graphics`-Objekt. Koordinaten aller Zeichenoperationen werden dadurch verschoben. `setClip()` erhält Koordinaten im aktuell übersetzten Koordinatensystem. Der Port sollte Translation und Clip als eigene Integerwerte verwalten, statt sich vollständig auf `context.translate()` und den schwer zurücksetzbaren Canvas-Clipstack zu verlassen.

Empfohlene Implementierung:

- `translateX` und `translateY` explizit speichern.
- Translation bei jeder Zeichenoperation zu den Koordinaten addieren.
- Cliprechteck in Zielkoordinaten speichern.
- Jede Operation in `save()`/`clip()`/`restore()` ausführen oder über eine zentrale Renderfunktion clippen.

### Anchor-Werte

Im dekompilierten Code erscheinen numerische Anchor-Kombinationen:

- `3` = `HCENTER | VCENTER`
- `17` = `HCENTER | TOP`
- `20` = `LEFT | TOP`

`drawImage()` nutzt `3`, `drawString()` hauptsächlich `17` und `20`, `drawRegion()` nutzt `20`.

### `drawRegion`

In den beobachteten Aufrufen ist `transform` immer `0` (`Sprite.TRANS_NONE`). Die erste Implementierung muss daher noch keine Rotation oder Spiegelung unterstützen. Sie muss aber korrekt:

1. den Quellbereich beschneiden,
2. den Anchor auf das Zielrechteck anwenden,
3. Translation und Clip berücksichtigen,
4. ohne Pixelglättung zeichnen.

### Linien

Canvas zeichnet 1-Pixel-Linien standardmäßig zwischen Pixeln und kann dadurch weichzeichnen. Für J2ME-kompatible Linien ist eine pixelgenaue Implementierung oder eine kontrollierte Halb-Pixel-Korrektur notwendig. Horizontale und vertikale Linien dominieren; ein Bresenham-Fallback wäre die reproduzierbarste Lösung.

## `javax.microedition.lcdui.Image`

### Verwendungen

Es wird ausschließlich folgende Factory verwendet:

```java
Image.createImage(String resourceName)
```

Vier Codestellen laden:

- dynamisch `"/img_" + name`
- `/img_sub`
- `/img_st2c`
- `/konami.png`

Benötigt werden:

- `Image.createImage(resourceName): Image`

Direkte Aufrufe von `getWidth()`, `getHeight()` oder `getGraphics()` gibt es in `b.java` nicht.

### TypeScript-Besonderheit

Die J2ME-Methode ist synchron, Browser-Bilddekodierung ist asynchron. Deshalb müssen alle möglichen Bilder vor Spielstart geladen werden. `createImage(path)` kann anschließend synchron ein bereits dekodiertes Objekt aus einem Ressourcen-Cache zurückgeben.

Die Dateien `img_*` haben keine Dateiendung, sind laut Verwendung aber komplette Bildressourcen. Ihr tatsächliches Format beziehungsweise ihre Browser-Dekodierbarkeit muss beim Ressourcen-Schritt geprüft werden.

## `javax.microedition.lcdui.game.GameCanvas` und geerbtes `Canvas`

### Konstruktor

```java
super(false)
```

`false` bedeutet, dass reguläre Key-Events für Spieltasten nicht unterdrückt werden. Das passt zur Nutzung von `keyPressed()` und `keyReleased()`.

### Vom Spiel aufgerufene Methoden

- `setFullScreenMode(true)` — einmal
- `getWidth()` — fünfmal
- `getHeight()` — fünfmal
- `repaint()` — einmal pro Hauptschleifendurchlauf
- `serviceRepaints()` — einmal pro Hauptschleifendurchlauf
- `getGameAction(keyCode)` — einmal in der Keycode-Normalisierung
- `isShown()` — einmal für automatische Pause

### Vom Spiel implementierte Callbacks

- `paint(Graphics)`
- `keyPressed(int keyCode)`
- `keyReleased(int keyCode)`
- `hideNotify()`
- `showNotify()`

### Nicht verwendet

`b.java` ruft weder `GameCanvas.getGraphics()` noch `flushGraphics()` noch `getKeyStates()` auf. Es benutzt das klassische `Canvas.paint()`-Modell: `repaint()` plus synchronisierendes `serviceRepaints()`.

### TypeScript-Minimum

Eine vollständige GameCanvas-Pufferimplementierung ist nicht notwendig. Die Schicht benötigt:

- feste logische Größe 176 × 220,
- ein `Graphics`-Objekt für den Hauptcanvas,
- `repaint()` zum Markieren eines ausstehenden Frames,
- `serviceRepaints()` zum direkten Aufruf von `paint(graphics)`,
- Sichtbarkeitsstatus über `document.visibilityState`,
- Keyboard-Events und J2ME-Game-Action-Mapping,
- `hideNotify()`/`showNotify()` bei Sichtbarkeitswechsel.

Die Originalschleife zielt außerhalb einiger Zustände auf einen Frame alle 100 ms, also ungefähr 10 FPS.

## `javax.microedition.media.Manager`

### Verwendung

```java
Manager.createPlayer(inputStream, "audio/midi")
```

Benötigt wird:

- `Manager.createPlayer(stream, contentType): Player`

Nur `audio/midi` kommt vor. Andere Media-Locators, Tonerzeugung und Formate sind für `b.java` nicht erforderlich.

Da Browserressourcen bereits über Pfade verwaltet werden, kann der TypeScript-Port statt eines echten Streams intern den Ressourcenpfad oder die zugehörigen Bytes an den Player weiterreichen.

## `javax.microedition.media.Player`

### Vollständige Methodenliste

- `addPlayerListener(listener)`
- `realize()`
- `setLoopCount(count)`
- `start()`
- `stop()`
- `deallocate()`

Zusätzlich wird der Player im `Hashtable` gespeichert und als aktueller Player referenziert.

### Benötigte Zustände

Für das beobachtete Spielverhalten genügt:

- erstellt,
- realisiert/bereit,
- gestartet,
- gestoppt/deallokiert.

`close()`, `prefetch()`, Lautstärkeregler, Media-Time und State-Abfragen werden nicht verwendet.

### Loop-Semantik

- `setLoopCount(1)` spielt einmal.
- `setLoopCount(-1)` spielt endlos.
- `0` wäre laut API ungültig, wird vom Spiel nicht bewusst gesetzt.

Der Code verwendet `-1` für Levelmusik und `1` für Soundeffekte.

## `javax.microedition.media.PlayerListener`

`b` implementiert:

```java
playerUpdate(Player player, String event, Object eventData) {
}
```

Der Callback ist vollständig leer. Für die erste TypeScript-Version reicht daher:

- Interface mit `playerUpdate(...)`
- Registrierung in `addPlayerListener()` darf gespeichert oder ignoriert werden
- keine Auswertung von Eventkonstanten erforderlich

Audioende beeinflusst den Spielablauf nicht über diesen Callback.

## `javax.microedition.rms.RecordStore`

### Vollständige Methodenliste

- `RecordStore.openRecordStore("R", true)` — dreimal
- `getNumRecords()` — einmal
- `addRecord(H, 0, 78)` — einmal
- `getRecord(1, H, 0)` — zweimal
- `setRecord(1, H, 0, 78)` — einmal
- `closeRecordStore()` — dreimal

### Tatsächliches Datenmodell

Das Spiel verwendet genau:

- einen Store namens `R`,
- einen Record mit ID `1`,
- eine Nutzlast von genau 78 Bytes,
- den statischen Puffer `H` als Lese-/Schreibziel.

Eine allgemeine RMS-Datenbank ist nicht erforderlich.

### TypeScript-Minimum

```ts
class RecordStore {
  static openRecordStore(name: string, create: boolean): RecordStore;
  getNumRecords(): number;
  addRecord(data: Int8Array, offset: number, length: number): number;
  getRecord(id: number, target: Int8Array, offset: number): number;
  setRecord(id: number, data: Int8Array, offset: number, length: number): void;
  closeRecordStore(): void;
}
```

IndexedDB ist technisch robust, aber für diesen einen Record reicht auch LocalStorage mit Base64- oder Hex-Kodierung. Wichtig sind synchrone Aufrufe: Der Originalcode erwartet keine Promises. Deshalb sollte der Speicherstand vor Spielstart in den Arbeitsspeicher geladen und danach synchron bedient werden. Schreibvorgänge können anschließend im Hintergrund persistiert werden.

## Weitere in `b.java` benötigte Laufzeitfunktionen

Diese Aufrufe stammen nicht aus der Importliste, sind aber für die Mini-Schicht beziehungsweise den Port relevant.

### Ressourcen und Klasse

- `this.getClass().getResourceAsStream(path)` — zweimal
- ein Aufruf für allgemeine Binärdaten
- ein Aufruf für MIDI

Im TypeScript-Port sollte dies direkt über einen zentralen `ResourceManager` laufen.

### Zeit und Thread

- `System.currentTimeMillis()` — neunmal
- `System.gc()` — fünfmal; im Browser No-op
- `Thread.sleep(ms)` — einmal in der Hauptschleife
- `Thread.yield()` — einmal; im Browser asynchron nachgeben

### MIDlet-Aufrufe über `GradiusNeo w`

- `getAppProperty("MIDlet-Version")`
- `platformRequest(url)`
- `destroyApp(false)`
- `notifyDestroyed()`

`platformRequest()` kann über `window.open()` oder `location.href` abgebildet werden. Der historische Konami-Link sollte nicht automatisch geöffnet werden; ein expliziter Benutzerklick ist erforderlich.

### Strings und Fehler

- `String.length()`
- `String.charAt(index)`
- `Throwable.getMessage()`
- `Object.toString()`

Diese können direkt durch TypeScript-/JavaScript-Operationen ersetzt werden.

## Vorgeschlagene Implementierungsreihenfolge

1. `Font`
2. `Image` und vollständiges Ressourcen-Preloading
3. `Graphics`
4. `GameCanvas`/`Canvas` mit synchronem `paint()`-Aufruf
5. `Command`
6. `InputStream` beziehungsweise direkter Ressourcenpuffer
7. `Hashtable` durch Wrapper um `Map`
8. `RecordStore`
9. `Manager`, `Player`, `PlayerListener`
10. MIDlet-Lebenszyklus und Thread-/Zeit-Hilfen

Damit kann `b.java` mechanisch portiert werden, ohne eine vollständige J2ME-Implementierung zu bauen.

## Offene Prüfung

Dieses Inventar gilt exakt für `b.java`. Die Klasse `a.java` verwendet ebenfalls `Graphics` und `Font`; deren Methoden müssen separat inventarisiert werden. Erst danach ist die gemeinsame Rendering-Schicht für das gesamte Spiel vollständig definiert.
