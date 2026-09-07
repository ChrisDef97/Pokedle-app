const { contextBridge, ipcRenderer } = require("electron");

// Todo lo que el renderer (HTML/JS de la interfaz) puede usar
// se define aquí explícitamente. Nada más queda expuesto.
contextBridge.exposeInMainWorld("pokedleAPI", {
  loadPokemonData: () => ipcRenderer.invoke("load-pokemon-data"),
});
