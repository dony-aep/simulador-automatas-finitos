/** Tablas 1 y 2 del requerimiento (sección 7) y la sesión de la sección 4.3. */

import { Automaton } from './automaton';
import { a1, a2, a3, a4 } from './examples';
import {
  AutomatonDraft,
  checkState,
  findAccepted,
  parseAlphabet,
  parseFinals,
  parseStates,
  reachableStates,
  readAutomaton,
  runWord,
} from './logic';
import { draftOf } from './store';

const words = (m: Automaton) => findAccepted(m).map(([w]) => w);

describe('Módulo 2 (tabla 1)', () => {
  it('A1', () => expect(words(a1())).toEqual(['', '1', '00', '11', '001']));

  it('A2', () => expect(words(a2())).toEqual(['ab', 'aab', 'bab', 'aaab', 'abab']));

  it('A2, recorridos', () => {
    expect(findAccepted(a2())[4]).toEqual(['abab', ['s0', 's1', 's2', 's1', 's2']]);
  });

  it('A3 solo reconoce dos', () => expect(words(a3())).toEqual(['ab', 'ba']));

  it('A4 no reconoce ninguna', () => {
    expect(words(a4())).toEqual([]);
    expect(reachableStates(a4()).has('q1')).toBe(false);
  });

  it('usa el orden del alfabeto, no el orden alfabético', () => {
    const m = a2();
    m.alphabet = ['b', 'a'];
    expect(words(m).slice(0, 3)).toEqual(['ab', 'bab', 'aab']);
  });
});

describe('Módulo 1 (sección 4.3)', () => {
  it('rechaza cada error de la sesión de A2 con su mensaje', () => {
    expect(parseStates('').error).toBe('Escriba al menos un estado y no deje nombres vacíos.');
    expect(parseStates('s0, s1, s0').error).toBe(
      'Los nombres de los estados no pueden repetirse: s0.',
    );
    expect(parseAlphabet('').error).toBe('Escriba al menos un símbolo.');
    expect(parseAlphabet('ab, b').error).toBe("Cada símbolo debe ser un solo carácter, y 'ab' no lo es.");
    expect(parseAlphabet('a, a').error).toBe('Los símbolos del alfabeto no pueden repetirse: a.');

    const q = ['s0', 's1', 's2'];
    expect(checkState('s5', q)).toBe('El estado s5 no pertenece a Q = {s0, s1, s2}. Intente de nuevo.');
    expect(checkState('s9', q)).toBe('El estado s9 no pertenece a Q = {s0, s1, s2}. Intente de nuevo.');
    expect(parseFinals('s7', q).error).toBe(
      'El estado s7 no pertenece a Q = {s0, s1, s2}. Intente de nuevo.',
    );
  });

  it('con las respuestas corregidas construye A2', () => {
    const draft: AutomatonDraft = {
      states: 's0, s1, s2',
      alphabet: 'a, b',
      delta: {
        s0: { a: 's1', b: 's0' },
        s1: { a: 's1', b: 's2' },
        s2: { a: 's1', b: 's0' },
      },
      initial: 's0',
      finals: 's2',
    };
    const result = readAutomaton(draft);
    expect(result.errors).toEqual({});
    expect(result.automaton).toEqual(a2());
    expect(result.warning).toBeUndefined();
  });

  it('marca cada casilla de δ que no está en Q', () => {
    const result = readAutomaton({
      states: 'q0, q1',
      alphabet: 'a',
      delta: { q0: { a: 'q5' }, q1: { a: '' } },
      initial: 'q0',
      finals: 'q1',
    });
    expect(result.automaton).toBeUndefined();
    expect(result.errors.delta).toEqual({
      q0: { a: 'El estado q5 no pertenece a Q = {q0, q1}. Intente de nuevo.' },
      q1: { a: 'Escriba el nombre de un estado de Q = {q0, q1}.' },
    });
  });

  it('F vacío construye el autómata y advierte', () => {
    const result = readAutomaton({
      states: 'q0',
      alphabet: 'a',
      delta: { q0: { a: 'q0' } },
      initial: 'q0',
      finals: '',
    });
    expect(result.automaton?.finals).toEqual(new Set());
    expect(result.warning).toContain('no reconocerá ninguna palabra');
  });

  it('un nombre vacío en F se reporta como (vacío)', () => {
    expect(parseFinals('s2, ', ['s0', 's2']).error).toBe(
      'El estado (vacío) no pertenece a Q = {s0, s2}. Intente de nuevo.',
    );
  });

  for (const name of ['constructor', '__proto__', 'toString']) {
    it(`un estado llamado ${name} no deja pasar una casilla vacía`, () => {
      const result = readAutomaton({
        states: `${name}, b`,
        alphabet: 'a',
        delta: { b: { a: 'b' } },
        initial: 'b',
        finals: 'b',
      });
      expect(result.automaton).toBeUndefined();
      expect(Object.keys(result.errors.delta ?? {})).toEqual([name]);
      expect(Object.keys(Object.prototype)).toEqual([]);
    });
  }

  it('un estado llamado __proto__ sobrevive a guardar y cargar', () => {
    const { automaton } = readAutomaton({
      states: '__proto__, b',
      alphabet: 'a',
      delta: JSON.parse('{"__proto__": {"a": "b"}, "b": {"a": "__proto__"}}'),
      initial: '__proto__',
      finals: 'b',
    });
    const stored = JSON.parse(JSON.stringify(draftOf(automaton!)));
    expect(readAutomaton(stored).automaton?.delta['__proto__']['a']).toBe('b');
  });
});

describe('Módulo 3 (tabla 2)', () => {
  const check = (m: Automaton, word: string, states: string[], accepted: boolean) => {
    const run = runWord(m, word);
    expect(run.invalidSymbol).toBeUndefined();
    expect(run.states).toEqual(states);
    expect(m.finals.has(run.states[run.states.length - 1])).toBe(accepted);
  };

  it('A2', () => {
    check(a2(), 'abab', ['s0', 's1', 's2', 's1', 's2'], true);
    check(a2(), 'aba', ['s0', 's1', 's2', 's1'], false);
    check(a2(), 'bab', ['s0', 's0', 's1', 's2'], true);
    check(a2(), 'bb', ['s0', 's0', 's0'], false);
    check(a2(), '', ['s0'], false);
  });

  it('A2, símbolo fuera del alfabeto', () => {
    const run = runWord(a2(), 'abc');
    expect([run.invalidSymbol, run.position]).toEqual(['c', 3]);
  });

  it('A1', () => {
    check(a1(), '0110', ['q0', 'q1', 'q1', 'q1', 'q0'], true);
    check(a1(), '1011', ['q0', 'q0', 'q1', 'q1', 'q1'], false);
    check(a1(), '', ['q0'], true);
  });
});
