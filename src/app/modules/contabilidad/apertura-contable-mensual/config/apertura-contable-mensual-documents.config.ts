import { ESTADO } from '../../../../core/models/documento.model';
import type {
  DocumentsRecordsColumn,
  DocumentsRecordsConfig,
  DocumentsRecordsFilterOption,
  DocumentsRecordsMenuOption,
  DocumentsRecordsRow,
} from '../../../../shared/types/documents-records.types';
import type { DocumentoApertura } from '../models/apertura-contable-mensual.model';
import { DOCUMENTOS_ROUTE, SOLICITUD_ROUTE } from './apertura-contable-mensual.rutas';

/**
 * Configuración de «Documentos y registros» de la apertura contable mensual (Figma node-id 2426:254229). La pantalla la
 * pinta `siaf-documents-records-page`; aquí solo se dice qué columnas, filtros y opciones tiene. El aprobador ve los
 * documentos verificados y los aprueba con el botón «Aprobar».
 */

const documentColumns: DocumentsRecordsColumn[] = [
  { key: 'document', label: 'Documento', visibility: 'visible', group: 'default', widthClass: 'w-[280px]', kind: 'document-link' },
  { key: 'number', label: 'Número', visibility: 'visible', group: 'default', widthClass: 'w-[110px]' },
  { key: 'actionType', label: 'Tipo de acción', visibility: 'visible', group: 'default', widthClass: 'w-[160px]' },
  { key: 'status', label: 'Estado', visibility: 'visible', group: 'default', widthClass: 'w-[150px]', kind: 'flow-status' },
  { key: 'system', label: 'Sistema', visibility: 'visible', group: 'default', widthClass: 'w-[170px]' },
  { key: 'date', label: 'Fecha de registro', visibility: 'visible', group: 'default', widthClass: 'w-[170px]' },
  { key: 'entity', label: 'Entidad', visibility: 'visible', group: 'default', widthClass: 'w-[320px]' },
  { key: 'creator', label: 'Creador', visibility: 'hidden', group: 'more', widthClass: 'w-[220px]' },
  { key: 'subject', label: 'Asunto/Motivo', visibility: 'hidden', group: 'more', widthClass: 'w-[280px]' },
];

const recordColumns: DocumentsRecordsColumn[] = [
  { key: 'status', label: 'Estado', visibility: 'visible', group: 'default', widthClass: 'w-[120px]', kind: 'record-status' },
  { key: 'entity', label: 'Entidad', visibility: 'visible', group: 'default', widthClass: 'w-[320px]' },
  { key: 'periodo', label: 'Periodo', visibility: 'visible', group: 'default', widthClass: 'w-[140px]' },
  { key: 'tipoCierre', label: 'Tipo de cierre', visibility: 'visible', group: 'default', widthClass: 'w-[160px]' },
  { key: 'fechaCierre', label: 'Fecha de cierre', visibility: 'visible', group: 'default', widthClass: 'w-[160px]' },
];

const fieldsMenuOptions: DocumentsRecordsMenuOption[] = [
  { label: 'Documento' },
  { label: 'Tipo de acción' },
  { label: 'Estado' },
  { label: 'Fecha de registro', hasChildren: true },
  { label: 'Entidad' },
];

const filterCampoOptions: DocumentsRecordsFilterOption[] = [
  { label: 'Documento', value: 'document' },
  { label: 'Número', value: 'number' },
  { label: 'Tipo de acción', value: 'actionType' },
  { label: 'Estado', value: 'status' },
  { label: 'Fecha', value: 'date' },
  { label: 'Entidad', value: 'entity' },
];

const filterValorOptions: DocumentsRecordsFilterOption[] = [
  { label: ESTADO.ELABORADO, value: ESTADO.ELABORADO },
  { label: ESTADO.VERIFICADO, value: ESTADO.VERIFICADO },
  { label: ESTADO.APROBADO, value: ESTADO.APROBADO },
  { label: 'Modificación', value: 'Modificación' },
];

/** La fila de «Documentos existentes» de un documento «Configuración mensual», con el estado en que está. */
export function filaDeDocumento(documento: DocumentoApertura, estado: string): DocumentsRecordsRow {
  const { configuracion } = documento;
  return {
    document: 'Configuración mensual',
    linkRoute: `${SOLICITUD_ROUTE}/${documento.numero}`,
    number: documento.numero,
    actionType: 'Modificación',
    status: estado,
    system: 'Contabilidad',
    date: documento.fecha,
    entity: documento.entidad,
    creator: documento.creador,
    subject: `Modificación de la fecha de cierre ${configuracion.tipoCierre.toLowerCase()} de ${documento.nombreEntidad}`,
  };
}

export const APERTURA_CONTABLE_MENSUAL_DOCUMENTS_CONFIG: DocumentsRecordsConfig = {
  title: 'Apertura contable mensual',
  processId: 'apertura-contable-mensual',
  defaultRequestRoute: DOCUMENTOS_ROUTE,
  createDocumentOptions: [],
  breadcrumbs: [
    { label: 'Inicio', href: '/panel' },
    { label: 'Apertura contable', href: '/panel' },
    { label: 'Proceso de apertura contable', href: '/panel' },
    { label: 'Documentos y registros' },
  ],
  documentRows: [],
  recordRows: [],
  documentColumns,
  recordColumns,
  documentTableMinWidthClass: 'min-w-[1500px]',
  recordTableMinWidthClass: 'min-w-[900px]',
  recordTrackKey: 'recordId',
  recordHistoryDocumentLabel: 'Configuración mensual',
  statusFilterOptions: [ESTADO.ELABORADO, ESTADO.VERIFICADO, ESTADO.OBSERVADO, ESTADO.APROBADO, ESTADO.RECHAZADO],
  actionTypeFilterOptions: ['Creación', 'Modificación'],
  filterCampoOptions,
  filterValorOptions,
  fieldsMenuOptions,
};
