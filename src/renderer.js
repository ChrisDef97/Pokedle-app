const statusEl = document.getElementById("status");
const newGameBtn = document.getElementById("new-game-btn");
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const guessBtn = document.getElementById("guess-btn");
const guessError = document.getElementById("guess-error");
const guessRows = document.getElementById("guess-rows");
const pokemonNamesList = document.getElementById("pokemon-names");

let pokemonList = []; // { id, name, sprite }
let gameOver = false;

// El sprite se guarda como "sprites/25.png" relativo a la carpeta data/,
// y este archivo vive en src/, así que hay que subir un nivel.
function spritePath(sprite) {
  return sprite ? `../data/${sprite}` : "";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function init() {
  const list = await window.pokedleAPI.getPokemonList();
  pokemonList = list;

  pokemonNamesList.innerHTML = "";
  for (const p of list) {
    const option = document.createElement("option");
    option.value = capitalize(p.name);
    pokemonNamesList.appendChild(option);
  }

  await startNewGame();
}

async function startNewGame() {
  guessRows.innerHTML = "";
  guessError.textContent = "";
  gameOver = false;
  guessInput.value = "";

  // Limpia el banner de victoria de una partida anterior, si lo hay.
  document.querySelectorAll(".win-banner").forEach((el) => el.remove());

  const result = await window.pokedleAPI.newGame();
  if (!result.ok) {
    statusEl.textContent = `Error al empezar partida: ${result.error}`;
    statusEl.style.color = "red";
    return;
  }

  statusEl.textContent = `¡Adivina el Pokémon! (${result.totalPokemon} posibles)`;
  statusEl.style.color = "";
  guessInput.disabled = false;
  guessBtn.disabled = false;
  guessInput.focus();
}

function arrowFor(direction) {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "";
}

function renderCell(field, formatValue) {
  const td = document.createElement("td");
  td.classList.add(`status-${field.status}`);
  const text = formatValue ? formatValue(field.value) : field.value;

  const valueSpan = document.createElement("span");
  valueSpan.textContent = text;
  td.appendChild(valueSpan);

  if (field.direction) {
    const arrow = document.createElement("span");
    arrow.classList.add("arrow");
    arrow.textContent = arrowFor(field.direction);
    td.appendChild(arrow);
  }

  return td;
}

function renderGuessRow(guessResult) {
  const row = document.createElement("tr");

  // Columna Pokémon (sprite + nombre)
  const pokemonCell = document.createElement("td");
  pokemonCell.classList.add("pokemon-cell");
  const img = document.createElement("img");
  img.src = spritePath(guessResult.sprite);
  img.alt = guessResult.name;
  const nameSpan = document.createElement("span");
  nameSpan.textContent = capitalize(guessResult.name);
  pokemonCell.appendChild(img);
  pokemonCell.appendChild(nameSpan);
  row.appendChild(pokemonCell);

  const f = guessResult.fields;
  row.appendChild(renderCell(f.type1));
  row.appendChild(renderCell(f.type2));
  row.appendChild(renderCell(f.evolutionStage));
  row.appendChild(renderCell(f.fullyEvolved, (v) => (v ? "Sí" : "No")));
  row.appendChild(renderCell(f.color));
  row.appendChild(
    renderCell(f.habitats, (v) => (v && v.length ? v.join(", ") : "—"))
  );
  row.appendChild(renderCell(f.generation));

  // Los intentos más recientes arriba, para verlos sin desplazarse.
  guessRows.prepend(row);
}

async function handleGuessSubmit(event) {
  event.preventDefault();
  if (gameOver) return;

  const name = guessInput.value.trim();
  if (!name) return;

  guessError.textContent = "";
  const response = await window.pokedleAPI.submitGuess(name);

  if (!response.ok) {
    guessError.textContent = response.error;
    return;
  }

  renderGuessRow(response.result);
  guessInput.value = "";
  guessInput.focus();

  if (response.result.isCorrectGuess) {
    gameOver = true;
    guessInput.disabled = true;
    guessBtn.disabled = true;

    const banner = document.createElement("div");
    banner.className = "win-banner";
    banner.textContent = `¡Correcto! Era ${capitalize(
      response.result.name
    )}. Lo lograste en ${response.guessesMade} intento(s).`;
    document.getElementById("app").appendChild(banner);
  }
}

guessForm.addEventListener("submit", handleGuessSubmit);
newGameBtn.addEventListener("click", startNewGame);

init();
