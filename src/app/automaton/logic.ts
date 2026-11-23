/** Lógica central del simulador de autómatas finitos deterministas. */

import { Automaton, Run, formatSet, symbolsOf } from './automaton';

/** Lo que el usuario escribió en el Módulo 1, tal cual, antes de validarlo. */
export interface AutomatonDraft {
  states: string;
  alphabet: string;
  /** delta[q][a] es el texto escrito en la casilla δ(q, a). */
  delta: Record<string, Record<string, string>>;
  initial: string;
  finals: string;
}

export interface Parsed {
  items: string[];
  error?: string;
}

export interface DraftErrors {
  states?: string;
  alphabet?: string;
  delta?: Record<string, Record<string, string>>;
  initial?: string;
  finals?: string;
}

export interface ReadResult {
  automaton?: Automaton;
  errors: DraftErrors;
  warning?: string;
}

function readItems(answer: string): string[] {
  const text = answer.trim();
  return text ? text.split(',').map((item) => item.trim()) : [];
}

function repeated(items: string[]): string[] {
  const seen = new Set<string>();
  const found: string[] = [];
  for (const item of items) {
    if (seen.has(item) && !found.includes(item)) {
      found.push(item);
    }
    seen.add(item);
  }
  return found;
}

/** Q: al menos un estado, sin nombres vacíos ni repetidos. */
export function parseStates(answer: string): Parsed {
  const states = readItems(answer);
  if (states.length === 0 || states.includes('')) {
    return { items: states, error: 'Escriba al menos un estado y no deje nombres vacíos.' };
  }
  const twice = repeated(states);
  if (twice.length > 0) {
    return {
      items: states,
      error: `Los nombres de los estados no pueden repetirse: ${twice.join(', ')}.`,
    };
  }
  return { items: states };
}

/** Σ: al menos un símbolo, cada uno de un solo carácter y sin repetidos. */
export function parseAlphabet(answer: string): Parsed {
  const alphabet = readItems(answer);
  const long = alphabet.filter((symbol) => symbolsOf(symbol).length !== 1);
  if (alphabet.length === 0) {
    return { items: alphabet, error: 'Escriba al menos un símbolo.' };
  }
  if (long.length > 0) {
    return {
      items: alphabet,
      error: `Cada símbolo debe ser un solo carácter, y '${long[0]}' no lo es.`,
    };
  }
  const twice = repeated(alphabet);
  if (twice.length > 0) {
    return {
      items: alphabet,
      error: `Los símbolos del alfabeto no pueden repetirse: ${twice.join(', ')}.`,
    };
  }
  return { items: alphabet };
}

/** Una respuesta de δ(q, a) o de q0. Devuelve el mensaje de error, o nada si está en Q. */
export function checkState(answer: string, states: string[]): string | undefined {
  const state = answer.trim();
  if (states.includes(state)) {
    return undefined;
  }
  if (!state) {
    return `Escriba el nombre de un estado de Q = ${formatSet(states)}.`;
  }
  return `El estado ${state} no pertenece a Q = ${formatSet(states)}. Intente de nuevo.`;
}

/** F: cero o más estados de Q. */
export function parseFinals(answer: string, states: string[]): Parsed {
  const finals = readItems(answer);
  const unknown = finals.filter((state) => !states.includes(state));
  if (unknown.length > 0) {
    return {
      items: finals,
      error: `El estado ${unknown[0] || '(vacío)'} no pertenece a Q = ${formatSet(states)}. Intente de nuevo.`,
    };
  }
  return { items: finals };
}

/**
 * Módulo 1: valida Q, Σ, δ, q0 y F, en ese orden, y arma el autómata.
 *
 * δ, q0 y F solo se revisan si Q y Σ son válidos, porque dependen de ellos.
 * Si F queda vacío, el autómata se construye igual y se devuelve una advertencia.
 * Ningún dato inválido lanza una excepción: cada error vuelve como mensaje de su campo.
 */
