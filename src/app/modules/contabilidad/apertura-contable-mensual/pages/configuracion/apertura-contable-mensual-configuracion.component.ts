import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { RecordsSearchToolbarComponent } from '../../../../../shared/components/records-search-toolbar/records-search-toolbar.component';
import { TableControlsComponent } from '../../../../../shared/components/table-controls/table-controls.component';
import { CheckboxComponent } from '../../../../../shared/ui/checkbox/checkbox.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconDropdownMenuComponent, IconDropdownMenuItem } from '../../../../../shared/ui/icon-dropdown-menu/icon-dropdown-menu.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ReportTableColumn, ReportTableComponent, ReportTableRow } from '../../../../../shared/ui/report-table/report-table.component';
import { SnackbarComponent } from '../../../../../shared/ui/snackbar/snackbar.component';
import { TabItem, TabsComponent } from '../../../../../shared/ui/tabs/tabs.component';
import { buildProcessBreadcrumbs } from '../../../../../shared/utils/breadcrumbs.util';
import { CONFIGURACION_PROCESS_ID, CONFIGURACION_ROUTE, DETALLE_ROUTE, EDITAR_ROUTE } from '../../config/apertura-contable-mensual.rutas';
import { SituacionPeriodoPliego, SituacionPliego, generarRegistrosAperturaContableMensual, generarSituacionPorPliego } from '../../models/apertura-contable-mensual.model';

const COLUMNAS: ReportTableColumn[] = [
  { key: 'pliego', label: 'Pliego', width: 200 },
  { key: 'periodo', label: 'Periodo', width: 100 },
  { key: 'fechaInicio', label: 'Fecha de inicio', width: 130 },
  { key: 'fechaFin', label: 'Fecha fin', width: 120 },
  { key: 'cierreOperativo', label: 'Cierre operativo', width: 140 },
  { key: 'estadoOperativo', label: 'Estado operativo', width: 140 },
  { key: 'cierreContable', label: 'Cierre contable', width: 140 },
  { key: 'condicionContable', label: 'Condición contable', width: 150 },
  { key: 'responsable', label: 'Responsable', width: 230 },
];

const COLUMNAS_PLIEGO: ReportTableColumn[] = [
  { key: 'periodo', label: 'Periodo', width: 110 },
  { key: 'fechaInicio', label: 'Fecha de inicio', width: 140 },
  { key: 'fechaFin', label: 'Fecha fin', width: 120 },
  { key: 'cierreOperativo', label: 'Cierre operativo', width: 150 },
  { key: 'estadoOperativo', label: 'Estado operativo', width: 150 },
  { key: 'cierreContable', label: 'Cierre contable', width: 150 },
  { key: 'condicionContable', label: 'Condición contable', width: 160 },
  { key: 'responsable', label: 'Responsable', width: 230 },
];

const TABS: TabItem[] = [
  { id: 'general', label: 'Situación de apertura general' },
  { id: 'pliegos', label: 'Pliegos' },
];

const MENU_SELECCION: IconDropdownMenuItem[] = [
  { label: 'Expandir seleccionados', value: 'expandir' },
  { label: 'Contraer seleccionados', value: 'contraer' },
  { label: 'Limpiar selección', value: 'limpiar' },
];

const MENU_ARBOL: IconDropdownMenuItem[] = [
  { label: 'Expandir todo', value: 'expandir' },
  { label: 'Contraer todo', value: 'contraer' },
];

interface Periodo {
  id: string;
  etiqueta: string;
  filas: ReportTableRow[];
}

interface Anio {
  id: string;
  etiqueta: string;
  periodos: Periodo[];
}

/**
 * «Configuración de apertura contable mensual» del creador DGCP (Figma node-id 3142:170479): tabla jerárquica
 * de solo consulta, año → periodos → pliegos. El kit no tiene tabla con filas expandibles, así que los niveles
 * año y periodo se arman aquí y el detalle de cada periodo es un `siaf-report-table`. La pestaña «Pliegos»
 * (Figma node-id 2404:122064) cambia el cuerpo: pliego → año → periodos, con casillas de selección.
 */
