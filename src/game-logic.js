/**
 * game-logic.js
 * ------------------------------------------------------------
 * Lógica pura del modo clásico de Pokedle. No depende de Electron,
 * así que se puede testear con Node normal y reutilizar tanto en
 * el proceso principal como en tests.
 * ------------------------------------------------------------
 */

const STATUS = {
  CORRECT: "correct", // verde
  PARTIAL: "partial", // naranja (ej. tipo correcto pero en el otro slot)
  WRONG: "wrong", // rojo
};

const DIRECTION = {
  UP: "up", // el objetivo tiene un valor MAYOR que el guess
  DOWN: "down", // el objetivo tiene un valor MENOR que el guess
  NONE: null,
};

/** Elige un Pokémon aleatorio del dataset, opcionalmente filtrado por generación. */
function pickRandomTarget(pokemonList, options = {}) {
  const { generations } = options; // ej. [1, 2] o undefined = todas

  const pool =
    generations && generations.length > 0
      ? pokemonList.filter((p) => generations.includes(p.generation))
      : pokemonList;

  if (pool.length === 0) {
    throw new Error("No hay Pokémon disponibles con los filtros indicados.");
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/** Compara un tipo del guess contra ambos tipos del objetivo. */
function compareType(guessType, targetType1, targetType2) {
  if (guessType === "None" && targetType1 !== "None" && targetType2 === "None") {
    // el guess no tiene segundo tipo y el objetivo tampoco -> se resuelve en compareTypes
  }
  if (guessType === targetType1 || (guessType === targetType2 && guessType !== "None")) {
    return guessType === targetType1 ? STATUS.CORRECT : STATUS.PARTIAL;
  }
  return STATUS.WRONG;
}

function compareTypes(guess, target) {
  // Type 1 del guess: verde si coincide con type1 del objetivo,
  // naranja si coincide con type2 del objetivo (está pero en otro slot), rojo si no.
  const type1Status =
    guess.type1 === target.type1
      ? STATUS.CORRECT
      : guess.type1 === target.type2 && guess.type1 !== "None"
      ? STATUS.PARTIAL
      : STATUS.WRONG;

  const type2Status =
    guess.type2 === target.type2
      ? STATUS.CORRECT
      : guess.type2 === target.type1 && guess.type2 !== "None"
      ? STATUS.PARTIAL
      : STATUS.WRONG;

  return { type1: type1Status, type2: type2Status };
}

/** Comparación exacta simple (igual/distinto). */
function compareExact(guessValue, targetValue) {
  return guessValue === targetValue ? STATUS.CORRECT : STATUS.WRONG;
}

/** Comparación numérica/ordinal con flecha indicando hacia dónde está el objetivo. */
function compareOrdinal(guessValue, targetValue) {
  if (guessValue === targetValue) {
    return { status: STATUS.CORRECT, direction: DIRECTION.NONE };
  }
  return {
    status: STATUS.WRONG,
    direction: targetValue > guessValue ? DIRECTION.UP : DIRECTION.DOWN,
  };
}

/** Compara arrays de hábitats por solapamiento de conjuntos. */
function compareHabitats(guessHabitats = [], targetHabitats = []) {
  if (guessHabitats.length === 0 && targetHabitats.length === 0) {
    return STATUS.CORRECT;
  }

  const guessSet = new Set(guessHabitats);
  const targetSet = new Set(targetHabitats);

  const sameSize = guessSet.size === targetSet.size;
  const allMatch = [...guessSet].every((h) => targetSet.has(h));
  if (sameSize && allMatch) return STATUS.CORRECT;

  const hasOverlap = [...guessSet].some((h) => targetSet.has(h));
  return hasOverlap ? STATUS.PARTIAL : STATUS.WRONG;
}

/**
 * Compara un Pokémon adivinado contra el objetivo y devuelve el
 * resultado fila por fila, listo para pintar en la tabla de pistas.
 */
function compareGuess(guess, target) {
  const types = compareTypes(guess, target);
  const evolutionStage = compareOrdinal(guess.evolutionStage, target.evolutionStage);
  const generation = compareOrdinal(guess.generation, target.generation);

  return {
    id: guess.id,
    name: guess.name,
    sprite: guess.sprite,
    isCorrectGuess: guess.id === target.id,
    fields: {
      type1: { value: guess.type1, status: types.type1 },
      type2: { value: guess.type2, status: types.type2 },
      evolutionStage: {
        value: guess.evolutionStage,
        status: evolutionStage.status,
        direction: evolutionStage.direction,
      },
      fullyEvolved: {
        value: guess.fullyEvolved,
        status: compareExact(guess.fullyEvolved, target.fullyEvolved),
      },
      color: {
        value: guess.color,
        status: compareExact(guess.color, target.color),
      },
      habitats: {
        value: guess.habitats,
        status: compareHabitats(guess.habitats, target.habitats),
      },
      generation: {
        value: guess.generation,
        status: generation.status,
        direction: generation.direction,
      },
    },
  };
}

module.exports = {
  STATUS,
  DIRECTION,
  pickRandomTarget,
  compareGuess,
};
