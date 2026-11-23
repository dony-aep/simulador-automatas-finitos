import { Component, effect, inject } from '@angular/core';
import { LucideHammer, LucideListOrdered, LucidePlay } from '@lucide/angular';
import { AutomatonStore, ModuleId } from './automaton/store';
import { GuideDialog } from './guide-dialog';
import { ThemeSwitch } from './theme-switch';
import { BuildModule } from './modules/build-module';
import { TestModule } from './modules/test-module';
import { WordsModule } from './modules/words-module';
import { AutomatonPanel } from './panel/automaton-panel';
import { TupleStrip } from './tuple-strip';

interface Tab {
  id: ModuleId;
  label: string;
}

@Component({
  selector: 'app-root',
  imports: [
    AutomatonPanel,
    BuildModule,
    GuideDialog,
    LucideHammer,
    LucideListOrdered,
    LucidePlay,
    TestModule,
    ThemeSwitch,
    TupleStrip,
    WordsModule,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(AutomatonStore);

  protected readonly tabs: Tab[] = [
    { id: 'build', label: 'Construir' },
    { id: 'words', label: 'Cinco palabras' },
    { id: 'test', label: 'Probar una palabra' },
  ];

  constructor() {
    // Va en un effect porque los botones de los módulos también cambian de módulo.
    effect(() => {
      this.store.module();
      window.scrollTo({ top: 0 });
    });
  }

  protected select(id: ModuleId): void {
    this.store.module.set(id);
    this.store.highlight.set(null);
  }

  protected goHome(event: MouseEvent): void {
    // Ctrl o Shift + clic conservan el comportamiento normal de abrir otra pestaña o ventana.
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    this.select('build');
    window.scrollTo({ top: 0 });
  }

  /** Flechas izquierda y derecha entre pestañas, como pide el patrón de ARIA para tablist. */
  protected onTabKey(event: KeyboardEvent, index: number): void {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!offset) return;
    event.preventDefault();
    const next = (index + offset + this.tabs.length) % this.tabs.length;
    this.select(this.tabs[next].id);
    document.getElementById(`tab-${this.tabs[next].id}`)?.focus();
  }
}
