import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { SelectionSideNavComponent } from '../../../../../shared/components/selection-side-nav/selection-side-nav.component';
import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { DateTimePickerComponent } from '../../../../../shared/ui/date-time-picker/date-time-picker.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { RadioComponent, RadioOption } from '../../../../../shared/ui/radio/radio.component';
import { RecordStatus, RecordStatusTagComponent } from '../../../../../shared/ui/record-status-tag/record-status-tag.component';
import { SummaryCardComponent, SummaryCardField } from '../../../../../shared/ui/summary-card/summary-card.component';
import { TextAreaControlComponent } from '../../../../../shared/ui/text-area-control/text-area-control.component';
import { UploadSideNavComponent } from '../../../../../shared/ui/upload-side-nav/upload-side-nav.component';
import { UploadedFileCardComponent, UploadedFileInfo } from '../../../../../shared/ui/uploaded-file-card/uploaded-file-card.component';
import { buildProcessBreadcrumbs } from '../../../../../shared/utils/breadcrumbs.util';
import { ddmmyyyyToIso } from '../../../../../shared/utils/fecha.util';
import { crearSnapshotFormulario, hayCambiosRespectoAlSnapshot, identidadArchivo } from '../../../../../shared/utils/form-snapshot.util';
import { MIN_CARACTERES_TEXTO_LIBRE, cumpleMinimoTextoLibre } from '../../../../../shared/utils/texto-libre.util';
import { HistorialConfiguracionComponent } from '../../components/historial-configuracion.component';
import { CONFIGURACION_PROCESS_ID, CONFIGURACION_ROUTE } from '../../config/apertura-contable-mensual.rutas';
import { EntradaHistorial, SituacionPeriodoPliego, SituacionPliego, generarSituacionPorPliego } from '../../models/apertura-contable-mensual.model';

type TipoCierre = 'operativo' | 'contable';

const TIPOS_CIERRE: RadioOption[] = [
  { label: 'Operativo', value: 'operativo' },
  { label: 'Contable', value: 'contable' },
];

const COLUMNAS_PANEL = [
  'Periodo',
  'Fecha de inicio',
  'Fecha fin',
  'Cierre operativo',
  'Estado operativo',
  'Cierre contable',
  'Condición contable',
  'Responsable',
];

/**
 * «Editar apertura contable mensual» de un pliego (Figma node-id 2429:114561): se llega desde el lápiz de la pestaña
 * «Pliegos» de la configuración. El nombre del pliego sale de la ruta. El periodo se elige en un panel de selección
 * única (Figma node-id 2429:115870) y con él se habilitan el tipo de cierre (operativo o contable) y sus fechas;
 * además pide la justificación y el sustento. «Grabar» solo se activa con cambios.
 * En el taller no hay backend para esta pantalla: «Grabar» pide confirmación en un modal y, al aceptar, vuelve a «Pliegos»
 * con un aviso de éxito.
 */
