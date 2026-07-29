# Gradius Neo – dekompilierte JAR

Quelle: `../gradius_neo_176x220-71722.jar`

SHA-256: `714701042f16190916e5ea977408f8f4c9b3b0d5928cba301ad52aef0f17c12d`

## Verzeichnisse

- `src/`: primäre, mit Vineflower 1.11.1 dekompilierte Java-Quellen
- `resources/`: alle 63 Nicht-Class-Dateien aus der JAR
- `original_contents/`: vollständig entpackter Originalinhalt einschließlich Class-Dateien
- `cfr-src/`: alternative CFR-0.152-Ausgabe; in `b.java` konnte CFR eine Methode nicht rekonstruieren
- `vineflower-src/`: unveränderte Gesamtausgabe von Vineflower einschließlich Ressourcen

Die JAR enthält drei Klassen: `GradiusNeo`, `a` und `b`. Für alle drei liegen Java-Dateien in `src/` vor.

## Hinweis

Dekompilierung stellt nicht den ursprünglichen Quelltext exakt wieder her. Kommentare, ursprüngliche lokale Variablennamen und Formatierung fehlen; außerdem sind Klassen- und Membernamen in dieser JAR bereits stark verkürzt. Zum Kompilieren werden passende J2ME-Bibliotheken für MIDP 2.0 und CLDC 1.0 benötigt.
