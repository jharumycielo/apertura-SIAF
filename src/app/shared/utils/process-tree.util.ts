/**
 * Árbol maestro de procesos + utilidad de búsqueda de ruta.
 * Vive en shared/utils/ (no en layout/) porque lo consumen tanto piezas
 * del shell (layout/process-menu-tree, layout/create-document) como
 * utilidades transversales de shared (breadcrumbs.util) — shared no debe
 * depender de layout, así que la fuente de verdad va acá.
 */
export interface ProcessMenuNode {
  id: string;
  label: string;
  selected?: boolean;
  // Solo debe marcarse en nodos raiz: la vista inicial muestra hasta el segundo nivel.
  expanded?: boolean;
  // Ruta de la página principal del módulo (documentos y registros)
  moduleRoute?: string;
  // Si un nodo tiene estas propiedades, Crear documento puede completar documento/tipo y navegar.
  createRoute?: string;
  documentOptions?: string[];
  documentCreateOptions?: Array<{
    label: string;
    route?: string;
    actionTypes?: string[];
  }>;
  actionTypeOptions?: string[];
  /**
   * Marca un nodo como módulo planificado pero aún no implementado.
   * El menú lo renderiza con texto atenuado y badge "Próximamente",
   * y el click no navega (solo expande si tiene hijos).
   */
  comingSoon?: boolean;
  children?: ProcessMenuNode[];
}

/**
 * Árbol de procesos del taller, según el nodo de Figma «Proceso Apertura Contable» (node-id 114:34913).
 * Todo el árbol es un ejemplo de cómo se ve un proceso planificado («Próximamente»): ninguna hoja tiene
 * pantallas ni datos simulados detrás. Para sumar un proceso real: una hoja con `moduleRoute` (Documentos
 * y registros) y otra para sus consultas, y sus rutas en `app.routes.ts`.
 */
export const DEFAULT_PROCESS_TREE: ProcessMenuNode[] = [
  {
    id: 'gestion-contabilidad',
    label: 'Gestión contabilidad',
    expanded: true,
    selected: true,
    children: [
      {
        id: 'catalogos-clasificadores',
        label: 'Catálogos y clasificadores',
        comingSoon: true,
        children: [
          {
            id: 'catalogo-tipo-asiento-ajuste',
            label: 'Catálogo de tipo de asiento de ajuste',
            comingSoon: true,
            children: [{ id: 'catalogo-tipo-asiento-ajuste-consultas', label: 'Consultas y reportes', comingSoon: true }],
          },
          { id: 'catalogo-eventos', label: 'Catálogo de eventos', comingSoon: true },
          { id: 'catalogo-eventos-contables', label: 'Catálogo de eventos contables', comingSoon: true },
          { id: 'plan-cuentas-contables', label: 'Plan de cuentas contables', comingSoon: true },
        ],
      },
      {
        id: 'integracion-siaf-rp-siaf-sp',
        label: 'Integración SIAF RP - SIAF SP',
        comingSoon: true,
        children: [
          { id: 'configuracion-integracion-operaciones-rp-sp', label: 'Configuración de integración de operaciones RP/SP', comingSoon: true },
          { id: 'integracion-proceso-ejecucion-job', label: 'Proceso de ejecución de job (manual y automático)', comingSoon: true },
          { id: 'integracion-consultas-reportes', label: 'Consultas y reportes', comingSoon: true },
        ],
      },
      {
        id: 'contabilizacion-automatica',
        label: 'Contabilización automática',
        comingSoon: true,
        children: [{ id: 'contabilizacion-automatica-consultas', label: 'Consultas y reportes', comingSoon: true }],
      },
      {
        id: 'apertura-contable',
        label: 'Apertura contable',
        comingSoon: true,
        children: [
          { id: 'consulta-apertura-contable-anual', label: 'Consulta de Apertura Contable Anual', comingSoon: true },
          { id: 'apertura-contable-mensual', label: 'Apertura contable mensual', comingSoon: true },
          {
            id: 'configuracion-apertura-contable-mensual',
            label: 'Configuración de apertura contable mensual',
            moduleRoute: '/procesos/apertura-contable-mensual/configuracion',
          },
        ],
      },
    ],
  },
];

export function findProcessPathById(id: string, nodes: readonly ProcessMenuNode[] = DEFAULT_PROCESS_TREE): ProcessMenuNode[] {
  for (const node of nodes) {
    if (node.id === id) {
      return [node];
    }

    const childPath = findProcessPathById(id, node.children || []);

    if (childPath.length > 0) {
      return [node, ...childPath];
    }
  }

  return [];
}

/**
 * Árbol del menú "Ajustes" (módulo de administración). Lo pinta el mismo `siaf-process-menu-tree`
 * que el menú de procesos, con otros textos. En el taller no hay módulo de administración: las hojas
 * van como «Próximamente» y no navegan.
 */
export const ADMIN_MENU_TREE: ProcessMenuNode[] = [
  {
    id: 'administracion',
    label: 'Administración',
    expanded: true,
    children: [
      {
        id: 'usuarios-accesos',
        label: 'Usuarios y accesos',
        expanded: true,
        children: [
          { id: 'gestion-usuarios', label: 'Gestión de usuarios', comingSoon: true },
          { id: 'perfiles-funcionales', label: 'Perfiles funcionales', comingSoon: true },
        ],
      },
      {
        id: 'organizacion',
        label: 'Organización',
        children: [
          { id: 'entidades', label: 'Entidades', comingSoon: true },
          { id: 'unidades', label: 'Unidades orgánicas', comingSoon: true },
        ],
      },
    ],
  },
];
