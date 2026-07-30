# Symbolkatalog der direkten `b.java`-Portierung

Diese Datei dokumentiert nur Namen, deren Bedeutung durch Datenfluss und Aufrufer bestätigt ist. Die aktive Spielquelle ist `GradiusNeoGame.ts`; weitere Umbenennungen werden direkt dort vorgenommen und über Git versioniert.

## Zentrale Felder

| Original | Semantischer Name         | Bedeutung                                                                |
| -------- | ------------------------- | ------------------------------------------------------------------------ |
| `b.s`    | `b.state`                 | Globaler, 9.790 Einträge großer Spielzustand                             |
| `b.a`    | `b.runtimeFlags`          | Asynchrone Audio-, Pause- und Laufzeitflags                              |
| `b.u`    | `b.timestamps`            | Zeitstempel der Hauptschleife                                            |
| `b.t`    | `b.stageEventScript`      | Dekodierte 16-Bit-Befehle für Gegner-Spawns und Stage-Ablauf             |
| `b.b`    | `b.screenState`           | Aktueller Bildschirm-/Spielmodus                                         |
| `b.y`    | `b.resourceBuffer`        | Puffer für binäre CSV-/Spieldaten                                        |
| `b.B`    | `b.spriteRegions`         | Gepackte Sprite-Rechtecke                                                |
| `b.H`    | `b.saveData`              | 78 Byte RMS-Spielstand                                                   |
| `this.m` | `this.running`            | Hauptschleife läuft                                                      |
| `this.i` | `this.heldInputBits`      | Aktuell gehaltene Eingabebits                                            |
| `this.j` | `this.releasedInputBits`  | Seit dem letzten Tick losgelassene Eingaben                              |
| `this.K` | `this.instructionsText`   | Vollständiger Text der Hilfe-/Instructions-Seite                         |
| `this.n` | `this.endingCreditsPages` | Abschlussmeldung, Staff-Credits und letzte „See You Again“-Seite         |
| `this.d` | `this.bgmTrackTitles`     | Angezeigte Titel der neun BGM-Stücke im Sound-Test                       |
| `this.f` | `this.spriteSheets`       | Sechs geladene Bildatlanten, aus denen `spriteRegions` gezeichnet werden |
| `b.E`    | `b.softKeyCommands`       | MIDP-Command-Definitionen für die beiden Softkey-Beschriftungen          |
| `this.F` | `this.leftSoftKeyLabel`   | Text des linken Softkeys                                                 |
| `this.G` | `this.rightSoftKeyLabel`  | Text des rechten Softkeys                                                |

## Bestätigte Bildschirmzustände

|      Wert | Bedeutung                                  |
| --------: | ------------------------------------------ |
|       `1` | Spielstand und Basisdaten laden            |
|       `2` | Titelressourcen laden                      |
|       `5` | Hauptmenü vorbereiten                      |
|       `6` | Hauptmenü                                  |
|       `7` | Menü-Übergangsanimation                    |
|       `8` | Instructions                               |
|       `9` | Options-Menü                               |
|      `10` | Gameplay-Optionen                          |
|      `11` | Highscores                                 |
|      `12` | Steuerungs-/Power-up-Optionen              |
|      `13` | Neues Spiel / Stage-Auswahl                |
|      `14` | Continue-/Ergebnisablauf                   |
|      `15` | Neuen Spieldurchlauf initialisieren        |
|   `16–17` | Gespeichertes Spiel laden und bestätigen   |
|   `18–19` | Stage-Ladeanzeige und Stage initialisieren |
|      `20` | Aktives Gameplay                           |
|   `21–22` | Game Over / Continue                       |
|   `23–24` | Ending und Credits                         |
|      `26` | Sound-Test                                 |
|     `191` | Stage-Startanzeige                         |
|     `200` | About-Seite                                |
|     `201` | Exit-Abfrage im Hauptmenü                  |
| `203–205` | Pause-/Exit-Ablauf während des Gameplays   |
|     `206` | Initialisierung/KONAMI laden               |
|     `207` | KONAMI-Logo anzeigen                       |
|     `208` | Übergang zum GRADIUS-NEO-Titel             |
|     `999` | Anwendung beenden                          |

