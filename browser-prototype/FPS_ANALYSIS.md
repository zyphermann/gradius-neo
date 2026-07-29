# Framerate-Analyse

## Originalschleife

Die Methode `b.run()` führt pro Durchlauf folgende Schritte aus:

1. Startzeit speichern.
2. `repaint()` aufrufen.
3. Mit `serviceRepaints()` synchron auf das Ende von `paint()` warten.
4. Musik-, Pause- und weitere Zustandsmethoden ausführen.
5. Vergangene Zeit messen.
6. Bis zu einer Gesamtdauer von 100 ms schlafen.

Der relevante Originalcode lautet:

```java
this.h = System.currentTimeMillis() - u[0];
if (this.h < 100L && this.h > 0L) {
    Thread.sleep(100L - this.h);
}
```

Das ergibt nominell 10 FPS. In den Zuständen `15`, `18` und `19` wird der Sleep übersprungen, weshalb eine Messung zeitweise höher ausfallen kann.

## Experimentelle Änderung

Die Datei `tools/patch-frame-period.mjs` ändert im Constant Pool von `b.class` ausschließlich den Long-Wert `100` auf `16`. Beide Bytecode-Verwendungen in `run()` referenzieren denselben Constant-Pool-Eintrag. Daraus ergibt sich ein theoretisches Maximum von 62,5 Durchläufen pro Sekunde; mit Browser- und Emulatoraufwand sollte es nahe 60 liegen.

## Einschränkung

`paint()` enthält nicht nur Darstellung, sondern erhöht unter anderem `s[9]` und führt große Teile der Animation und Spiellogik aus. Eine sechsmal höhere Schleifenrate beschleunigt daher auch Bewegung, Animationen, Gegner und möglicherweise Kollisionen.

Echte 60 FPS bei originaler Spielgeschwindigkeit erfordern später eine Trennung:

- Logik weiterhin ungefähr alle 100 ms aktualisieren.
- Darstellung per `requestAnimationFrame` mit 60 Hz ausgeben.
- Bewegungen zwischen zwei Logikzuständen interpolieren.

Die Bytecode-Variante dient zunächst dazu, das Verhalten und die Leistungsgrenze praktisch zu prüfen.

## Bewegungsanalyse

Die wichtigsten Objektpositionen werden überwiegend in zwei Bereichen des globalen Arrays `s` geführt:

- `s[5630 + entity]`: X-Position im 4-Bit-Fixed-Point-Format
- `s[6142 + entity]`: Y-Position im 4-Bit-Fixed-Point-Format

Die Hilfsmethoden um `b.java:772–776` addieren Bewegungsvektoren auf diese Werte und verschieben das Ergebnis anschließend um vier Bits. Eine Skalierung dieser beiden Methoden allein genügt jedoch nicht. Zahlreiche Gegnertypen verändern die Positionen, Geschwindigkeiten und Beschleunigungen direkt. Außerdem werden pro Frame unter anderem folgende Zustände fortgeschaltet:

- globaler Framezähler `s[9]`
- Objektalter und Animationsphasen
- Schussintervalle
- Gegner-Zustandsautomaten
- Beschleunigungen und Richtungsänderungen
- Spawn- und Kollisionslogik

Für 60 FPS bei unveränderter Geschwindigkeit müssten deshalb alle zeitbezogenen Updates einen Faktor von ungefähr `1/6` erhalten. Ganzzahlige Zustandszähler benötigen stattdessen einen 10-Hz-Logiktakt. Eine pauschale Bytecode-Konstante kann das nicht korrekt lösen.
