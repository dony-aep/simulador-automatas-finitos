import { Component, inject } from '@angular/core';
import { LucideMonitor, LucideMoon, LucideSun } from '@lucide/angular';
import { ThemeMode, ThemeStore } from './theme';

@Component({
  selector: 'app-theme-switch',
  imports: [LucideMonitor, LucideMoon, LucideSun],
  template: `
    <div class="theme-switch" role="group" aria-label="Tema">
      @for (option of options; track option.mode) {
        <button
          type="button"
          class="theme-option"
          [attr.aria-pressed]="theme.mode() === option.mode"
          [attr.aria-label]="option.label"
          [title]="option.label"
          (click)="theme.mode.set(option.mode)"
        >
          @switch (option.mode) {
            @case ('system') {
              <svg lucideMonitor></svg>
            }
            @case ('light') {
              <svg lucideSun></svg>
            }
            @case ('dark') {
              <svg lucideMoon></svg>
            }
          }
        </button>
      }
    </div>
  `,
})
export class ThemeSwitch {
  protected readonly theme = inject(ThemeStore);
  protected readonly options: { mode: ThemeMode; label: string }[] = [
    { mode: 'system', label: 'Tema del sistema' },
    { mode: 'light', label: 'Tema claro' },
    { mode: 'dark', label: 'Tema oscuro' },
  ];
}