Diese Werte stehen im Code als `ScreenState`, beispielsweise
`ScreenState.Gameplay` und `ScreenState.EndingCredits`. Einige Fälle fallen
absichtlich in den nächsten Zustand durch, etwa Laden-Anzeige `18` → Stage
initialisieren `19`.

## Eingabebits in `state`

| Index | Bedeutung                                  |
| ----: | ------------------------------------------ |
|   `9` | Globaler Logik-/Animationszähler           |
|  `11` | Im aktuellen Tick gehaltene Eingaben       |
|  `12` | Neu gedrückte Eingaben des aktuellen Ticks |
|  `13` | Sammelpuffer aus `keyPressed()`            |

Wichtige Bits: `2/64/4/32` = hoch/runter/links/rechts, `256` = FIRE/Bestätigen, `1024` = Taste 0/Schuss, `4194304` = linkes Power-up, `8388608` = rechtes Power-up.

Diese Werte stehen im generierten Code jetzt als `StateSlot` und `InputBit`, beispielsweise:

```ts
(b.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0;
```

`InputBit.RightSoftKey` entspricht MIDP-Keycode `-7`, im Browser also `F2` oder `W`.

## Spielerzustand in `state`

Bestätigte globale Einträge werden in `GradiusNeoGame.ts` über `StateSlot`
adressiert, beispielsweise `StateSlot.Score`, `StateSlot.CameraOffsetY` und
`StateSlot.SelectedPowerUp`. Rohe Zahlen bleiben nur dort stehen, wo die
Bedeutung noch nicht ausreichend belegt ist.

|       Index | Vorläufig bestätigte Bedeutung                 |
| ----------: | ---------------------------------------------- |
|        `16` | Punktestand                                    |
|        `17` | verbleibende Schiffe/Leben                     |
|        `21` | Auto-Fire-Einstellung                          |
|        `54` | vertikaler Kamera-/Stage-Offset                |
|        `59` | Schiffsgeschwindigkeit                         |
|        `60` | aktive Waffenstufe/-art                        |
|        `61` | Missile-Zustand                                |
|        `62` | Schildenergie                                  |
|        `65` | Anzahl Optionen                                |
|        `76` | Spawn-, Unverwundbarkeits- und Explosionsphase |
|      `1126` | X-Position des Schiffs                         |
|      `1143` | Y-Position des Schiffs                         |
| `1160–1164` | X-Positionen Schiff/Optionen                   |
| `1165–1169` | Y-Positionen Schiff/Optionen                   |

## Stage-Skript und Timing

| Index/Bereich                | Bedeutung                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `stageEventScript[3656 + …]` | Befehlsstrom der aktuell geladenen Stage                                      |
| `state[50]`                  | Fortschritt bis zum nächsten Stage-Event; steigt derzeit um `8` pro Logiktick |
| `state[51]`                  | Leseposition im Stage-Eventskript                                             |

Das obere Byte eines Scriptwortes enthält Opcode bzw. Entity-Typ. Untere Bits enthalten Position, Flags oder Wartezeit. Die Kopplung von `state[50] += 8` an jeden Logiktick ist ein zentraler Kandidat für eine spätere zeitbasierte Skalierung.

## Entity-Pool

Die bestätigten Spalten des Pools stehen im Code als `EntityField`, etwa
`EntityField.Type + entityId`, `EntityField.X + entityId` und
`EntityField.Health + entityId`.

| Bereich         | Bedeutung                               |
| --------------- | --------------------------------------- |
| `2028 + layer`  | Kopf der Entity-Liste pro Ebene         |
| `2046 + entity` | vorheriges Entity                       |
| `2558 + entity` | nächstes Entity                         |
| `3070 + entity` | Entity-Typ                              |
| `3582 + entity` | gerenderte X-Position                   |
| `4094 + entity` | gerenderte Y-Position                   |
| `5630 + entity` | X-Position im 4-Bit-Fixed-Point-Format  |
| `6142 + entity` | Y-Position im 4-Bit-Fixed-Point-Format  |
| `6654 + entity` | Entity-Alter/Zustandstimer              |
| `9214 + entity` | Trefferpunkte bzw. verbleibende Energie |

