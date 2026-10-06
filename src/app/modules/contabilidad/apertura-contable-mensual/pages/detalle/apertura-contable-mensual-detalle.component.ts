import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { ReadonlyFieldComponent } from '../../../../../shared/ui/readonly-field/readonly-field.component';
import { SummaryCardComponent, SummaryCardField } from '../../../../../shared/ui/summary-card/summary-card.component';
import { UploadedFileCardComponent } from '../../../../../shared/ui/uploaded-file-card/uploaded-file-card.component';
import { buildProcessBreadcrumbs } from '../../../../../shared/utils/breadcrumbs.util';
import { HistorialConfiguracionComponent } from '../../components/historial-configuracion.component';
import { CONFIGURACION_PROCESS_ID, CONFIGURACION_ROUTE } from '../../config/apertura-contable-mensual.rutas';
import { generarConfiguracionDePliego, generarSituacionPorPliego, nombrePeriodo } from '../../models/apertura-contable-mensual.model';

/**
 * Detalle de solo lectura de la apertura contable mensual de un pliego (Figma node-id 2404:121770): se llega al pulsar
 * el nombre del pliego en la pestaña «Pliegos». Muestra el pliego, el periodo, el tipo y las fechas de cierre, la
 * justificación, el documento de sustento y el historial de la configuración. El nombre del pliego sale de la ruta;
 * la configuración es de ejemplo y es la misma para todos los pliegos.
 */
@Component({
  selector: 'siaf-apertura-contable-mensual-detalle',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    ButtonComponent,
    HistorialConfiguracionComponent,
    ReadonlyFieldComponent,
    SolicitudeFormCardComponent,
    SummaryCardComponent,
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
        <siaf-solicitude-form-card title="Apertura contable mensual">
          <section class="flex flex-col gap-siaf-sm" aria-labelledby="detalle-pliego">
            <h3 id="detalle-pliego" class="m-0 text-sm font-bold uppercase text-text">Pliego</h3>
            <siaf-summary-card [bordered]="true" [showClose]="false" [fields]="camposPliego()" />
          </section>

          <section class="flex flex-col gap-siaf-sm" aria-labelledby="detalle-periodo">
            <h3 id="detalle-periodo" class="m-0 text-sm font-bold uppercase text-text">Periodo</h3>
            <siaf-summary-card [bordered]="true" [showClose]="false" [fields]="camposPeriodo()" />
          </section>

          <section class="flex flex-col gap-siaf-sm" aria-labelledby="detalle-fechas">
            <h3 id="detalle-fechas" class="m-0 text-sm font-bold uppercase text-text">Fecha (cierre operativo / cierre contable)</h3>
            <div class="grid items-end gap-siaf-md lg:grid-cols-4">
              <p class="m-0 flex min-h-10 items-center gap-siaf-sm text-sm text-[var(--sys-color-text-neutral-medium)]">
                <span class="font-bold text-text">Tipo cierre</span>
                {{ configuracion.tipoCierre }}
              </p>
              <readonly-field caption="Fecha inicio desde" [value]="configuracion.fechaInicio" />
              <readonly-field caption="Fecha fin hasta" [value]="configuracion.fechaFin" />
              <readonly-field [caption]="'Fecha cierre ' + configuracion.tipoCierre.toLowerCase()" [value]="configuracion.fechaCierre" />
            </div>
          </section>
        </siaf-solicitude-form-card>

        <siaf-solicitude-form-card title="Justificación del sustento">
          <readonly-field caption="Justificación del requerimiento solicitado" [required]="true" [value]="configuracion.justificacion" />

          <div class="flex flex-col gap-siaf-xs">
            <h3 class="m-0 flex min-h-10 items-center text-sm font-bold uppercase text-text">Documento de sustento</h3>
            <siaf-uploaded-file-card [file]="configuracion.archivo" [readonly]="true" />
          </div>
        </siaf-solicitude-form-card>

        <siaf-solicitude-form-card title="Historial de la configuración">
          <siaf-apertura-historial-configuracion [entradas]="configuracion.historial" />
        </siaf-solicitude-form-card>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AperturaContableMensualDetalleComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly breadcrumbs = buildProcessBreadcrumbs(CONFIGURACION_PROCESS_ID, CONFIGURACION_ROUTE);
  readonly configuracion = generarConfiguracionDePliego();

  private readonly pliego = (() => {
    const id = this.route.snapshot.paramMap.get('pliegoId') ?? '';
    return generarSituacionPorPliego().find((p) => p.id === id)?.pliego ?? '';
  })();

  readonly camposPliego = computed<SummaryCardField[]>(() => [{ label: 'Nombre del pliego', value: this.pliego }]);
  readonly camposPeriodo = computed<SummaryCardField[]>(() => [{ label: 'Periodo mensual', value: nombrePeriodo(this.configuracion.periodo) }]);

  volver(): void {
    void this.router.navigate([CONFIGURACION_ROUTE], { queryParams: { tab: 'pliegos' } });
  }
}
