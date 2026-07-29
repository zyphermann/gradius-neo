# Gradius Neo TypeScript-Port

Eigenständige Browser-Portierung ohne Java ME, FreeJ2ME oder CheerpJ.

## Entwicklung

```sh
npm install
npm run dev
```

Die Entwicklungsseite läuft standardmäßig unter `http://localhost:4174`.

## Prüfungen

```sh
npm test
npm run build
```

Aktueller Stand:

- natives Canvas mit 176 × 220 logischen Pixeln
- ausschließlich ganzzahlige Skalierung
- Tastatur-/Fokusgrundlage
- Java-kompatible Integer-, Byte-, Short- und Shift-Hilfen
- alle 63 Originalressourcen mit generiertem Manifest
- synchron nutzbarer Ressourcen-Cache nach asynchronem Preloading
- `Font` mit den von Gradius Neo verwendeten Faces, Größen und Textmetriken
- `Image` mit synchronem J2ME-Zugriff auf 22 vorgeladene PNGs und mutable Offscreen-Canvas
- `Graphics` mit Farbe, Font, Clip, Translation, Anchors, Linien, Rechtecken, Text, Bildern und Bildregionen
- `Command`, `Canvas` und `GameCanvas` mit J2ME-Tastencodes und Repaint-Zyklus
- verhaltensgetreue TypeScript-Portierung der Hilfsklasse `a.java`
- erster `b.java`-Abschnitt: Konami-Bootzustand, Original-Titelgrafik und Tasteneingabe
- Parser für die binären `csv_*`-Spritekoordinaten; Titel und Menüzeiger nutzen Original-Sprites
- originaler Bitmap-Zeichensatz aus `img_c1` für die Hauptmenü-Beschriftungen
- MIDP-kompatibler `RecordStore` über `localStorage`; Store `R` lädt/erzeugt 78 Originalbytes
- funktionales Game-Setting-Menü für Difficulty, Auto Fire, Screen und Sound mit Speicherung
- portierter Game-Start/Stage-Select-Zustand auf Basis des freigeschalteten Levels in Save-Byte 3
- Decoder für Stage-Binärpakete mit Abschnittsoffsets, Geometrie, Scrollwerten und Ereignislisten
- originales zweilagiges Stage-1-Sternenfeld aus Palette und Positionsdaten der Ressource `c`
- Originalspielerschiff (Sprites 78/80/82 plus Triebwerk 44), D-Pad-Bewegung und Originalgrenzen
- Standardschuss mit Originalsprite 117, +32 Bewegung pro Tick, Zwei-Schuss-Limit und Auto-Fire
- erster Timeline-Spawnpfad: Formationstyp 43, Gegnertyp 47, Sprites 232–235 und Schusstreffer
- Gameplay-Translation `(-2, 20)` für 176×220 sowie Explosionen mit Originalframes 125–127
- scrollende Galaxie (Sprite 283) und beide Original-Power-up-Meter bei Y=168

Die LCDUI-Mini-Schicht liegt unter `src/j2me/lcdui`. `drawRegion()` unterstützt zunächst bewusst nur `TRANS_NONE`, da `b.java` ausschließlich diesen Transformationswert verwendet.

Die nächsten Schritte stehen in `PORTING_PLAN.md`. Die benötigte Mini-J2ME-Oberfläche ist in `J2ME_API_INVENTORY.md` dokumentiert.

Die wörtliche Gesamtportierung von `b.java` wird unter `src/game/direct` aufgebaut. Der bisherige spielbare Teil bleibt aktiv, bis der direkte `paint()`-/Update-Pfad vollständig übernommen wurde.