## Bereits verstandene Methoden

| Aktueller Name                       | Bedeutung                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `run()`                              | originale blockierende 100-ms-Hauptschleife                                          |
| `paint(Graphics)`                    | Rendering plus großer Teil der Zustandslogik                                         |
| `keyCodeToInputBit(int)`             | MIDP-Keycode in Eingabebit übersetzen                                                |
| `updatePrimaryEntities()`            | großer Gegner-/Entity-Update-Switch                                                  |
| `updateAuxiliaryEntities(Graphics)`  | gekoppelte Spezialobjekte, Laser und Bossbestandteile aktualisieren                  |
| `updatePlayerWeaponsAndCollisions()` | Spieler, Optionen, Waffen und Spielerkollision                                       |
| `calculateDirectionToPlayer(x,y)`    | quantisierten 64-stufigen Zielwinkel zum Spieler bestimmen                           |
| `rotateDirectionTowardPlayer(x,y,a)` | Winkel `a` um höchstens einen Schritt zum Spieler drehen                             |
| `advanceEntityX(entity,a,speed)`     | X-Fixed-Point-Position anhand der Winkeltabelle fortschreiben                        |
| `advanceEntityY(entity,a,speed)`     | Y-Fixed-Point-Position anhand der Winkeltabelle fortschreiben                        |
| `updateAdaptiveDifficulty()`         | dynamischen Schwierigkeits-/Ausrüstungswert in `state[25]` berechnen                 |
| `sampleTerrainCollision(x,y)`        | Weltpunkt gegen Terrain-Kollisionsmap prüfen                                         |
| `resolveEntityCollisions(...)`       | Trefferstärke für Entity-Rechteck ermitteln                                          |
| `applyEntityCollisionDamage(...)`    | Schaden, Zerstörung, Score und Folge-Entity abwickeln                                |
| `removePrimaryEntity(entityId)`      | aus Hauptliste lösen und in die Freiliste zurücklegen                                |
| `removeAuxiliaryEntity(entityId)`    | aus Auxiliary-Liste lösen und in die Freiliste zurücklegen                           |
| `loadSpriteSheet(slot,name)`         | Bildatlas und zugehörige `csv_*`-Regionen laden                                      |
| `unloadStageSpriteSheets()`          | Stage-/Titel-Atlanten in Slots 2 bis 5 freigeben                                     |
| `loadResourceIntoBuffer(path)`       | Binärressource in den gemeinsamen Ressourcenpuffer laden                             |
| `spawnEntity(type,x,y,params)`       | freien Entity-Slot belegen und initialisieren                                        |
| `spawnAuxiliaryEntity(type,x,y,p)`   | gekoppeltes Spezialobjekt in der zweiten Liste anlegen                               |
| `enqueueRenderCommand(...)`          | Renderkommando nach Layer sortiert einreihen                                         |
| `renderForegroundQueue(Graphics)`    | Render-Layer 4 bis 17 zeichnen und freigeben                                         |
| `renderBackgroundQueue(Graphics)`    | Render-Layer 0 bis 2 zeichnen und freigeben                                          |
| wiederholtes `drawRegion(...)`       | `drawSpriteRegion(graphics,sheet,region,x,y,anchor)`: gepackte XYWH-Region entpacken |
| `renderSoftKeyBar(Graphics)`         | untere Softkey-Leiste zeichnen                                                       |
| `setSoftKeyLabels(left,right)`       | Beschriftungen aus den MIDP-Commands wählen                                          |
| `drawBitmapGlyphRun(...)`            | zusammenhängende Folge vorberechneter Bitmap-Glyphen zeichnen                        |
| `drawBitmapText(...)`                | ASCII-Text über den Sprite-Font zeichnen                                             |
| `drawBitmapNumber(...)`              | rechtsbündige Zahl über den Sprite-Font zeichnen                                     |
| `drawDifficultyLabel(...)`           | Schwierigkeitsbezeichnung mit seitlichen Trennzeichen zeichnen                       |
| `renderInstructionsScreen(Graphics)` | scrollbare Anleitung darstellen                                                      |
| `renderAboutScreen(Graphics)`        | scrollbaren About-Text darstellen                                                    |
| `updatePauseMenu(Graphics)`          | Pausemenü zeichnen und Eingaben verarbeiten                                          |
| `synchronizeFormationWeapon()`       | Waffenmodus an Formation und Option-Anzahl anpassen                                  |
| `queueAudioPlayback(path,loops)`     | MIDI-Pfad und Wiederholungsmodus an den Audio-Zustandsautomaten übergeben            |

