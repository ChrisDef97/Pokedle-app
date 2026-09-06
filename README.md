# Pokedle Desktop

Clon de [Pokedle](https://pokedle.com/classic) como aplicación de escritorio
para Windows (`.exe`), 100% funcional sin conexión a internet tras la
instalación inicial.

## Estado del proyecto

- [x] Fase 2 — Script de extracción de datos (`build-dataset.js`)
- [ ] Fase 1 — Estructura del proyecto Electron
- [ ] Fase 3 — Lógica del juego (modo clásico)
- [ ] Fase 4 — Racha/estadísticas, Pokédex, cartas, leaderboard local
- [ ] Fase 5 — Pulido visual y build final del `.exe`

## Stack

- Electron + electron-builder
- Datos de [PokeAPI](https://pokeapi.co), descargados una única vez y
  guardados localmente en `data/`

## Generar el dataset local

```bash
node build-dataset.js            # todos los Pokémon
node build-dataset.js 1 151      # solo un rango (ej. Gen 1)
```

Esto genera `data/pokemon.json` y `data/sprites/*.png`, necesarios para
que el juego funcione offline.

## Desarrollo

_(Pendiente: se documentará cuando se inicialice el proyecto Electron en la Fase 1)_
