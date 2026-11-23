import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  LucideArrowRight,
  LucideCircleAlert,
  LucideCircleCheck,
  LucideEraser,
  LucideHammer,
  LucidePlus,
  LucideTrash2,
  LucideTriangleAlert,
  LucideUpload,
} from '@lucide/angular';
import { Automaton, formatTuple } from '../automaton/automaton';
import { EXAMPLE_GROUPS, Example } from '../automaton/examples';
import { fromFile } from '../automaton/file';
import { parseAlphabet, parseStates, readAutomaton } from '../automaton/logic';
import { SavedAutomaton, SavedStore } from '../automaton/saved';
import { completeWithSink } from '../automaton/sink';
import { AutomatonStore, ModuleId, Part, draftOf, emptyDraft } from '../automaton/store';

type TextField = 'states' | 'alphabet' | 'initial' | 'finals';

const savedDate = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/** Módulo 1: construcción del autómata. */
@Component({
  selector: 'app-build-module',
  imports: [
    LucideArrowRight,
    LucideCircleAlert,
    LucideCircleCheck,
    LucideEraser,
    LucideHammer,
    LucidePlus,
    LucideTrash2,
    LucideTriangleAlert,
    LucideUpload,
  ],
  templateUrl: './build-module.html',
})
export class BuildModule {
  private readonly store = inject(AutomatonStore);
  private readonly saved = inject(SavedStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly exampleGroups = EXAMPLE_GROUPS;
  protected readonly draft = this.store.draft;
  protected readonly submitted = signal(false);
  protected readonly status = signal('');
  protected readonly warning = signal('');
  protected readonly savedNote = signal('');
  protected readonly sinkNote = signal('');
  protected readonly fileError = signal('');

  protected readonly savedItems = computed(() =>
    this.saved.list().flatMap((entry) => {
      const { automaton } = readAutomaton(entry.draft);
      return automaton
        ? [{ entry, tuple: formatTuple(automaton), date: savedDate.format(entry.savedAt) }]
        : [];
    }),
  );

  protected readonly canClear = computed(
    () =>
      this.store.automaton() !== null ||
      JSON.stringify(this.draft()) !== JSON.stringify(emptyDraft()),
  );

  protected readonly states = computed(() => parseStates(this.draft().states));
  protected readonly alphabet = computed(() => parseAlphabet(this.draft().alphabet));
  /** La tabla de δ solo se puede llenar cuando Q y Σ son válidos, igual que en consola. */
  protected readonly gridReady = computed(() => !this.states().error && !this.alphabet().error);
  protected readonly result = computed(() => readAutomaton(this.draft()));
  protected readonly errors = computed(() => (this.submitted() ? this.result().errors : {}));

  /** Con δ vacía no hay nada que completar: todo iría al pozo. */
  protected readonly canComplete = computed(() => {
    if (!this.gridReady()) return false;
    const cells = this.states().items.flatMap((q) =>
      this.alphabet().items.map((a) => this.cell(q, a).trim()),
    );
    return cells.some(Boolean) && !cells.every(Boolean);
  });

  protected readonly deltaErrors = computed(() => {
    const delta = this.errors().delta ?? {};
    return this.states().items.flatMap((q) =>
      this.alphabet().items
        .filter((a) => delta[q]?.[a])
        .map((a) => ({ id: this.cellId(q, a), label: `δ(${q}, ${a})`, message: delta[q][a] })),
    );
  });

  protected cellId(q: string, a: string): string {
    const qi = this.states().items.indexOf(q);
    const ai = this.alphabet().items.indexOf(a);
    return `delta-${qi}-${ai}`;
  }

  protected setText(field: TextField, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draft.update((d) => ({ ...d, [field]: value }));
    this.status.set('');
    this.sinkNote.set('');
  }

  protected setCell(q: string, a: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draft.update((d) => ({ ...d, delta: { ...d.delta, [q]: { ...d.delta[q], [a]: value } } }));
    this.status.set('');
    this.sinkNote.set('');
  }

  protected completeSink(): void {
    const { draft, sink, filled } = completeWithSink(this.draft());
    this.draft.set(draft);
    this.status.set('');
    const missing = filled === 1 ? 'la transición que faltaba' : `las ${filled} transiciones que faltaban`;
    this.sinkNote.set(
      `El estado ${sink} recibe ${missing}. No es final y vuelve a sí mismo con cada símbolo, así que el lenguaje no cambia.`,
    );
    this.focusAfterRender('#f-initial');
  }

  protected cell(q: string, a: string): string {
    return this.draft().delta[q]?.[a] ?? '';
  }

  protected focus(part: Part | null): void {
    this.store.focus.set(part);
  }

  protected build(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    const { automaton, warning } = this.result();
    if (!automaton) {
      this.status.set('');
      this.focusAfterRender('[aria-invalid="true"]');
      return;
    }
    this.saved.save(draftOf(automaton));
    this.show(automaton, warning, 'Autómata construido y guardado en este navegador. Ya puede usar los módulos 2 y 3.');
  }

  protected load(example: Example): void {
    const m = example.create();
    this.show(m, undefined, `Se cargó ${example.key}: ${example.description}.`);
  }

  protected loadSaved(entry: SavedAutomaton): void {
    const { automaton, warning } = readAutomaton(entry.draft);
    if (automaton) this.show(automaton, warning, `Se cargó ${formatTuple(automaton)}.`);
  }

  protected async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Sin esto, elegir otra vez el mismo archivo no dispara change.
    input.value = '';
    if (!file) return;
    const { automaton, warning, error } = fromFile(await file.text());
    if (!automaton) {
      this.fileError.set(`${file.name}: ${error}`);
      return;
    }
    this.saved.save(draftOf(automaton));
    this.show(automaton, warning, `Se cargó ${file.name}: ${formatTuple(automaton)}.`);
  }

  protected removeSaved(item: { entry: SavedAutomaton; tuple: string }): void {
    this.saved.remove(item.entry.savedAt);
    this.savedNote.set(`Se quitó ${item.tuple} de los guardados.`);
    this.focusAfterRender('#saved-title');
  }

  protected clear(): void {
    this.store.clear();
    this.submitted.set(false);
    this.warning.set('');
    this.status.set('');
    this.sinkNote.set('');
    this.fileError.set('');
    this.focusAfterRender('#f-states');
  }

  private show(m: Automaton, warning: string | undefined, message: string): void {
    this.draft.set(draftOf(m));
    this.store.replace(m);
    this.submitted.set(false);
    this.warning.set(warning ?? '');
    this.status.set(message);
    this.sinkNote.set('');
    this.fileError.set('');
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }

  protected go(module: ModuleId): void {
    this.store.module.set(module);
  }
}