## Bildschirmkoordinaten

Die Spiellogik arbeitet intern mit `GAME_VIEW_WIDTH = 240` und
`GAMEPLAY_HEIGHT = 224`. Alle bisher verstreuten Render-Umrechnungen `* 3 / 4`
laufen jetzt über `toRenderPixels(...)`; deren zentraler Faktor ist
`RENDER_SCALE`. Im aktuellen Testmodus steht er auf `1`; damit entstehen
`RENDERED_GAME_VIEW_WIDTH = 240` und `RENDERED_GAMEPLAY_HEIGHT = 224`.

`SPRITE_SHEET_SCALE = 3/4` ist davon getrennt: Die vorhandenen PNG-Atlanten
sind bereits verkleinert. `toSpriteSheetPixels(...)` bestimmt deshalb das
Quellrechteck im Atlas, während `toRenderPixels(...)` die Zielposition und
Zielgröße auf dem Canvas bestimmt.

Für den nativen 240×224-Renderpfad muss damit nicht mehr nach arithmetischen
Einzelstellen gesucht werden. Canvas-Größe und UI-Bereich müssen noch auf den
neuen Modus abgestimmt werden. `src/runtime/render-config.ts` ist der zentrale
Umschalter. `RENDER_SCALE = 3/4` verwendet 176×220; `RENDER_SCALE = 1`
verwendet 240×294 mit einem 240×224-Weltbild und dem HUD darunter.

Einige UI-Koordinaten sind bereits als Pixelwerte des alten 3/4-Renderziels
hardcodiert. Bestätigte Stellen laufen über `fromLegacyRenderPixels(...)`; zum
Beispiel wird der alte HUD-Anfang `y = 168` dadurch zu `y = 224`. Diese Werte
dürfen nicht wie Weltkoordinaten behandelt werden.

### Von `spawnEntity` initialisierte Entity-Felder

| Bereich                                | Bedeutung                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `state[55]`                            | Kopf der Freiliste                                                        |
| `state[56]`                            | Kopf der primären aktiven Entity-Liste                                    |
| `state[57]`                            | Kopf der Auxiliary-Liste für Laser, Bossbestandteile und Stage-Mechaniken |
| `state[2046 + id]`                     | vorherige Entity-ID                                                       |
| `state[2558 + id]`                     | nächste Entity-ID                                                         |
| `state[3070 + id]`                     | Entity-Typ                                                                |
| `state[3582 + id]`, `state[4094 + id]` | ganzzahlige X-/Y-Position                                                 |
| `state[5630 + id]`, `state[6142 + id]` | X-/Y-Position als 4-Bit-Fixed-Point                                       |
| `state[6654 + id]`                     | Alter, initial `0`                                                        |
| `state[7166/7678/8190/8702 + id]`      | vier Bytes aus `packedParameters`                                         |
| `state[9214 + id]`                     | Energie/Lebenspunkte, initial `1`                                         |

## Timing-Ziel

Die nächsten Analyseschritte trennen Werte in drei Gruppen:

1. kontinuierliche Position/Geschwindigkeit – für Delta-Time oder Fixed-Point-Skalierung geeignet;
2. diskrete Zustandsautomaten und Spawnzähler – müssen auf einem festen Logiktakt bleiben;
3. reine Animation – kann unabhängig mit 60 Hz fortgeschaltet werden.
