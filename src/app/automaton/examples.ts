import { Automaton } from './automaton';

/** Autómatas de prueba de la tabla 1 del requerimiento (sección 7). */

function build(
  states: string[],
  alphabet: string[],
  rows: Record<string, string[]>,
  initial: string,
  finals: string[],
): Automaton {
  const delta: Automaton['delta'] = {};
  for (const q of states) {
    delta[q] = {};
    alphabet.forEach((a, i) => (delta[q][a] = rows[q][i]));
  }
  return { states, alphabet, delta, initial, finals: new Set(finals) };
}

export function a1(): Automaton {
  return build(['q0', 'q1'], ['0', '1'], { q0: ['q1', 'q0'], q1: ['q0', 'q1'] }, 'q0', ['q0']);
}

export function a2(): Automaton {
  return build(
    ['s0', 's1', 's2'],
    ['a', 'b'],
    { s0: ['s1', 's0'], s1: ['s1', 's2'], s2: ['s1', 's0'] },
    's0',
    ['s2'],
  );
}

export function a3(): Automaton {
  return build(
    ['p0', 'p1', 'p2', 'p3', 'm'],
    ['a', 'b'],
    {
      p0: ['p1', 'p2'],
      p1: ['m', 'p3'],
      p2: ['p3', 'm'],
      p3: ['m', 'm'],
      m: ['m', 'm'],
    },
    'p0',
    ['p3'],
  );
}

export function a4(): Automaton {
  return build(['q0', 'q1'], ['a'], { q0: ['q0'], q1: ['q1'] }, 'q0', ['q1']);
}

const slide8 = () =>
  build(
    ['q0', 'q1', 'q2', 'q3'],
    ['a', 'b'],
    { q0: ['q0', 'q1'], q1: ['q2', 'q3'], q2: ['q3', 'q2'], q3: ['q3', 'q3'] },
    'q0',
    ['q2'],
  );

const slide9 = () =>
  build(
    ['a', 'b', 'c'],
    ['0', '1'],
    { a: ['b', 'a'], b: ['b', 'c'], c: ['c', 'b'] },
    'a',
    ['b'],
  );

const slide20 = () =>
  build(
    ['a', 'b', 'c', 'd'],
    ['0', '1', '2'],
    { a: ['a', 'b', 'd'], b: ['a', 'b', 'c'], c: ['c', 'd', 'a'], d: ['c', 'c', 'a'] },
    'a',
    ['a', 'd'],
  );

// Cada estado guarda el residuo: leer el bit b lleva de r a (2r + b) mod 3.
const divisibleBy3 = () =>
  build(
    ['r0', 'r1', 'r2'],
    ['0', '1'],
    { r0: ['r0', 'r1'], r1: ['r2', 'r0'], r2: ['r1', 'r2'] },
    'r0',
    ['r0'],
  );

const gameCombo = () =>
  build(
    ['c0', 'c1', 'c2', 'c3', 'c4'],
    ['a', 'd', 'f', 'p'],
    {
      c0: ['c1', 'c0', 'c0', 'c0'],
      c1: ['c1', 'c2', 'c0', 'c0'],
      c2: ['c1', 'c0', 'c3', 'c0'],
      c3: ['c1', 'c0', 'c0', 'c4'],
      c4: ['c1', 'c0', 'c0', 'c0'],
    },
    'c0',
    ['c4'],
  );

// La clave 1213 se solapa consigo misma: con 121 y un 2, lo leído termina en 12.
const keypadLock = () =>
  build(
    ['c0', 'c1', 'c2', 'c3', 'c4'],
    ['1', '2', '3', '4'],
    {
      c0: ['c1', 'c0', 'c0', 'c0'],
      c1: ['c1', 'c2', 'c0', 'c0'],
      c2: ['c3', 'c0', 'c0', 'c0'],
      c3: ['c1', 'c2', 'c4', 'c0'],
      c4: ['c1', 'c0', 'c0', 'c0'],
    },
    'c0',
    ['c4'],
  );

// d representa cualquier dígito, para no preguntar diez columnas de δ.
const decimalNumber = () =>
  build(
    ['ini', 'sig', 'ent', 'pto', 'dec', 'pozo'],
    ['d', '+', '-', '.'],
    {
      ini: ['ent', 'sig', 'sig', 'pozo'],
      sig: ['ent', 'pozo', 'pozo', 'pozo'],
      ent: ['ent', 'pozo', 'pozo', 'pto'],
      pto: ['dec', 'pozo', 'pozo', 'pozo'],
      dec: ['dec', 'pozo', 'pozo', 'pozo'],
      pozo: ['pozo', 'pozo', 'pozo', 'pozo'],
    },
    'ini',
    ['ent', 'dec'],
  );

export interface Example {
  key: string;
  description: string;
  create: () => Automaton;
}

export interface ExampleGroup {
  title: string;
  examples: Example[];
}

export const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    title: 'Tabla 1 del requerimiento',
    examples: [
      { key: 'A1', description: 'número par de ceros', create: a1 },
      { key: 'A2', description: 'palabras que terminan en ab', create: a2 },
      { key: 'A3', description: 'solo ab y ba', create: a3 },
      { key: 'A4', description: 'ninguna palabra', create: a4 },
    ],
  },
  {
    title: 'Diapositivas de la semana 15',
    examples: [
      { key: 'D8', description: 'a*bab*, con estado pozo', create: slide8 },
      { key: 'D9', description: 'un 0 y luego un número par de unos', create: slide9 },
      { key: 'D20', description: 'alfabeto de tres símbolos', create: slide20 },
    ],
  },
  {
    title: 'Ejemplos propios',
    examples: [
      { key: 'E1', description: 'binarios divisibles entre 3', create: divisibleBy3 },
      { key: 'E2', description: 'combo de videojuego adfp', create: gameCombo },
      { key: 'E3', description: 'cerradura con clave 1213', create: keypadLock },
      { key: 'E4', description: 'números decimales', create: decimalNumber },
    ],
  },
];
