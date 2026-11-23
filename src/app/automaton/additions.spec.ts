/** Archivo JSON, estado pozo, gramática regular y ejemplos de las diapositivas y las ideas. */

import { Automaton } from './automaton';
import { EXAMPLE_GROUPS, a1, a2 } from './examples';
import { fromFile, toFile } from './file';
import { toGrammar } from './grammar';
import { AutomatonDraft, findAccepted, readAutomaton, runWord } from './logic';
import { completeWithSink } from './sink';
import { draftOf } from './store';

const example = (key: string): Automaton =>
  EXAMPLE_GROUPS.flatMap((g) => g.examples)
    .find((e) => e.key === key)!
    .create();

const file = (changes: Record<string, unknown>) =>
  JSON.stringify({ ...JSON.parse(toFile(a2())), ...changes });

describe('archivo del autómata', () => {
  it('guardar y cargar devuelve el mismo autómata', () => {
    for (const m of [a1(), a2()]) {
      expect(fromFile(toFile(m)).automaton).toEqual(m);
    }
  });

  it('conserva un estado llamado __proto__', () => {
    const { automaton } = readAutomaton({
      states: '__proto__, b',
      alphabet: 'a',
      delta: JSON.parse('{"__proto__": {"a": "b"}, "b": {"a": "__proto__"}}'),
      initial: '__proto__',
      finals: 'b',
    });
    const loaded = fromFile(toFile(automaton!)).automaton;
    expect(loaded?.delta['__proto__']['a']).toBe('b');
    expect(loaded?.delta['b']['a']).toBe('__proto__');
  });

  it('F vacío se carga con la advertencia', () => {
    const result = fromFile(file({ finals: [] }));
    expect(result.automaton?.finals.size).toBe(0);
    expect(result.warning).toContain('no reconocerá ninguna palabra');
  });

  it('rechaza lo que no es un autómata de este simulador', () => {
    expect(fromFile('{roto').error).toBe('El archivo no es un JSON válido.');
    expect(fromFile('[]').error).toContain('no es un autómata');
    expect(fromFile('{"format": "otro"}').error).toContain('no es un autómata');
    expect(fromFile(file({ states: 's0' })).error).toContain('cinco elementos');
    expect(fromFile(file({ delta: null })).error).toContain('cinco elementos');
  });

  it('aplica las validaciones del Módulo 1', () => {
    expect(fromFile(file({ states: ['s0', 's0'] })).error).toContain('no pueden repetirse');
    expect(fromFile(file({ alphabet: ['ab'] })).error).toContain('un solo carácter');
    expect(fromFile(file({ initial: 's9' })).error).toContain('s9 no pertenece');
    expect(fromFile(file({ finals: ['s9'] })).error).toContain('s9 no pertenece');
    expect(fromFile(file({ delta: { s0: { a: 5 } } })).error).toContain('δ(s0, a)');
  });

  it('rechaza un nombre con coma', () => {
    const text = file({
      states: ['s,0'],
      delta: { 's,0': { a: 's,0', b: 's,0' } },
      initial: 's',
      finals: [],
    });
    expect(fromFile(text).automaton).toBeUndefined();
  });
});

describe('estado pozo', () => {
  const partial = (): AutomatonDraft => ({
    states: 'q0, q1',
    alphabet: 'a, b',
    delta: { q0: { a: 'q1' }, q1: { b: 'q1' } },
    initial: 'q0',
    finals: 'q1',
  });

  it('completa δ sin cambiar el lenguaje', () => {
    const { draft, sink, filled } = completeWithSink(partial());
    expect([sink, filled, draft.states]).toEqual(['pozo', 2, 'q0, q1, pozo']);
    expect(draft.delta).toEqual({
      q0: { a: 'q1', b: 'pozo' },
      q1: { a: 'pozo', b: 'q1' },
      pozo: { a: 'pozo', b: 'pozo' },
    });
    const m = readAutomaton(draft).automaton!;
    expect(findAccepted(m).map(([w]) => w)).toEqual(['a', 'ab', 'abb', 'abbb', 'abbbb']);
    expect(m.finals.has('pozo')).toBe(false);
  });

  it('reutiliza un pozo que ya existe', () => {
    const draft = { ...partial(), states: 'q0, q1, pozo' };
    draft.delta = { ...draft.delta, pozo: { a: 'pozo' } };
    const result = completeWithSink(draft);
    expect([result.sink, result.draft.states]).toEqual(['pozo', 'q0, q1, pozo']);
    expect(result.draft.delta['pozo']).toEqual({ a: 'pozo', b: 'pozo' });
  });

  it('no usa como pozo un estado llamado pozo que no lo es', () => {
    const draft = { ...partial(), states: 'q0, q1, pozo' };
    draft.delta = { ...draft.delta, pozo: { a: 'q0' } };
    const result = completeWithSink(draft);
    expect(result.sink).toBe('pozo2');
    expect(result.draft.delta['pozo']).toEqual({ a: 'q0', b: 'pozo2' });

    const final = { ...partial(), states: 'q0, pozo', finals: 'pozo' };
    expect(completeWithSink(final).sink).toBe('pozo2');
  });
});

describe('gramática regular', () => {
  it('A2, como en la guía de la sustentación', () => {
    expect(toGrammar(a2())).toEqual([
      { head: 's0', bodies: ['a s1', 'b s0'] },
      { head: 's1', bodies: ['a s1', 'b s2'] },
      { head: 's2', bodies: ['a s1', 'b s0', 'λ'] },
    ]);
  });
});

describe('ejemplos de las diapositivas y las ideas', () => {
  const expected: Record<string, string[]> = {
    D8: ['ba', 'aba', 'bab', 'aaba', 'abab'],
    D9: ['0', '00', '10', '000', '011'],
    D20: ['', '0', '2', '00', '02'],
    E1: ['', '0', '00', '11', '000'],
    E2: ['adfp', 'aadfp', 'dadfp', 'fadfp', 'padfp'],
    E3: ['1213', '11213', '21213', '31213', '41213'],
    E4: ['d', 'dd', '+d', '-d', 'ddd'],
  };

  for (const [key, words] of Object.entries(expected)) {
    it(`${key}, Módulo 2`, () => {
      expect(findAccepted(example(key)).map(([w]) => w)).toEqual(words);
    });
  }

  it('todos se pueden guardar y volver a construir', () => {
    for (const { create } of EXAMPLE_GROUPS.flatMap((g) => g.examples)) {
      const m = create();
      expect(readAutomaton(draftOf(m)).automaton).toEqual(m);
    }
  });

  it('recorridos del Módulo 3', () => {
    const accepted = (key: string, word: string) => {
      const m = example(key);
      const states = runWord(m, word).states;
      return m.finals.has(states[states.length - 1]);
    };
    expect(accepted('E1', '1001')).toBe(true);
    expect(accepted('E1', '111')).toBe(false);
    expect(accepted('E2', 'adadfp')).toBe(true);
    expect(accepted('E2', 'adfpa')).toBe(false);
    expect(runWord(example('E3'), '121213').states).toEqual([
      'c0', 'c1', 'c2', 'c3', 'c2', 'c3', 'c4',
    ]);
    expect(accepted('E4', '-dd.d')).toBe(true);
    expect(accepted('E4', 'd.')).toBe(false);
    expect(accepted('E4', '+-d')).toBe(false);
  });
});
