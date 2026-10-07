import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { DocumentsRecordsPageComponent } from '../../../../../shared/components/documents-records-page/documents-records-page.component';
import type { DocumentsRecordsConfig } from '../../../../../shared/types/documents-records.types';
import { APERTURA_CONTABLE_MENSUAL_DOCUMENTS_CONFIG, filaDeDocumento } from '../../config/apertura-contable-mensual-documents.config';
import { DocumentoAperturaService } from '../../services/documento-apertura.service';

/**
 * «Documentos y registros» de la apertura contable mensual (Figma node-id 2426:254229). La pantalla entera la arma
 * `siaf-documents-records-page`; el aprobador ve los documentos verificados y los aprueba con «Aprobar». En el taller
 * no hay backend para estos documentos: hay unos de ejemplo y cada edición que graba un creador agrega uno, y el estado
 * de cada uno sale de lo que se resolvió en su pantalla.
 */
@Component({
  selector: 'siaf-apertura-contable-mensual-documentos',
  standalone: true,
  imports: [DocumentsRecordsPageComponent],
  template: `<siaf-documents-records-page [config]="config" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AperturaContableMensualDocumentosComponent {
  private readonly documentos = inject(DocumentoAperturaService);

  readonly config: DocumentsRecordsConfig = {
    ...APERTURA_CONTABLE_MENSUAL_DOCUMENTS_CONFIG,
    documentRows: this.documentos.listar().map((documento) => filaDeDocumento(documento, this.documentos.obtener(documento.numero).estado)),
  };
}
