const statusEl = document.getElementById("status");

async function init() {
  const result = await window.pokedleAPI.loadPokemonData();

  if (!result.ok) {
    statusEl.textContent = `Error cargando el dataset: ${result.error}`;
    statusEl.style.color = "red";
    return;
  }

  const count = result.data.length;
  statusEl.textContent = `Dataset cargado correctamente: ${count} Pokémon disponibles.`;
}

init();
