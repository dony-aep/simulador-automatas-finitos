import { a1, a2 } from './examples';
import { SavedStore, remember } from './saved';
import { draftOf } from './store';

const KEY = 'simulator-automata';

describe('autómatas guardados', () => {
  beforeEach(() => localStorage.clear());

  it('el último construido queda de primero', () => {
    const list = remember(remember([], draftOf(a1()), 1), draftOf(a2()), 2);
    expect(list.map((s) => s.savedAt)).toEqual([2, 1]);
  });

  it('construir uno repetido lo mueve en vez de duplicarlo', () => {
    const first = remember([], draftOf(a1()), 1);
    const second = remember(first, draftOf(a2()), 2);
    const again = remember(second, draftOf(a1()), 3);
    expect(again.map((s) => s.savedAt)).toEqual([3, 2]);
  });

  it('sobrevive a una recarga y se puede quitar', () => {
    const store = new SavedStore();
    store.save(draftOf(a2()));
    const reloaded = new SavedStore();
    expect(reloaded.list()).toHaveLength(1);
    expect(reloaded.list()[0].draft).toEqual(draftOf(a2()));

    reloaded.remove(reloaded.list()[0].savedAt);
    expect(new SavedStore().list()).toEqual([]);
  });

  it('ignora lo que no se pueda leer', () => {
    localStorage.setItem(KEY, '{roto');
    expect(new SavedStore().list()).toEqual([]);

    const valid = { savedAt: 1, draft: draftOf(a1()) };
    const invalid = { savedAt: 2, draft: { ...draftOf(a1()), initial: 'zz' } };
    localStorage.setItem(KEY, JSON.stringify([valid, invalid, null]));
    expect(new SavedStore().list().map((s) => s.savedAt)).toEqual([1]);
  });
});
