const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { pickRandomTarget, compareGuess } = require("./src/game-logic.js");

const DATA_PATH = path.join(__dirname, "data", "pokemon.json");

let mainWindow;
let pokemonData = [];

// Estado del juego actual. Vive SOLO en el proceso principal:
// el renderer nunca tiene acceso directo a `currentTarget`.
let currentTarget = null;
let guessesMade = 0;

function loadPokemonData() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  pokemonData = JSON.parse(raw);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: "Pokedle Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
  // mainWindow.webContents.openDevTools();
}

// --- IPC: lo que el renderer puede pedir ---

// Lista de nombres (+ sprite/id) para el autocompletado. No revela nada del objetivo.
ipcMain.handle("get-pokemon-list", () => {
  return pokemonData.map((p) => ({ id: p.id, name: p.name, sprite: p.sprite }));
});

// Empieza una partida nueva: elige objetivo oculto y resetea el contador.
ipcMain.handle("new-game", (event, options = {}) => {
  try {
    currentTarget = pickRandomTarget(pokemonData, options);
    guessesMade = 0;
    return { ok: true, totalPokemon: pokemonData.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Procesa un intento: busca el Pokémon adivinado y lo compara contra el objetivo oculto.
ipcMain.handle("submit-guess", (event, guessName) => {
  if (!currentTarget) {
    return { ok: false, error: "No hay ninguna partida activa. Empieza una con 'new-game'." };
  }

  const guess = pokemonData.find(
    (p) => p.name.toLowerCase() === String(guessName).toLowerCase()
  );

  if (!guess) {
    return { ok: false, error: `No se encontró ningún Pokémon llamado "${guessName}".` };
  }

  guessesMade += 1;
  const result = compareGuess(guess, currentTarget);

  return {
    ok: true,
    result,
    guessesMade,
  };
});

// Revela el objetivo (para cuando el jugador se rinde, o al ganar, para mostrar detalles).
ipcMain.handle("reveal-target", () => {
  if (!currentTarget) return { ok: false, error: "No hay partida activa." };
  return { ok: true, target: currentTarget };
});

app.whenReady().then(() => {
  loadPokemonData();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
