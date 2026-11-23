import { Automaton, orderedFinals } from './automaton';
import { DraftErrors, readAutomaton } from './logic';

const FORMAT = 'simulador-automatas';

export interface FileResult {
  automaton?: Automaton;
  warning?: string;
  error?: string;
}

export function toFile(m: Automaton): string {
  const content = {
    format: FORMAT,
    states: m.states,
    alphabet: m.alphabet,
    delta: m.delta,
    initial: m.initial,
    finals: orderedFinals(m),
  };
  return JSON.stringify(content, null, 2) + '\n';
}

const isTextList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function firstError(errors: DraftErrors): string {
  if (errors.states) return errors.states;
  if (errors.alphabet) return errors.alphabet;
  for (const [q, row] of Object.entries(errors.delta ?? {})) {
    for (const [a, message] of Object.entries(row)) return `δ(${q}, ${a}): ${message}`;
  }
  return errors.initial ?? errors.finals ?? '';
}

/** Lee un archivo con las mismas validaciones del Módulo 1. */
export function fromFile(text: string): FileResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: 'El archivo no es un JSON válido.' };
  }
  if (!isRecord(data) || data['format'] !== FORMAT) {
    return { error: 'El archivo no es un autómata guardado por este simulador.' };
  }
  const { states, alphabet, delta, initial, finals } = data;
  if (
    !isTextList(states) ||
    !isTextList(alphabet) ||
    !isTextList(finals) ||
    !isRecord(delta) ||
    typeof initial !== 'string'
  ) {
    return { error: 'Al archivo le falta alguno de los cinco elementos del autómata.' };
  }

  const cell = (q: string, a: string): string => {
    const row = Object.hasOwn(delta, q) ? delta[q] : undefined;
    const target = isRecord(row) && Object.hasOwn(row, a) ? row[a] : '';
    return typeof target === 'string' ? target : '';
  };
  const { automaton, errors, warning } = readAutomaton({
    states: states.join(', '),
    alphabet: alphabet.join(', '),
    delta: Object.fromEntries(
      states.map((q) => [q, Object.fromEntries(alphabet.map((a) => [a, cell(q, a)]))]),
    ),
    initial,
    finals: finals.join(', '),
  });
  if (!automaton) return { error: firstError(errors) };

  // El formulario separa por comas: un nombre con coma se partiría en dos estados.
  if (
    automaton.states.length !== states.length ||
    automaton.alphabet.length !== alphabet.length ||
    automaton.states.some((q, i) => q !== states[i]) ||
    automaton.alphabet.some((a, i) => a !== alphabet[i])
  ) {
    return { error: 'Los nombres no pueden tener comas ni espacios en los extremos.' };
  }
  return { automaton, warning };
}
