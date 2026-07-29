# Gradius Neo – Browser-Emulator-Prototyp

Der Prototyp startet die unveränderte J2ME-JAR mit FreeJ2ME-Web im Browser.

## Start

```sh
cd browser-prototype
npm install
npm start
```

Danach `http://localhost:4173` öffnen. Der erste Start benötigt eine Internetverbindung, weil FreeJ2ME-Web die CheerpJ-Laufzeit von Leaning Technologies lädt.

Die Oberfläche verwendet bewusst den Einstieg `emulator/run` ohne `.html`, damit der lokale Server die App-Parameter bei seiner Clean-URL-Weiterleitung nicht verliert. Der Bildschirm wird ausschließlich ganzzahlig mit 1×, 2× oder 3× skaliert.

## Steuerung

- Pfeiltasten: Bewegung
- Enter: Aktion/Feuer
- F1 oder Q: linke Funktionstaste
- F2 oder W: rechte Funktionstaste
- Escape: Emulatoroptionen

Die Bildschirmtasten senden dieselben Ereignisse. Auf manchen Browsern muss zuerst einmal in den Spielbildschirm geklickt werden, damit Audio freigegeben wird.

## Bestandteile und Lizenzen

- Aktives Spiel-Bundle: `emulator/apps/Gradius_Neo.zip` (176×220, Nokia-Tastenprofil und Originalgeschwindigkeit)
- Experimentelles Bundle: `emulator/apps/Gradius_Neo_60FPS.zip` (16-ms-Framezyklus; Spiellogik läuft dadurch zu schnell)
- Unveränderte JAR im Bundle sowie als `emulator/jar/gradius-neo.jar`
- Emulator: [zb3/freej2me-web](https://github.com/zb3/freej2me-web), GPL-3.0 und weitere Komponenten; siehe `EMULATOR-LICENSE.txt`
- Browser-JVM: CheerpJ, extern geladen; dessen Nutzungsbedingungen gelten zusätzlich

Dies ist ein lokaler technischer Prototyp. Eine öffentliche Bereitstellung des Spiels setzt entsprechende Rechte an Code, Grafik, Musik und Marken voraus.

Die Analyse der originalen 100-ms-Hauptschleife und die Einschränkungen der experimentellen 60-FPS-Änderung stehen in `FPS_ANALYSIS.md`.
