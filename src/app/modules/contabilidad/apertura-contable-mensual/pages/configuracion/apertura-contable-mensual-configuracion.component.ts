import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { PageShellComponent } from '../../../../../shared/components/page-shell/page-shell.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { TableControlsComponent } from '../../../../../shared/components/table-controls/table-controls.component';
import { ReportTableColumn, ReportTableComponent, ReportTableRow } from '../../../../../shared/ui/report-table/report-table.component';
import { TabItem, TabsComponent } from '../../../../../shared/ui/tabs/tabs.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/text-field.component';
import { buildProcessBreadcrumbs } from '../../../../../shared/utils/breadcrumbs.util';
import { CONFIGURACION_PROCESS_ID, CONFIGURACION_ROUTE } from '../../config/apertura-contable-mensual.rutas';
import { generarRegistrosAperturaContableMensual } from '../../models/apertura-contable-mensual.model';

const COLUMNAS: ReportTableColumn[] = [
  { key: 'pliego', label: 'Pliego', width: 220 },
  { key: 'periodo', label: 'Periodo', width: 100 },
  { key: 'fechaInicio', label: 'Fecha de inicio', width: 130 },
  { key: 'fechaFin', label: 'Fecha fin', width: 130 },
  { key: 'cierreOperativo', label: 'Cierre operativo', width: 140 },
  { key: 'estadoOperativo', label: 'Estado operativo', width: 130 },
  { key: 'cierreContable', label: 'Cierre contable', width: 140 },
  { key: 'condicionContable', label: 'Condición contable', width: 150 },
  { key: 'responsable', label: 'Responsable', width: 220, fixed: true },
];

const TABS: TabItem[] = [
  { id: 'general', label: 'Situación de apertura general' },
  { id: 'pliegos', label: 'Pliegos' },
];

/**
 * «Configuración de apertura contable mensual» (Figma node-id 3142:170479): tabla de solo consulta con un registro
 * por pliego y periodo. Solo la pestaña «Situación de apertura general» está implementada; «Pliegos» queda visible
 * pero no navega (fuera del alcance de este proceso de ejemplo).
 */
@Component({
  selector: 'siaf-apertura-contable-mensual-configuracion',
  standalone: true,
  imports: [PageHeaderComponent, PageShellComponent, PaginationComponent, ReportTableComponent, TableControlsComponent, TabsComponent, TextFieldComponent],
  template: `
    <siaf-page-shell [breadcrumbs]="breadcrumbs">
      <siaf-page-header pageHeader title="Configuración de apertura contable mensual" />

      <div class="flex flex-col gap-siaf-md rounded-siaf-md bg-surface p-siaf-lg">
        <siaf-tabs [tabs]="tabs" [activeId]="pestanaActiva()" [border]="false" ariaLabel="Configuración de apertura contable mensual" (activeIdChange)="cambiarPestana($event)" />

        <siaf-input class="max-w-[400px]" placeholder="Buscar" trailingIcon="search" [value]="busqueda()" (valueChange)="busqueda.set($any($event))" />

        <siaf-table-controls
          [showSelection]="false"
          [page]="pagina()"
          [pageSize]="filasPorPagina"
          [totalItems]="filasFiltradas().length"
          [totalPages]="totalPaginas()"
          (previous)="paginaAnterior()"
          (next)="paginaSiguiente()"
        />

        <siaf-report-table [columns]="columnas" [rows]="filasPagina()" ariaLabel="Configuración de apertura contable mensual" />

        <siaf-pagination
          navigation="Activate"
          position="Bottom"
          [page]="pagina()"
          [pageSize]="filasPorPagina"
          [totalItems]="filasFiltradas().length"
          [totalPages]="totalPaginas()"
          (previous)="paginaAnterior()"
          (next)="paginaSiguiente()"
        />
      </div>
    </siaf-page-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AperturaContableMensualConfiguracionComponent {
  readonly breadcrumbs = buildProcessBreadcrumbs(CONFIGURACION_PROCESS_ID, CONFIGURACION_ROUTE, 'Configuración de apertura contable mensual');
  readonly columnas = COLUMNAS;
  readonly tabs = TABS;

  readonly pestanaActiva = signal<'general' | 'pliegos'>('general');
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly filasPorPagina = 10;

  private readonly registros: ReportTableRow[] = generarRegistrosAperturaContableMensual().map((registro) => ({ ...registro }));

  readonly filasFiltradas = computed<ReportTableRow[]>(() => {
    const termino = this.normalizar(this.busqueda());
    if (!termino) return this.registros;
    return this.registros.filter((fila) => this.normalizar(Object.values(fila).join(' ')).includes(termino));
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filasFiltradas().length / this.filasPorPagina)));

  readonly filasPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.filasPorPagina;
    return this.filasFiltradas().slice(inicio, inicio + this.filasPorPagina);
  });

  cambiarPestana(id: string): void {
    // «Pliegos» no está implementada: la pestaña queda visible pero no cambia de vista.
    if (id === 'general') this.pestanaActiva.set('general');
  }

  paginaAnterior(): void {
    this.pagina.set(Math.max(1, this.pagina() - 1));
  }

  paginaSiguiente(): void {
    this.pagina.set(Math.min(this.totalPaginas(), this.pagina() + 1));
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }
}
