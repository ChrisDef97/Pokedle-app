const { contextBridge, ipcRenderer } = require("electron");

// Todo lo que el renderer puede usar se define aquí explícitamente.
contextBridge.exposeInMainWorld("pokedleAPI", {
  getPokemonList: () => ipcRenderer.invoke("get-pokemon-list"),
  newGame: (options) => ipcRenderer.invoke("new-game", options),
  submitGuess: (guessName) => ipcRenderer.invoke("submit-guess", guessName),
  revealTarget: () => ipcRenderer.invoke("reveal-target"),
});
