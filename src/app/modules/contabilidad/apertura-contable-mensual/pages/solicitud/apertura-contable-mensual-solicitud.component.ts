import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PermissionService } from '../../../../../core/auth/permission.service';
import { ESTADO, MOTIVOS_RECHAZO } from '../../../../../core/models/documento.model';
import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RequestApprovalModalsComponent } from '../../../../../shared/components/request-approval-modals/request-approval-modals.component';
import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { SolicitudeHeaderState } from '../../../../../shared/components/solicitude-header/solicitude-header.component';
import { SolicitudeInfoCardComponent, SolicitudeInfoField } from '../../../../../shared/components/solicitude-info-card/solicitude-info-card.component';
import { SolicitudePageLayoutComponent } from '../../../../../shared/components/solicitude-page-layout/solicitude-page-layout.component';
import { ActionTrackerComponent, ActionTrackerSummary } from '../../../../../shared/ui/action-tracker/action-tracker.component';
import { DocumentSummaryCardComponent } from '../../../../../shared/ui/document-summary-card/document-summary-card.component';
import { FlowStatus } from '../../../../../shared/ui/flow-status-tag/flow-status-tag.component';
import { ReadonlyFieldComponent } from '../../../../../shared/ui/readonly-field/readonly-field.component';
import { SnackbarVariant } from '../../../../../shared/ui/snackbar/snackbar.component';
import { SummaryCardComponent, SummaryCardField } from '../../../../../shared/ui/summary-card/summary-card.component';
import { UploadedFileCardComponent } from '../../../../../shared/ui/uploaded-file-card/uploaded-file-card.component';
import { DOCUMENTOS_ROUTE } from '../../config/apertura-contable-mensual.rutas';
import { generarConfiguracionDePliego, nombrePeriodo } from '../../models/apertura-contable-mensual.model';
import { ConfiguracionPliegoService } from '../../services/configuracion-pliego.service';
import { DocumentoAperturaService } from '../../services/documento-apertura.service';

const NUMERO_DOCUMENTO = '0001';
const FECHA_REGISTRO = '19/08/2025 08:00:59';
const RESPONSABLE = 'RICARDO JOHN DOE BUSTAMANTE';

const pad = (n: number): string => String(n).padStart(2, '0');

function ahora(): string {
  const f = new Date();
  return `${pad(f.getDate())}/${pad(f.getMonth() + 1)}/${f.getFullYear()} ${pad(f.getHours())}:${pad(f.getMinutes())}:${pad(f.getSeconds())}`;
}

/**
 * Aprobar una «Configuración mensual» (Figma node-id 2424:243273): se llega al pulsar el nombre del documento en
 * «Documentos y registros». Muestra el documento (fecha, ente rector, entidad, número y estado), la apertura contable
 * mensual de solo lectura, la justificación con su sustento y el seguimiento. El aprobador puede aprobar, observar o
 * rechazar; en el taller no hay backend para este documento, así que su estado queda en el navegador.
 */