@Component({
  selector: 'siaf-apertura-contable-mensual-configuracion',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    ButtonComponent,
    CheckboxComponent,
    IconComponent,
    IconDropdownMenuComponent,
    PaginationComponent,
    RecordsSearchToolbarComponent,
    ReportTableComponent,
    SnackbarComponent,
    TableControlsComponent,
    TabsComponent,
  ],
  template: `
    <div class="flex min-h-[calc(100vh-56px)] w-full flex-col bg-[var(--sys-color-bg-surfaces-surface-lowest)] text-text">
      <div class="border-b border-[var(--sys-color-divider-default)] bg-surface">
        <siaf-breadcrumb [items]="breadcrumbs" />
        <header class="flex items-center gap-siaf-xs px-siaf-md py-siaf-md">
          <siaf-button variant="text" icon="arrow_back" [iconOnly]="true" ariaLabel="Volver" (click)="volver()" />
          <h1 class="m-0 min-h-6 text-base font-bold uppercase tracking-[0.02px] text-[var(--sys-color-text-neutral-high)]">
            Configuración de apertura contable mensual
          </h1>
        </header>
      </div>

      <div class="flex flex-1 flex-col p-siaf-md">
        <div class="flex flex-col gap-siaf-md rounded-siaf-md bg-surface pb-siaf-lg">
          <siaf-tabs
            [tabs]="tabs"
            [activeId]="pestanaActiva()"
            [border]="false"
            ariaLabel="Configuración de apertura contable mensual"
            (activeIdChange)="cambiarPestana($event)"
          />

          <div class="flex flex-col gap-siaf-md px-siaf-lg">
            <h2 class="m-0 text-base font-bold uppercase leading-normal tracking-[0.02px] text-[var(--sys-color-text-neutral-high)]">
              Aperturas contables mensuales
            </h2>

            <siaf-records-search-toolbar
              [value]="busquedaEscrita()"
              placeholder="Buscar"
              (valueChange)="busquedaEscrita.set($event)"
              (searchSubmit)="aplicarBusqueda($event)"
            >
              <ng-container actions>
                <siaf-icon-dropdown-menu icon="more_vert" ariaLabel="Más opciones" [items]="menuArbol" (selected)="accionMenu($event)" />
              </ng-container>
            </siaf-records-search-toolbar>

            <siaf-table-controls
              selectAllLabel="Seleccionar pliegos"
              [showSelection]="pestanaActiva() === 'pliegos'"
              [checked]="todosSeleccionados()"
              [indeterminate]="algunosSeleccionados()"
              [selectedCount]="seleccionados().size"
              [showEditAction]="pestanaActiva() === 'pliegos'"
              [showDeleteAction]="pestanaActiva() === 'pliegos'"
              [editDisabled]="seleccionados().size !== 1"
              [deleteDisabled]="true"
              [page]="pagina()"
              [pageSize]="filasPorPagina()"
              [totalItems]="totalItems()"
              [totalPages]="totalPaginas()"
              (selectionChange)="seleccionarTodos($event)"
              (edit)="editarSeleccionado()"
              (previous)="paginaAnterior()"
              (next)="paginaSiguiente()"
            >
              <siaf-icon-dropdown-menu tableAction icon="more_vert" ariaLabel="Acciones sobre la selección" [items]="menuSeleccion" (selected)="accionSeleccion($event)" />
            </siaf-table-controls>

            @if (pestanaActiva() === 'pliegos') {
              <div role="treegrid" aria-label="Situación de apertura por pliego">
                <div class="flex min-h-10 items-center border-b border-[var(--sys-color-divider-strong)] bg-[var(--sys-color-bg-surfaces-surface-high)] px-siaf-md py-siaf-sm" role="row">
                  <span class="pl-[96px] text-xs font-bold uppercase text-[var(--sys-color-text-neutral-high)]" role="columnheader">Pliegos</span>
                </div>

                @for (pliego of pliegosPagina(); track pliego.id) {
                  <div
                    role="row"
                    class="flex min-h-12 items-center border-b border-[var(--sys-color-divider-default)] pl-siaf-xs pr-siaf-md"
                    [class.bg-[var(--sys-color-bg-states-light-selected)]]="seleccionados().has(pliego.id)"
                  >
                    <siaf-checkbox
                      [checked]="seleccionados().has(pliego.id)"
                      [attr.aria-label]="'Seleccionar ' + pliego.pliego"
                      (checkedChange)="seleccionar(pliego.id, $event)"
                    />
                    <button
                      type="button"
                      class="grid size-10 shrink-0 place-items-center rounded-siaf-md hover:bg-[var(--sys-color-bg-states-light-hover)]"
                      [attr.aria-expanded]="estaAbierto(pliego.id)"
                      [attr.aria-label]="(estaAbierto(pliego.id) ? 'Contraer ' : 'Expandir ') + pliego.pliego"
                      (click)="alternar(pliego.id)"
                    >
                      <siaf-icon [name]="estaAbierto(pliego.id) ? 'expand_less' : 'expand_more'" [size]="24" />
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-siaf-sm px-siaf-sm py-siaf-sm text-left text-sm text-[var(--sys-color-text-neutral-medium)] hover:text-[var(--sys-color-text-brand-primary)] active:text-[var(--sys-color-text-brand-primary)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sys-color-border-states-focus)]"
                      [attr.aria-label]="'Ver la apertura contable de ' + pliego.pliego"
                      (click)="verDetalle(pliego.id)"
                    >
                      {{ pliego.pliego }}
                    </button>
                  </div>

                  @if (estaAbierto(pliego.id)) {
                    <div class="bg-[var(--sys-color-bg-surfaces-surface-lowest)] p-siaf-md">
                      <div class="siaf-table-scroll rounded-siaf-sm" role="region" tabindex="0" [attr.aria-label]="'Periodos de ' + pliego.pliego">
                        <table class="w-full min-w-full border-collapse text-left text-sm" [attr.aria-label]="'Periodos de ' + pliego.pliego">
                          <thead>
                            <tr>
                              @for (columna of columnasPliego; track columna.key) {
                                <th
                                  class="h-10 px-siaf-md py-siaf-sm text-xs font-bold uppercase leading-normal text-[var(--sys-color-text-neutral-high)]"
                                  scope="col"
                                  [style.min-width.px]="columna.width"
                                >
                                  <span class="block truncate">{{ columna.label }}</span>
                                </th>
                              }
                            </tr>
                          </thead>
                          <tbody>
                            <tr class="border-b border-[var(--sys-color-divider-default)] bg-surface">
                              <td class="p-0" [attr.colspan]="columnasPliego.length">
                                <button
                                  type="button"
                                  class="flex min-h-10 w-full items-center gap-siaf-sm px-siaf-sm text-left text-sm text-[var(--sys-color-text-neutral-medium)] hover:bg-[var(--sys-color-bg-states-light-hover)]"
                                  [attr.aria-expanded]="estaAbierto(pliego.id + '|2026')"
                                  (click)="alternar(pliego.id + '|2026')"
                                >
                                  <siaf-icon [name]="estaAbierto(pliego.id + '|2026') ? 'expand_less' : 'expand_more'" [size]="24" />
                                  2026
                                </button>
                              </td>
                            </tr>
                            @if (estaAbierto(pliego.id + '|2026')) {
                              @for (fila of pliego.periodos; track fila.periodo) {
                                <tr class="border-b border-[var(--sys-color-divider-default)] bg-surface">
                                  @for (columna of columnasPliego; track columna.key) {
                                    <td class="h-12 px-siaf-md py-siaf-sm align-middle text-sm leading-normal tracking-[0.0249px] text-[var(--sys-color-text-neutral-medium)]">
                                      {{ valorDe(fila, columna.key) }}
                                    </td>
                                  }
                                </tr>
                              }
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                } @empty {
                  <p class="m-0 px-siaf-md py-siaf-lg text-sm text-[var(--sys-color-text-neutral-low)]">No se encontraron resultados con la búsqueda aplicada.</p>
                }
              </div>
            } @else {
            <div role="treegrid" aria-label="Aperturas contables mensuales">
              <div class="flex min-h-10 items-center border-b border-[var(--sys-color-divider-strong)] bg-[var(--sys-color-bg-surfaces-surface-high)] px-siaf-md py-siaf-sm" role="row">
                <span class="pl-[64px] text-xs font-bold uppercase text-[var(--sys-color-text-neutral-high)]" role="columnheader">Periodo</span>
              </div>

              @for (anio of aniosPagina(); track anio.id) {
                <div role="row" class="border-b border-[var(--sys-color-divider-default)]">
                  <button
                    type="button"
                    class="flex min-h-12 w-full items-center gap-siaf-md px-siaf-md text-left hover:bg-[var(--sys-color-bg-states-light-hover)]"
                    [attr.aria-expanded]="estaAbierto(anio.id)"
                    (click)="alternar(anio.id)"
                  >
                    <siaf-icon [name]="estaAbierto(anio.id) ? 'expand_less' : 'expand_more'" [size]="24" />
                    <span class="text-sm font-bold text-[var(--sys-color-text-neutral-high)]">{{ anio.etiqueta }}</span>
                  </button>
                </div>

                @if (estaAbierto(anio.id)) {
                  @for (periodo of anio.periodos; track periodo.id) {
                    <div role="row" class="border-b border-[var(--sys-color-divider-default)]">
                      <button
                        type="button"
                        class="flex min-h-12 w-full items-center gap-siaf-md py-siaf-xxs pl-[64px] pr-siaf-md text-left hover:bg-[var(--sys-color-bg-states-light-hover)]"
                        [attr.aria-expanded]="estaAbierto(periodo.id)"
                        (click)="alternar(periodo.id)"
                      >
                        <siaf-icon [name]="estaAbierto(periodo.id) ? 'expand_less' : 'expand_more'" [size]="24" />
                        <span class="text-sm text-[var(--sys-color-text-neutral-medium)]">{{ periodo.etiqueta }}</span>
                      </button>
                    </div>

                    @if (estaAbierto(periodo.id)) {
                      <div class="bg-[var(--sys-color-bg-surfaces-surface-lowest)] p-siaf-md pl-[112px]">
                        <siaf-report-table [columns]="columnas" [rows]="periodo.filas" [ariaLabel]="'Pliegos del periodo ' + periodo.etiqueta" />
                      </div>
                    }
                  }
                }
              } @empty {
                <p class="m-0 px-siaf-md py-siaf-lg text-sm text-[var(--sys-color-text-neutral-low)]">No se encontraron resultados con la búsqueda aplicada.</p>
              }
            </div>
            }

            <siaf-pagination
              navigation="Activate"
              position="Bottom"
              [rowPage]="true"
              [page]="pagina()"
              [pageSize]="filasPorPagina()"
              [totalItems]="totalItems()"
              [totalPages]="totalPaginas()"
              [rowsPerPage]="filasPorPagina()"
              (previous)="paginaAnterior()"
              (next)="paginaSiguiente()"
              (rowsPerPageChange)="cambiarFilasPorPagina($event)"
            />
          </div>
        </div>
      </div>
    </div>

    @if (avisoAbierto()) {
      <button class="fixed inset-0 z-40 cursor-default bg-transparent" type="button" tabindex="-1" aria-hidden="true" (click)="avisoAbierto.set(false)"></button>
    }
    <div class="fixed bottom-siaf-lg left-1/2 z-50 w-[min(430px,calc(100vw-32px))] -translate-x-1/2">
      <siaf-snackbar [open]="avisoAbierto()" tone="success" message="Registro agregado con éxito" (closed)="avisoAbierto.set(false)" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AperturaContableMensualConfiguracionComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly breadcrumbs = buildProcessBreadcrumbs(CONFIGURACION_PROCESS_ID, CONFIGURACION_ROUTE, 'Configuración de apertura contable mensual');
  readonly columnas = COLUMNAS;
  readonly columnasPliego = COLUMNAS_PLIEGO;
  readonly tabs = TABS;
  readonly menuArbol = MENU_ARBOL;
  readonly menuSeleccion = MENU_SELECCION;

  readonly pestanaActiva = signal<'general' | 'pliegos'>(this.route.snapshot.queryParamMap.get('tab') === 'pliegos' ? 'pliegos' : 'general');
  readonly avisoAbierto = signal(false);
  readonly busquedaEscrita = signal('');
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly filasPorPagina = signal(25);

  constructor() {
    // «Grabar» en la edición vuelve aquí con `state.grabado`: el aviso aparece 100 ms después de entrar.
    const estado = (this.router.getCurrentNavigation()?.extras.state ?? history.state) as { grabado?: boolean } | null;
    if (estado?.grabado) {
      history.replaceState({ ...history.state, grabado: false }, '');
      setTimeout(() => this.avisoAbierto.set(true), 100);
    }
  }

  /** Abiertos al entrar, como en el diseño: el año y sus dos primeros periodos. */
  private readonly abiertos = signal<ReadonlySet<string>>(
    new Set(['2026', '2026 - 01', '2026 - 02', 'MINISTERIO DE SALUD', 'MINISTERIO DE SALUD|2026']),
  );

  readonly seleccionados = signal<ReadonlySet<string>>(new Set());

  private readonly anios: Anio[] = this.agruparPorAnio();
  private readonly pliegos: SituacionPliego[] = generarSituacionPorPliego();

  readonly aniosFiltrados = computed<Anio[]>(() => {
    const termino = this.normalizar(this.busqueda());
    if (!termino) return this.anios;

    return this.anios
      .map((anio) => ({
        ...anio,
        periodos: anio.periodos
          .map((periodo) => ({ ...periodo, filas: periodo.filas.filter((fila) => this.coincide(fila, termino) || this.normalizar(periodo.etiqueta).includes(termino)) }))
          .filter((periodo) => periodo.filas.length > 0),
      }))
      .filter((anio) => anio.periodos.length > 0);
  });

  readonly pliegosFiltrados = computed<SituacionPliego[]>(() => {
    const termino = this.normalizar(this.busqueda());
    if (!termino) return this.pliegos;
    return this.pliegos.filter((p) => this.normalizar(p.pliego).includes(termino) || p.periodos.some((fila) => this.coincide({ ...fila }, termino)));
  });

  readonly totalItems = computed(() => (this.pestanaActiva() === 'pliegos' ? this.pliegosFiltrados().length : this.aniosFiltrados().length));

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.filasPorPagina())));

  readonly aniosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.filasPorPagina();
    return this.aniosFiltrados().slice(inicio, inicio + this.filasPorPagina());
  });

  readonly pliegosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.filasPorPagina();
    return this.pliegosFiltrados().slice(inicio, inicio + this.filasPorPagina());
  });

  readonly todosSeleccionados = computed(() => this.pliegosPagina().length > 0 && this.pliegosPagina().every((p) => this.seleccionados().has(p.id)));
  readonly algunosSeleccionados = computed(() => !this.todosSeleccionados() && this.pliegosPagina().some((p) => this.seleccionados().has(p.id)));

  /** Con búsqueda activa se abren todas las ramas para mostrar las coincidencias. */
  estaAbierto(id: string): boolean {
    return Boolean(this.busqueda()) || this.abiertos().has(id);
  }

  alternar(id: string): void {
    const siguiente = new Set(this.abiertos());
    if (!siguiente.delete(id)) siguiente.add(id);
    this.abiertos.set(siguiente);
  }

  accionMenu(accion: string): void {
    if (accion === 'contraer') {
      this.abiertos.set(new Set());
      return;
    }
    const ids =
      this.pestanaActiva() === 'pliegos'
        ? this.pliegos.flatMap((p) => [p.id, `${p.id}|2026`])
        : this.anios.flatMap((anio) => [anio.id, ...anio.periodos.map((periodo) => periodo.id)]);
    this.abiertos.set(new Set(ids));
  }

  valorDe(fila: SituacionPeriodoPliego, clave: string): string {
    return fila[clave as keyof SituacionPeriodoPliego];
  }

  verDetalle(id: string): void {
    void this.router.navigate([DETALLE_ROUTE, id]);
  }

  editarSeleccionado(): void {
    const [id] = [...this.seleccionados()];
    if (this.seleccionados().size === 1 && id) void this.router.navigate([EDITAR_ROUTE, id]);
  }

  accionSeleccion(accion: string): void {
    if (accion === 'limpiar') {
      this.seleccionados.set(new Set());
      return;
    }
    const siguiente = new Set(this.abiertos());
    for (const id of this.seleccionados()) {
      if (accion === 'expandir') siguiente.add(id);
      else siguiente.delete(id);
    }
    this.abiertos.set(siguiente);
  }

  seleccionar(id: string, marcado: boolean): void {
    const siguiente = new Set(this.seleccionados());
    if (marcado) siguiente.add(id);
    else siguiente.delete(id);
    this.seleccionados.set(siguiente);
  }

  seleccionarTodos(marcado: boolean): void {
    const siguiente = new Set(this.seleccionados());
    for (const pliego of this.pliegosPagina()) {
      if (marcado) siguiente.add(pliego.id);
      else siguiente.delete(pliego.id);
    }
    this.seleccionados.set(siguiente);
  }

  aplicarBusqueda(valor: string): void {
    this.busquedaEscrita.set(valor);
    this.busqueda.set(valor);
    this.pagina.set(1);
  }

  cambiarPestana(id: string): void {
    if (id !== 'general' && id !== 'pliegos') return;
    this.pestanaActiva.set(id);
    this.pagina.set(1);
  }

  cambiarFilasPorPagina(valor: number): void {
    this.filasPorPagina.set(valor);
    this.pagina.set(1);
  }

  paginaAnterior(): void {
    this.pagina.set(Math.max(1, this.pagina() - 1));
  }

  paginaSiguiente(): void {
    this.pagina.set(Math.min(this.totalPaginas(), this.pagina() + 1));
  }

  volver(): void {
    void this.router.navigate(['/panel']);
  }

  private agruparPorAnio(): Anio[] {
    const porAnio = new Map<string, Map<string, ReportTableRow[]>>();

    for (const registro of generarRegistrosAperturaContableMensual()) {
      const anio = registro.periodo.split(' - ')[0];
      const periodos = porAnio.get(anio) ?? new Map<string, ReportTableRow[]>();
      periodos.set(registro.periodo, [...(periodos.get(registro.periodo) ?? []), { ...registro }]);
      porAnio.set(anio, periodos);
    }

    return [...porAnio].map(([anio, periodos]) => ({
      id: anio,
      etiqueta: anio,
      periodos: [...periodos].map(([periodo, filas]) => ({ id: periodo, etiqueta: periodo, filas })),
    }));
  }

  private coincide(fila: ReportTableRow, termino: string): boolean {
    return this.normalizar(Object.values(fila).join(' ')).includes(termino);
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }
}
