const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Ruta al dataset generado por build-dataset.js
const DATA_PATH = path.join(__dirname, "data", "pokemon.json");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: "Pokedle Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // seguridad: el renderer no toca Node directamente
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));

  // Descomenta para depurar con las DevTools abiertas:
  // mainWindow.webContents.openDevTools();
}

// El renderer pedirá los datos a través de esto (ver preload.js)
ipcMain.handle("load-pokemon-data", () => {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return { ok: true, data: JSON.parse(raw) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