@Component({
  selector: 'siaf-apertura-contable-mensual-editar',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    ButtonComponent,
    DateTimePickerComponent,
    HistorialConfiguracionComponent,
    IconComponent,
    ModalComponent,
    RadioComponent,
    SelectionSideNavComponent,
    SolicitudeFormCardComponent,
    RecordStatusTagComponent,
    SummaryCardComponent,
    TextAreaControlComponent,
    UploadSideNavComponent,
    UploadedFileCardComponent,
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

      <div class="flex flex-col gap-siaf-md p-siaf-md">
        <siaf-solicitude-form-card title="Editar apertura contable mensual">
          <div card-actions class="flex items-center gap-siaf-sm">
            <siaf-button variant="outline" (click)="volver()">Cancelar</siaf-button>
            <siaf-button variant="filled" [disabled]="!puedeGrabar()" (click)="modalGrabar.set(true)">Grabar</siaf-button>
          </div>

          <section class="flex flex-col gap-siaf-sm" aria-labelledby="seccion-pliego">
            <h3 id="seccion-pliego" class="m-0 text-sm font-bold uppercase text-text">Pliego</h3>
            <siaf-summary-card [bordered]="true" [showClose]="false" [fields]="camposPliego()" />
          </section>

          <section class="flex flex-col gap-siaf-sm" aria-labelledby="seccion-periodo">
            <div class="flex min-h-10 items-center justify-between gap-siaf-md">
              <h3 id="seccion-periodo" class="m-0 text-sm font-bold uppercase text-text">Periodo</h3>
              <siaf-button variant="accent" size="md" icon="search" [iconOnly]="true" ariaLabel="Seleccionar periodo" (click)="abrirPanelPeriodo()" />
            </div>
            @if (periodo()) {
              <siaf-summary-card [bordered]="true" [showClose]="false" [fields]="camposPeriodo()" />
            } @else {
              <div class="flex min-h-[49px] items-center rounded-siaf-md bg-[var(--sys-color-bg-surfaces-surface-low)] px-siaf-md py-siaf-sm">
                <p class="m-0 text-sm text-[var(--sys-color-text-neutral-medium)]">No se ha seleccionado ningún periodo. Haga clic en el botón para realizar una selección.</p>
              </div>
            }
          </section>

          <section class="flex flex-col gap-siaf-sm" aria-labelledby="seccion-fechas">
            <h3 id="seccion-fechas" class="m-0 text-sm font-bold uppercase text-text">Fecha (cierre operativo / cierre contable)</h3>
            <div class="grid items-center gap-siaf-md lg:grid-cols-[auto_1fr_1fr_1fr]">
              <siaf-radio-group
                label="Tipo cierre"
                name="tipo-cierre"
                [inline]="true"
                [disabled]="!periodo()"
                [options]="tiposCierre"
                [value]="tipoCierre()"
                (valueChange)="cambiarTipoCierre($any($event))"
              />
              <siaf-date-time-picker label="Fecha inicio desde" [fullWidth]="true" [defaultToToday]="false" [disabled]="true" [value]="fechaInicio()" />
              <siaf-date-time-picker label="Fecha fin hasta" [fullWidth]="true" [defaultToToday]="false" [disabled]="true" [value]="fechaFin()" />
              <siaf-date-time-picker
                [label]="tipoCierre() === 'operativo' ? 'Fecha cierre operativo' : 'Fecha cierre contable'"
                [fullWidth]="true"
                [defaultToToday]="false"
                [disabled]="!periodo()"
                [value]="fechaCierre()"
                (valueChange)="fechaCierre.set($event)"
              />
            </div>
          </section>
        </siaf-solicitude-form-card>

        <siaf-solicitude-form-card title="Justificación del sustento">
          <text-area-control
            placeholder="Justificación del requerimiento solicitado"
            [required]="true"
            [maxlength]="500"
            [minlength]="minCaracteresTexto"
            [value]="justificacion()"
            (valueChange)="justificacion.set($event)"
          />

          <div class="flex flex-col gap-siaf-xs">
            <div class="flex min-h-10 items-center justify-between gap-siaf-md">
              <h3 class="m-0 text-sm font-bold uppercase text-text">Documento de sustento</h3>
              <siaf-button variant="accent" size="md" icon="file_upload" [iconOnly]="true" ariaLabel="Subir documento" (click)="panelSustentoAbierto.set(true)" />
            </div>
            @if (sustento()) {
              <siaf-uploaded-file-card [file]="sustento()" (replace)="panelSustentoAbierto.set(true)" (removed)="sustento.set(null)" />
            } @else {
              <div class="flex min-h-[49px] items-center rounded-siaf-md bg-[var(--sys-color-bg-surfaces-surface-low)] px-siaf-md py-siaf-sm">
                <p class="m-0 text-sm text-[var(--sys-color-text-neutral-medium)]">No se han adjuntado archivos. Por favor, haga clic en el botón para subir un archivo.</p>
              </div>
            }
          </div>
        </siaf-solicitude-form-card>

        <siaf-solicitude-form-card title="Historial de la configuración">
          @if (periodo()) {
            <siaf-apertura-historial-configuracion [entradas]="historial()" />
          } @else {
            <div class="flex min-h-[49px] items-center rounded-siaf-md bg-[var(--sys-color-bg-surfaces-surface-low)] px-siaf-md py-siaf-sm">
              <p class="m-0 text-sm text-[var(--sys-color-text-neutral-medium)]">Seleccione un periodo para ver el historial de su configuración.</p>
            </div>
          }
        </siaf-solicitude-form-card>
      </div>
    </div>

    <siaf-selection-side-nav
      title="Seleccionar periodo"
      mode="single"
      idKey="periodo"
      searchPlaceholder="Buscar"
      [open]="panelPeriodoAbierto()"
      [customTable]="true"
      [paginated]="true"
      [showTopPagination]="true"
      [searchValue]="busquedaPanel()"
      [selectedIds]="idTemporal() ? [idTemporal()] : []"
      [page]="paginaPanel()"
      [pageSize]="filasPorPaginaPanel()"
      [rowsPerPage]="filasPorPaginaPanel()"
      [totalItems]="periodosFiltrados().length"
      [totalPages]="totalPaginasPanel()"
      (searchChange)="buscarEnPanel($event)"
      (previousPage)="paginaPanel.set(paginaPanel() - 1)"
      (nextPage)="paginaPanel.set(paginaPanel() + 1)"
      (rowsPerPageChange)="cambiarFilasPanel($event)"
      (accepted)="aceptarPeriodo($event)"
      (closed)="panelPeriodoAbierto.set(false)"
    >
      <div class="siaf-sidepanel-table-scroll">
        <table class="w-full min-w-[1000px] border-collapse text-left text-sm" aria-label="Periodos del pliego">
          <thead>
            <tr class="h-10 bg-[var(--sys-color-bg-surfaces-surface-high)] text-xs font-bold uppercase text-text">
              <th class="w-12 rounded-l-siaf-sm px-siaf-sm"></th>
              @for (columna of columnasPanel; track columna; let ultima = $last) {
                <th class="px-siaf-md py-siaf-sm" [class.rounded-r-siaf-sm]="ultima" scope="col">{{ columna }}</th>
              }
            </tr>
          </thead>
          <tbody>
            <tr class="h-12 border-b border-[var(--sys-color-divider-default)]">
              <td colspan="9" class="p-0">
                <button
                  type="button"
                  class="flex h-12 w-full items-center gap-siaf-md px-siaf-sm text-left text-sm font-bold text-[var(--sys-color-text-neutral-high)] hover:bg-[var(--sys-color-bg-states-light-hover)]"
                  [attr.aria-expanded]="anioAbierto()"
                  (click)="anioAbierto.set(!anioAbierto())"
                >
                  <siaf-icon [name]="anioAbierto() ? 'expand_less' : 'expand_more'" [size]="24" />
                  2026
                </button>
              </td>
            </tr>
            @if (anioAbierto()) {
              @for (fila of periodosPanel(); track fila.periodo) {
                <tr
                  class="h-14 cursor-pointer border-b border-[var(--sys-color-divider-default)] text-[var(--sys-color-text-neutral-medium)] hover:bg-surface-muted"
                  [class.bg-[var(--sys-color-bg-states-light-selected)]]="idTemporal() === fila.periodo"
                  (click)="idTemporal.set(fila.periodo)"
                >
                  <td class="px-siaf-sm" (click)="$event.stopPropagation()">
                    <input
                      class="size-4 accent-brand-primary"
                      type="radio"
                      name="periodo-radio"
                      [checked]="idTemporal() === fila.periodo"
                      [attr.aria-label]="'Seleccionar periodo ' + fila.periodo"
                      (change)="idTemporal.set(fila.periodo)"
                    />
                  </td>
                  <td class="px-siaf-md py-siaf-sm">{{ fila.periodo }}</td>
                  <td class="px-siaf-md py-siaf-sm">{{ fila.fechaInicio }}</td>
                  <td class="px-siaf-md py-siaf-sm">{{ fila.fechaFin }}</td>
                  <td class="px-siaf-md py-siaf-sm font-bold">{{ fila.cierreOperativo }}</td>
                  <td class="px-siaf-md py-siaf-sm">
                    <siaf-record-status-tag [status]="estadoDe(fila)" />
                  </td>
                  <td class="px-siaf-md py-siaf-sm font-bold">{{ fila.cierreContable }}</td>
                  <td class="px-siaf-md py-siaf-sm font-bold">{{ fila.condicionContable }}</td>
                  <td class="px-siaf-md py-siaf-sm">{{ fila.responsable }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="px-siaf-md py-siaf-lg text-center text-text-muted">No se encontraron resultados.</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </siaf-selection-side-nav>

    <siaf-upload-side-nav [open]="panelSustentoAbierto()" (closed)="panelSustentoAbierto.set(false)" (confirmed)="onSustentoConfirmado($event)" />

    <siaf-modal
      variant="custom"
      title="¿Grabar configuración?"
      description="Los registros se grabarán"
      illustrationSrc="assets/figma/modals/save_1.svg"
      confirmVariant="primary"
      confirmLabel="Aceptar"
      [showIllustration]="true"
      [open]="modalGrabar()"
      (canceled)="modalGrabar.set(false)"
      (closed)="modalGrabar.set(false)"
      (confirmed)="confirmarGrabar()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AperturaContableMensualEditarComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly breadcrumbs = buildProcessBreadcrumbs(CONFIGURACION_PROCESS_ID, CONFIGURACION_ROUTE, 'Editar apertura contable mensual');
  readonly tiposCierre = TIPOS_CIERRE;
  readonly columnasPanel = COLUMNAS_PANEL;
  readonly minCaracteresTexto = MIN_CARACTERES_TEXTO_LIBRE;

  readonly pliego = signal<SituacionPliego | null>(this.buscarPliego());

  readonly tipoCierre = signal<TipoCierre>('operativo');
  readonly periodo = signal<SituacionPeriodoPliego | null>(null);
  readonly fechaInicio = signal(this.fechaInicial('fechaInicio'));
  readonly fechaFin = signal(this.fechaInicial('fechaFin'));
  readonly fechaCierre = signal(this.fechaInicial('cierreOperativo'));
  readonly justificacion = signal('');
  readonly sustento = signal<UploadedFileInfo | null>(null);

  readonly panelPeriodoAbierto = signal(false);
  readonly panelSustentoAbierto = signal(false);
  readonly modalGrabar = signal(false);

  readonly idTemporal = signal('');
  readonly busquedaPanel = signal('');
  readonly paginaPanel = signal(1);
  readonly filasPorPaginaPanel = signal(25);
  readonly anioAbierto = signal(true);

  readonly historial = computed<EntradaHistorial[]>(() => {
    const elegido = this.periodo();
    if (!elegido) return [];
    const fecha = elegido.cierreOperativo;
    const estado = elegido.estadoOperativo as EntradaHistorial['estado'];
    const entradas: EntradaHistorial[] = [
      { item: 1, fechaHora: `${fecha} 09:05:34`, tipoAccion: 'Creación', usuario: 'SIAF - RP', cierreContable: elegido.cierreContable, estado },
    ];
    if (elegido.cierreContable !== '--') {
      entradas.unshift({ item: 2, fechaHora: `${fecha} 10:24:27`, tipoAccion: 'Modificación', usuario: elegido.responsable, cierreContable: elegido.cierreContable, estado });
    }
    return entradas;
  });
  readonly camposPliego = computed<SummaryCardField[]>(() => [{ label: 'Nombre del pliego', value: this.pliego()?.pliego ?? '' }]);
  readonly camposPeriodo = computed<SummaryCardField[]>(() => {
    const elegido = this.periodo();
    return elegido ? [{ label: 'Periodo mensual', value: elegido.periodo }] : [];
  });

  readonly periodosFiltrados = computed(() => {
    const termino = this.normalizar(this.busquedaPanel());
    const periodos = this.pliego()?.periodos ?? [];
    return termino ? periodos.filter((p) => this.normalizar(Object.values(p).join(' ')).includes(termino)) : periodos;
  });
  readonly totalPaginasPanel = computed(() => Math.max(1, Math.ceil(this.periodosFiltrados().length / this.filasPorPaginaPanel())));
  readonly periodosPanel = computed(() => {
    const inicio = (this.paginaPanel() - 1) * this.filasPorPaginaPanel();
    return this.periodosFiltrados().slice(inicio, inicio + this.filasPorPaginaPanel());
  });

  private readonly foto = crearSnapshotFormulario(this.valores());

  readonly puedeGrabar = computed(
    () =>
      this.periodo() !== null &&
      cumpleMinimoTextoLibre(this.justificacion()) &&
      hayCambiosRespectoAlSnapshot(this.foto, crearSnapshotFormulario(this.valores())),
  );

  estadoDe(fila: SituacionPeriodoPliego): RecordStatus {
    return fila.estadoOperativo as RecordStatus;
  }

  abrirPanelPeriodo(): void {
    this.idTemporal.set(this.periodo()?.periodo ?? '');
    this.busquedaPanel.set('');
    this.paginaPanel.set(1);
    this.panelPeriodoAbierto.set(true);
  }

  buscarEnPanel(texto: string): void {
    this.busquedaPanel.set(texto);
    this.paginaPanel.set(1);
  }

  cambiarFilasPanel(filas: number): void {
    this.filasPorPaginaPanel.set(filas);
    this.paginaPanel.set(1);
  }

  aceptarPeriodo(ids: string[]): void {
    const elegido = (this.pliego()?.periodos ?? []).find((p) => p.periodo === ids[0]) ?? null;
    this.panelPeriodoAbierto.set(false);
    if (!elegido) return;

    this.periodo.set(elegido);
    this.fechaInicio.set(ddmmyyyyToIso(elegido.fechaInicio));
    this.fechaFin.set(ddmmyyyyToIso(elegido.fechaFin));
    this.fechaCierre.set(this.fechaDeCierre(elegido));
  }

  cambiarTipoCierre(tipo: TipoCierre): void {
    this.tipoCierre.set(tipo);
    this.fechaCierre.set(this.fechaDeCierre(this.periodo() ?? this.pliego()?.periodos[0]));
  }

  onSustentoConfirmado(archivo: File): void {
    this.sustento.set(archivo);
    this.panelSustentoAbierto.set(false);
  }

  /** Aceptar en el modal: vuelve a «Pliegos», donde se muestra el aviso de éxito. */
  confirmarGrabar(): void {
    this.modalGrabar.set(false);
    if (!this.puedeGrabar()) return;
    void this.router.navigate([CONFIGURACION_ROUTE], { queryParams: { tab: 'pliegos' }, state: { grabado: true } });
  }

  volver(): void {
    void this.router.navigate([CONFIGURACION_ROUTE], { queryParams: { tab: 'pliegos' } });
  }

  private buscarPliego(): SituacionPliego | null {
    const id = this.route.snapshot.paramMap.get('pliegoId') ?? '';
    return generarSituacionPorPliego().find((p) => p.id === id) ?? null;
  }

  private fechaInicial(campo: 'fechaInicio' | 'fechaFin' | 'cierreOperativo'): string {
    return ddmmyyyyToIso(this.pliego()?.periodos[0]?.[campo] ?? '');
  }

  private fechaDeCierre(periodo: SituacionPeriodoPliego | undefined): string {
    if (!periodo) return '';
    return ddmmyyyyToIso(this.tipoCierre() === 'operativo' ? periodo.cierreOperativo : periodo.cierreContable);
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  private valores(): unknown {
    return {
      periodo: this.periodo()?.periodo ?? null,
      tipoCierre: this.tipoCierre(),
      fechaInicio: this.fechaInicio(),
      fechaFin: this.fechaFin(),
      fechaCierre: this.fechaCierre(),
      justificacion: this.justificacion(),
      sustento: identidadArchivo(this.sustento() as { name: string; size?: number } | null),
    };
  }
}