@Component({
  selector: 'siaf-apertura-contable-mensual-solicitud',
  standalone: true,
  imports: [
    ActionTrackerComponent,
    DocumentSummaryCardComponent,
    ReadonlyFieldComponent,
    RequestApprovalModalsComponent,
    SolicitudeFormCardComponent,
    SolicitudeInfoCardComponent,
    SolicitudePageLayoutComponent,
    SummaryCardComponent,
    UploadedFileCardComponent,
  ],
  template: `
    <div class="min-h-[calc(100vh-56px)] bg-[var(--sys-color-bg-surfaces-surface-lowest)] text-text">
      <siaf-solicitude-page-layout
        [breadcrumbs]="breadcrumbs"
        [role]="headerRole()"
        [state]="headerState()"
        heading="Configuración mensual"
        secondaryText="Modificación"
        [showReturn]="true"
        (returned)="volver()"
        (approved)="abrirAprobar()"
        (observed)="abrirObservar()"
        (rejected)="abrirRechazar()"
      >
        <section class="grid gap-siaf-md lg:grid-cols-[1fr_360px]">
          <siaf-solicitude-info-card [fields]="camposDocumento" />
          <siaf-document-summary-card [documentNumber]="numero" [status]="estadoDocumento()" />
        </section>

        <siaf-solicitude-form-card title="Apertura contable mensual">
          <section class="flex flex-col gap-siaf-sm" aria-labelledby="solicitud-pliego">
            <h3 id="solicitud-pliego" class="m-0 text-sm font-bold uppercase text-text">Pliego</h3>
            <siaf-summary-card [bordered]="true" [showClose]="false" [fields]="camposPliego" />
          </section>

          <section class="flex flex-col gap-siaf-sm" aria-labelledby="solicitud-periodo">
            <h3 id="solicitud-periodo" class="m-0 text-sm font-bold uppercase text-text">Periodo</h3>
            <siaf-summary-card [bordered]="true" [showClose]="false" [fields]="camposPeriodo" />
          </section>

          <section class="flex flex-col gap-siaf-sm" aria-labelledby="solicitud-fechas">
            <h3 id="solicitud-fechas" class="m-0 text-sm font-bold uppercase text-text">Fecha (cierre operativo / cierre contable)</h3>
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
            @if (configuracion.archivo) {
              <siaf-uploaded-file-card [file]="configuracion.archivo" [readonly]="true" />
            }
          </div>
        </siaf-solicitude-form-card>

        <siaf-action-tracker [showSummaryCards]="true" [showTabs]="false" [summaryItems]="trazabilidad()" />
      </siaf-solicitude-page-layout>

      <siaf-request-approval-modals
        [approveOpen]="modalAprobar()"
        [observeOpen]="modalObservar()"
        [rejectOpen]="modalRechazar()"
        [reason]="comentario()"
        [rejectReasonType]="motivoRechazo()"
        [rejectReasonTypeOptions]="motivosRechazo"
        [snackbarVariant]="aviso()"
        [snackbarOpen]="avisoAbierto()"
        requestType="modificación"
        [requestNumber]="numero"
        (approveConfirmed)="resolver('approve')"
        (observeConfirmed)="resolver('observe')"
        (rejectConfirmed)="resolver('reject')"
        (approvalClosed)="cerrarModales()"
        (reasonChange)="comentario.set($event)"
        (rejectReasonTypeChange)="motivoRechazo.set($event)"
        (snackbarClosed)="avisoAbierto.set(false)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AperturaContableMensualSolicitudComponent {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly documentos = inject(DocumentoAperturaService);
  private readonly configuraciones = inject(ConfiguracionPliegoService);

  readonly numero = NUMERO_DOCUMENTO;
  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/panel' },
    { label: 'Apertura contable', href: '/panel' },
    { label: 'Proceso de apertura contable', href: '/panel' },
    { label: 'Documentos y registros', href: DOCUMENTOS_ROUTE },
    { label: 'Configuración mensual' },
  ];

  readonly configuracion = generarConfiguracionDePliego();
  readonly camposDocumento: SolicitudeInfoField[] = [
    { label: 'Fecha', value: FECHA_REGISTRO },
    { label: 'Ente rector', value: 'DIRECCIÓN GENERAL DE CONTABILIDAD PÚBLICA' },
    { label: 'Entidad', value: '009 - MINISTERIO DE ECONOMÍA FINANZAS' },
  ];
  readonly camposPliego: SummaryCardField[] = [{ label: 'Nombre del pliego', value: 'MINISTERIO DE SALUD' }];
  readonly camposPeriodo: SummaryCardField[] = [{ label: 'Periodo mensual', value: nombrePeriodo(this.configuracion.periodo) }];

  readonly seguimiento = signal(this.documentos.obtener(NUMERO_DOCUMENTO));
  readonly estadoDocumento = computed(() => this.seguimiento().estado as FlowStatus);
  readonly headerRole = computed<'creator' | 'approver'>(() => (this.permissions.currentRole() === 'approver' ? 'approver' : 'creator'));
  readonly headerState = computed<SolicitudeHeaderState>(() => {
    switch (this.seguimiento().estado) {
      case ESTADO.APROBADO: return 'approved';
      case ESTADO.OBSERVADO: return 'observed';
      case ESTADO.RECHAZADO: return 'rejected';
      default: return 'verified';
    }
  });

  readonly trazabilidad = computed<ActionTrackerSummary[]>(() => {
    const { estado, resueltoPor } = this.seguimiento();
    const etiqueta = estado === ESTADO.OBSERVADO ? 'Observado por' : estado === ESTADO.RECHAZADO ? 'Rechazado por' : 'Aprobado por';
    return [
      { label: 'Elaborado por', actionBy: RESPONSABLE, date: FECHA_REGISTRO },
      { label: 'Verificado por', actionBy: RESPONSABLE, date: FECHA_REGISTRO },
      {
        label: etiqueta,
        actionBy: resueltoPor?.usuario ?? 'No asignado aún',
        date: resueltoPor?.fecha ?? 'Fecha y hora no registradas',
      },
    ];
  });

  readonly modalAprobar = signal(false);
  readonly modalObservar = signal(false);
  readonly modalRechazar = signal(false);
  readonly comentario = signal('');
  readonly motivoRechazo = signal('');
  readonly motivosRechazo = [...MOTIVOS_RECHAZO];
  readonly aviso = signal<SnackbarVariant>('modification-approved');
  readonly avisoAbierto = signal(false);

  abrirAprobar(): void {
    this.comentario.set('');
    this.modalAprobar.set(true);
  }

  abrirObservar(): void {
    this.comentario.set('');
    this.modalObservar.set(true);
  }

  abrirRechazar(): void {
    this.comentario.set('');
    this.motivoRechazo.set('');
    this.modalRechazar.set(true);
  }

  cerrarModales(): void {
    this.modalAprobar.set(false);
    this.modalObservar.set(false);
    this.modalRechazar.set(false);
  }

  /** Aprobar, observar o rechazar: observar y rechazar piden el comentario. Guarda el estado y avisa. */
  resolver(accion: 'approve' | 'observe' | 'reject'): void {
    if (accion !== 'approve' && !this.comentario().trim()) return;
    this.cerrarModales();

    const estado = { approve: ESTADO.APROBADO, observe: ESTADO.OBSERVADO, reject: ESTADO.RECHAZADO }[accion];
    const nuevo = {
      estado,
      resueltoPor: { usuario: this.configuraciones.usuarioActual(), fecha: ahora() },
      comentario: accion === 'approve' ? undefined : this.comentario().trim(),
    };
    this.documentos.guardar(NUMERO_DOCUMENTO, nuevo);
    this.seguimiento.set(nuevo);
    this.aviso.set({ approve: 'modification-approved', observe: 'modification-observed', reject: 'modification-rejected' }[accion] as SnackbarVariant);
    this.avisoAbierto.set(true);
  }

  volver(): void {
    void this.router.navigate([DOCUMENTOS_ROUTE]);
  }
}
