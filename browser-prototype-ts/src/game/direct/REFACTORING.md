# Refactoring der direkten Portierung

Die Migration erhält zunächst das originale `Int32Array` als kanonisches
Speicherlayout. Neue Systeme arbeiten über Views auf demselben Array; dadurch
entstehen weder Kopien noch Synchronisationsfehler.

## Integrierte Module

- `state/GameState.ts`: benannte globale Slots und `EntityView`
- `entities/EntityPool.ts`: Freiliste sowie primäre und Auxiliary-Listen
- `render/RenderQueue.ts`: typisierte Renderkommandos über dem alten Layout
- `audio/AudioSystem.ts`: Player-Cache und Audio-Zustandsautomat

## Migrationsregeln

1. Jede Extraktion muss zunächst dasselbe Arraylayout bedienen.
2. Erst nach erfolgreicher Extraktion werden statische Aufrufe zu
   Instanzabhängigkeiten.
3. Update und Rendering werden erst getrennt, wenn Entity-, Player-, Stage- und
   Menülogik eigene Grenzen besitzen.
4. Ein Arraybereich wird erst durch echte Objekte ersetzt, wenn keine
   unverstandenen direkten Zugriffe mehr existieren.

## Nächste Extraktionen

1. zusammengehörige Fälle aus `updatePrimaryEntities()`
2. `CollisionSystem` und `PlayerSystem`
3. `StageSystem`
4. Screen-Handler aus `paint()`
5. Trennung von `update()` und `render()`
6. Entfernung der verbleibenden statischen Zustandszugriffe
