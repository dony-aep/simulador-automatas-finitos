/** Pruebas de lo que no es lógica central: la 5-tupla, los recorridos, los mensajes y la gráfica. */

import { instance } from '@viz-js/viz';
import { formatRun, formatTuple } from './automaton';
import { a2, a3, a4 } from './examples';
import { toDot } from './graph';
import { runWord } from './logic';
import { verdict, wordsNote } from './messages';

describe('formato', () => {
  it('5-tupla de A2', () => {
    expect(formatTuple(a2())).toBe('M = ({s0, s1, s2}, {a, b}, δ, s0, {s2})');
  });

  it('notación del recorrido', () => {
    expect(formatRun('ab', ['s0', 's1', 's2'])).toBe('s0 –a→ s1 –b→ s2');
    expect(formatRun('', ['s0'])).toBe('s0');
  });
});

describe('gráfica', () => {
  it('el DOT de A2 cumple las cinco reglas', () => {
    // En A2, s0, s1 y s2 son los nodos n0, n1 y n2.
    const dot = toDot(a2());
    expect(dot).toContain('start -> n0;'); // 1. flecha inicial
    expect(dot).toContain('n2 [label="s2", shape=doublecircle]'); // 2. doble círculo
    expect(dot).toContain('n0 -> n0 [label="b"]'); // 3. bucle
    expect(dot).toContain('n1 -> n2 [label="b"]'); // 4. dos flechas
    expect(dot).toContain('n2 -> n1 [label="a"]');
  });

  it('los símbolos hacia el mismo destino comparten una flecha', () => {
    // En A3, p3 y m son los nodos n3 y n4.
    const dot = toDot(a3());
    expect(dot).toContain('n4 -> n4 [label="a, b"]'); // 5. etiqueta «a, b»
    expect(dot.split('n3 -> n4').length - 1).toBe(1);
  });

  it('un estado llamado start no choca con el nodo invisible', () => {
    const m = a2();
    const rename = (q: string) => (q === 's0' ? 'start' : q);
    m.states = m.states.map(rename);
    m.initial = 'start';
    m.delta = Object.fromEntries(
      Object.entries(a2().delta).map(([q, row]) => [
        rename(q),
        Object.fromEntries(Object.entries(row).map(([a, t]) => [a, rename(t)])),
      ]),
    );
    expect(toDot(m)).toContain('n0 [label="start", shape=circle]');
  });

  it('Graphviz acepta el DOT', async () => {
    const viz = await instance();
    const result = viz.render(toDot(a3()), { format: 'svg' });
    expect(result.status).toBe('success');
  });
});

describe('mensajes', () => {
  it('un espacio se reporta como símbolo fuera del alfabeto', () => {
    const m = a2();
    expect(verdict(m, ' ab', runWord(m, ' ab'))).toContain('el símbolo « » (posición 1) no pertenece');
  });

  it('veredicto con ε', () => {
    const m = a2();
    expect(verdict(m, '', runWord(m, ''))).toBe('La palabra «ε» NO es reconocida por el autómata.');
  });

  it('A3 avisa que solo hay dos palabras', () => {
    expect(wordsNote(a3(), 2)).toEqual([
      'Este autómata solo reconoce 2 palabras de longitud menor o igual que 10.',
    ]);
  });

  it('A4 explica que el estado final no es alcanzable', () => {
    expect(wordsNote(a4(), 0)[1]).toBe('Motivo: ningún estado final {q1} es alcanzable desde q0.');
  });
});