export function readAutomaton(draft: AutomatonDraft): ReadResult {
  const errors: DraftErrors = {};
  const states = parseStates(draft.states);
  const alphabet = parseAlphabet(draft.alphabet);
  if (states.error) errors.states = states.error;
  if (alphabet.error) errors.alphabet = alphabet.error;
  if (states.error || alphabet.error) {
    return { errors };
  }

  // Sin prototipo: un estado se puede llamar constructor o __proto__, igual que en un dict de Python.
  const delta: Automaton['delta'] = Object.create(null);
  const deltaErrors: Record<string, Record<string, string>> = Object.create(null);
  for (const q of states.items) {
    delta[q] = {};
    for (const a of alphabet.items) {
      const answer = draft.delta[q]?.[a] ?? '';
      const error = checkState(answer, states.items);
      if (error) {
        (deltaErrors[q] ??= {})[a] = error;
      } else {
        delta[q][a] = answer.trim();
      }
    }
  }
  if (Object.keys(deltaErrors).length > 0) errors.delta = deltaErrors;

  const initialError = checkState(draft.initial, states.items);
  if (initialError) errors.initial = initialError;

  const finals = parseFinals(draft.finals, states.items);
  if (finals.error) errors.finals = finals.error;

  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  return {
    automaton: {
      states: states.items,
      alphabet: alphabet.items,
      delta,
      initial: draft.initial.trim(),
      finals: new Set(finals.items),
    },
    errors,
    warning:
      finals.items.length === 0
        ? 'Advertencia: F está vacío. El autómata no reconocerá ninguna palabra.'
        : undefined,
  };
}

/**
 * Módulo 3: recorre word desde m.initial aplicando δ símbolo a símbolo.
 *
 * Devuelve states = [q0, q1, ..., qn], con un estado más que símbolos tiene la palabra.
 * La palabra vacía da [m.initial]. Si word tiene un símbolo que no está en m.alphabet,
 * devuelve states vacío con el símbolo y su posición contada desde 1.
 */
export function runWord(m: Automaton, word: string): Run {
  const alphabet = new Set(m.alphabet);
  const states = [m.initial];
  let position = 0;
  for (const symbol of symbolsOf(word)) {
    position += 1;
    if (!alphabet.has(symbol)) {
      return { states: [], invalidSymbol: symbol, position };
    }
    states.push(m.delta[states[states.length - 1]][symbol]);
  }
  return { states };
}

/**
 * Módulo 2: las count palabras reconocidas más cortas, en orden canónico.
 *
 * Orden canónico: primero por longitud y, entre las de igual longitud, según el orden
 * de m.alphabet (no el orden alfabético). Se buscan palabras de longitud 0 a maxLength.
 * Cada elemento es [palabra, recorrido], donde recorrido es la lista de estados de
 * runWord. ε se devuelve como "". Si hay menos de count, devuelve las que encontró.
 */
export function findAccepted(m: Automaton, count = 5, maxLength = 10): [string, string[]][] {
  if (count <= 0 || maxLength < 0 || m.finals.size === 0) {
    return [];
  }

  // startsByLength[k] contiene los estados desde los que k símbolos
  // pueden llevar a un estado final.
  const startsByLength: Set<string>[] = [new Set(m.finals)];
  const accepted: [string, string[]][] = [];
  for (let length = 0; length <= maxLength; length++) {
    const possibleStarts = startsByLength[length];
    if (possibleStarts.size === 0) {
      break;
    }

    if (possibleStarts.has(m.initial)) {
      // La longitud va aparte porque word.length cuenta unidades UTF-16, no símbolos.
      const pending: [string, string, number][] = [[m.initial, '', 0]];
      while (pending.length > 0) {
        const [state, word, wordLength] = pending.pop()!;
        const remaining = length - wordLength;
        if (remaining === 0) {
          accepted.push([word, runWord(m, word).states]);
          if (accepted.length === count) {
            return accepted;
          }
          continue;
        }

        // La pila saca primero el último elemento que se agrega.
        for (const symbol of [...m.alphabet].reverse()) {
          const target = m.delta[state][symbol];
          if (startsByLength[remaining - 1].has(target)) {
            pending.push([target, word + symbol, wordLength + 1]);
          }
        }
      }
    }

    const previous = new Set<string>();
    for (const source of m.states) {
      for (const symbol of m.alphabet) {
        if (possibleStarts.has(m.delta[source][symbol])) {
          previous.add(source);
        }
      }
    }
    startsByLength.push(previous);
  }

  return accepted;
}

/**
 * Estados a los que se llega desde m.initial con alguna palabra. El Módulo 2 lo usa
 * para explicar por qué un autómata no reconoce ninguna palabra, como en A4.
 */
export function reachableStates(m: Automaton): Set<string> {
  const reached = new Set([m.initial]);
  const pending = [m.initial];
  while (pending.length > 0) {
    const state = pending.pop()!;
    for (const symbol of m.alphabet) {
      const target = m.delta[state][symbol];
      if (!reached.has(target)) {
        reached.add(target);
        pending.push(target);
      }
    }
  }
  return reached;
}
