/**
 * build-dataset.js
 * ------------------------------------------------------------
 * Descarga datos de la PokeAPI (https://pokeapi.co) UNA SOLA VEZ
 * y genera:
 *   - data/pokemon.json   -> dataset local con los campos que
 *                            necesita el juego (tipo, color,
 *                            etapa evolutiva, hábitat, gen...)
 *   - data/sprites/*.png  -> sprites descargados localmente
 *
 * Requisitos: Node.js 18+ (usa fetch nativo). Necesita internet
 * SOLO mientras se ejecuta este script. El resultado (data/) es
 * lo que empaquetaremos dentro de la app para que funcione offline.
 *
 * Uso:
 *   node build-dataset.js            -> todos los Pokémon (1-1025 aprox.)
 *   node build-dataset.js 1 151      -> solo un rango (ej. Gen 1)
 * ------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const API_BASE = "https://pokeapi.co/api/v2";
const OUT_DIR = path.join(__dirname, "data");
const SPRITES_DIR = path.join(OUT_DIR, "sprites");

// Rango de IDs de la Pokédex nacional a descargar (ajustable por CLI)
const START_ID = parseInt(process.argv[2] || "1", 10);
const END_ID = parseInt(process.argv[3] || "1025", 10);

// Pequeña pausa entre peticiones para no saturar la API pública
const DELAY_MS = 60;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Reintenta una petición varias veces antes de rendirse
async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(300 * attempt);
    }
  }
}

async function downloadImage(url, destPath) {
  if (!url) return false;
  const res = await fetch(url);
  if (!res.ok) return false;
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return true;
}

// Convierte "generation-i" -> 1, "generation-ix" -> 9, etc.
const ROMAN_TO_NUM = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5,
  vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
};
function generationToNumber(generationName) {
  const roman = generationName.replace("generation-", "");
  return ROMAN_TO_NUM[roman] || null;
}

// Recorre una cadena evolutiva y calcula:
//  - en qué etapa (1, 2, 3...) está cada especie
//  - si esa especie ya está totalmente evolucionada (no tiene "evolves_to")
function analyzeEvolutionChain(chain) {
  const stages = {}; // speciesName -> { stage, fullyEvolved }

  function walk(node, stage) {
    const name = node.species.name;
    const fullyEvolved = node.evolves_to.length === 0;
    stages[name] = { stage, fullyEvolved };
    for (const next of node.evolves_to) {
      walk(next, stage + 1);
    }
  }

  walk(chain, 1);
  return stages;
}

async function buildEntry(id) {
  const [pokemon, species] = await Promise.all([
    fetchJson(`${API_BASE}/pokemon/${id}`),
    fetchJson(`${API_BASE}/pokemon-species/${id}`),
  ]);

  const evoChainData = await fetchJson(species.evolution_chain.url);
  const evoStages = analyzeEvolutionChain(evoChainData.chain);
  const evoInfo = evoStages[species.name] || { stage: 1, fullyEvolved: true };

  const types = pokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name);

  const spriteUrl =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default ||
    null;

  const spriteFileName = `${id}.png`;
  const downloaded = await downloadImage(
    spriteUrl,
    path.join(SPRITES_DIR, spriteFileName)
  );

  return {
    id: pokemon.id,
    name: species.name,
    type1: types[0] ? capitalize(types[0]) : null,
    type2: types[1] ? capitalize(types[1]) : "None",
    evolutionStage: evoInfo.stage,
    fullyEvolved: evoInfo.fullyEvolved,
    color: species.color ? capitalize(species.color.name) : "Unknown",
    // Array preparado para poder curar manualmente varios hábitats más adelante.
    // Por ahora contiene el hábitat oficial de la PokeAPI si existe.
    habitats: species.habitat ? [capitalize(species.habitat.name)] : [],
    generation: generationToNumber(species.generation.name),
    sprite: downloaded ? `sprites/${spriteFileName}` : null,
  };
}

function capitalize(str) {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

async function main() {
  fs.mkdirSync(SPRITES_DIR, { recursive: true });

  const results = [];
  const failed = [];

  console.log(`Descargando Pokémon del ${START_ID} al ${END_ID}...`);

  for (let id = START_ID; id <= END_ID; id++) {
    try {
      const entry = await buildEntry(id);
      results.push(entry);
      process.stdout.write(
        `\r[${id}/${END_ID}] OK: ${entry.name.padEnd(20, " ")}`
      );
    } catch (err) {
      failed.push(id);
      process.stdout.write(`\r[${id}/${END_ID}] FALLÓ: ${err.message}\n`);
    }
    await sleep(DELAY_MS);

    // Guardado incremental cada 50 para no perder progreso si se corta
    if (id % 50 === 0) {
      fs.writeFileSync(
        path.join(OUT_DIR, "pokemon.json"),
        JSON.stringify(results, null, 2)
      );
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "pokemon.json"),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n\nListo. ${results.length} Pokémon guardados en data/pokemon.json`);
  if (failed.length) {
    console.log(`IDs que fallaron y puedes reintentar: ${failed.join(", ")}`);
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});