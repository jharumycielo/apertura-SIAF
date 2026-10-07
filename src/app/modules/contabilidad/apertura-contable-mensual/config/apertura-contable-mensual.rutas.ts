/** Rutas e ids del proceso. El id existe en `DEFAULT_PROCESS_TREE` (shared/utils/process-tree.util.ts). */
export const CONFIGURACION_ROUTE = '/procesos/apertura-contable-mensual/configuracion';
export const EDITAR_ROUTE = `${CONFIGURACION_ROUTE}/editar`;
export const DETALLE_ROUTE = `${CONFIGURACION_ROUTE}/detalle`;
export const CONFIGURACION_PROCESS_ID = 'configuracion-apertura-contable-mensual';

/** Hoja «Apertura contable mensual» del árbol: «Documentos y registros» (Figma node-id 2426:254229). */
export const DOCUMENTOS_ROUTE = '/procesos/apertura-contable-mensual';
export const DOCUMENTOS_PROCESS_ID = 'apertura-contable-mensual';
export const SOLICITUD_ROUTE = `${DOCUMENTOS_ROUTE}/solicitud`;
