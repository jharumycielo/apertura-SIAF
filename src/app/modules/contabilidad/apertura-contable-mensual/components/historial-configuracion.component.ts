import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { RecordsSearchToolbarComponent } from '../../../../shared/components/records-search-toolbar/records-search-toolbar.component';
import { TableControlsComponent } from '../../../../shared/components/table-controls/table-controls.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { RecordStatusTagComponent } from '../../../../shared/ui/record-status-tag/record-status-tag.component';
import { EntradaHistorial } from '../models/apertura-contable-mensual.model';

/**
 * Historial de la configuración de un periodo (Figma node-id 3160:177383): buscador, paginación y una tabla cuyos
 * ítems se abren para mostrar la fecha de cierre contable y el estado operativo de ese movimiento. Lo usan la edición
 * y el detalle de solo lectura de la apertura contable mensual.
 */
@Component({
  selector: 'siaf-apertura-historial-configuracion',
  standalone: true,
  imports: [IconComponent, PaginationComponent, RecordStatusTagComponent, RecordsSearchToolbarComponent, TableControlsComponent],
  template: `
    <siaf-records-search-toolbar
      [value]="busquedaEscrita()"
      placeholder="Buscar"
      (valueChange)="busquedaEscrita.set($event)"
      (searchSubmit)="buscar($event)"
    />

    <siaf-table-controls
      [showSelection]="false"
      [page]="pagina()"
      [pageSize]="filasPorPagina()"
      [totalItems]="filtradas().length"
      [totalPages]="totalPaginas()"
      (previous)="pagina.set(pagina() - 1)"
      (next)="pagina.set(pagina() + 1)"
    />

    <div class="siaf-table-scroll rounded-siaf-sm" role="region" tabindex="0" aria-label="Historial de la configuración">
      <table class="w-full min-w-full border-collapse text-left text-sm" aria-label="Historial de la configuración">
        <thead>
          <tr>
            <th class="w-14 px-siaf-md py-siaf-sm" scope="col"></th>
            <th class="h-10 w-20 px-siaf-md py-siaf-sm text-xs font-bold uppercase text-[var(--sys-color-text-neutral-high)]" scope="col">Ítem</th>
            <th class="px-siaf-md py-siaf-sm text-xs font-bold uppercase text-[var(--sys-color-text-neutral-high)]" scope="col">Fecha y hora</th>
            <th class="px-siaf-md py-siaf-sm text-xs font-bold uppercase text-[var(--sys-color-text-neutral-high)]" scope="col">Tipo de acción</th>
            <th class="px-siaf-md py-siaf-sm text-xs font-bold uppercase text-[var(--sys-color-text-neutral-high)]" scope="col">Usuario</th>
          </tr>
        </thead>
        <tbody>
          @for (entrada of paginaActual(); track entrada.item) {
            <tr class="border-b border-[var(--sys-color-divider-default)] bg-surface text-[var(--sys-color-text-neutral-medium)]">
              <td class="px-siaf-sm">
                <button
                  type="button"
                  class="grid size-10 place-items-center rounded-siaf-md hover:bg-surface-muted"
                  [attr.aria-expanded]="abiertos().has(entrada.item)"
                  [attr.aria-label]="(abiertos().has(entrada.item) ? 'Contraer' : 'Expandir') + ' ítem ' + entrada.item"
                  (click)="alternar(entrada.item)"
                >
                  <siaf-icon [name]="abiertos().has(entrada.item) ? 'expand_less' : 'expand_more'" [size]="24" />
                </button>
              </td>
              <td class="px-siaf-md py-siaf-sm">{{ entrada.item }}</td>
              <td class="px-siaf-md py-siaf-sm">{{ entrada.fechaHora }}</td>
              <td class="px-siaf-md py-siaf-sm">{{ entrada.tipoAccion }}</td>
              <td class="px-siaf-md py-siaf-sm">{{ entrada.usuario }}</td>
            </tr>
            @if (abiertos().has(entrada.item)) {
              <tr class="border-b border-[var(--sys-color-divider-default)] bg-[var(--sys-color-bg-surfaces-surface-lowest)]">
                <td colspan="5" class="p-siaf-md">
                  <table class="w-full border-collapse text-left text-sm" [attr.aria-label]="'Detalle del ítem ' + entrada.item">
                    <thead>
                      <tr class="h-8 bg-[var(--sys-color-bg-surfaces-surface-high)] text-xs font-bold uppercase text-[var(--sys-color-text-neutral-high)]">
                        <th class="px-siaf-md" scope="col">Fecha cierre contable</th>
                        <th class="px-siaf-md" scope="col">Estado operativo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="h-10 text-[var(--sys-color-text-neutral-medium)]">
                        <td class="px-siaf-md">{{ entrada.cierreContable }}</td>
                        <td class="px-siaf-md"><siaf-record-status-tag [status]="entrada.estado" /></td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            }
          } @empty {
            <tr>
              <td colspan="5" class="px-siaf-md py-siaf-lg text-center text-sm text-[var(--sys-color-text-neutral-medium)]">No se encontraron resultados con la búsqueda aplicada.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <siaf-pagination
      navigation="Activate"
      position="Bottom"
      [rowPage]="true"
      [page]="pagina()"
      [pageSize]="filasPorPagina()"
      [totalItems]="filtradas().length"
      [totalPages]="totalPaginas()"
      [rowsPerPage]="filasPorPagina()"
      (previous)="pagina.set(pagina() - 1)"
      (next)="pagina.set(pagina() + 1)"
      (rowsPerPageChange)="cambiarFilas($event)"
    />
  `,
  host: { class: 'flex flex-col gap-siaf-md' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialConfiguracionComponent {
  private readonly entradasSignal = signal<EntradaHistorial[]>([]);

  @Input({ required: true }) set entradas(valor: EntradaHistorial[]) {
    this.entradasSignal.set(valor);
    this.pagina.set(1);
    this.abiertos.set(new Set(valor.length ? [valor[0].item] : []));
  }

  readonly busquedaEscrita = signal('');
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly filasPorPagina = signal(10);
  readonly abiertos = signal<ReadonlySet<number>>(new Set());

  readonly filtradas = computed(() => {
    const termino = this.normalizar(this.busqueda());
    const entradas = this.entradasSignal();
    return termino ? entradas.filter((e) => this.normalizar(`${e.item} ${e.fechaHora} ${e.tipoAccion} ${e.usuario}`).includes(termino)) : entradas;
  });
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.filasPorPagina())));
  readonly paginaActual = computed(() => {
    const inicio = (this.pagina() - 1) * this.filasPorPagina();
    return this.filtradas().slice(inicio, inicio + this.filasPorPagina());
  });

  buscar(texto: string): void {
    this.busquedaEscrita.set(texto);
    this.busqueda.set(texto);
    this.pagina.set(1);
  }

  cambiarFilas(filas: number): void {
    this.filasPorPagina.set(filas);
    this.pagina.set(1);
  }

  alternar(item: number): void {
    const siguiente = new Set(this.abiertos());
    if (!siguiente.delete(item)) siguiente.add(item);
    this.abiertos.set(siguiente);
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }
}
