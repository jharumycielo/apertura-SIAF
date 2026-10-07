import { DEFAULT_PROCESS_TREE, ProcessMenuNode, filtrarArbolPorRol } from './process-tree.util';

const ids = (nodos: readonly ProcessMenuNode[]): string[] => nodos.flatMap((n) => [n.id, ...ids(n.children ?? [])]);

describe('process-tree.util · filtrarArbolPorRol', () => {
  it('el creador ve la configuración de apertura contable mensual', () => {
    expect(ids(filtrarArbolPorRol(DEFAULT_PROCESS_TREE, 'creator'))).toContain('configuracion-apertura-contable-mensual');
  });

  it('el aprobador no la ve, pero sí el resto de «Apertura contable»', () => {
    const visibles = ids(filtrarArbolPorRol(DEFAULT_PROCESS_TREE, 'approver'));

    expect(visibles).not.toContain('configuracion-apertura-contable-mensual');
    expect(visibles).toContain('consulta-apertura-contable-anual');
    expect(visibles).toContain('apertura-contable-mensual');
  });

  it('quita los agrupadores que se quedan sin hijos y no modifica el árbol original', () => {
    const arbol: ProcessMenuNode[] = [
      { id: 'grupo', label: 'Grupo', children: [{ id: 'solo-creador', label: 'Solo creador', roles: ['creator'] }] },
      { id: 'hoja', label: 'Hoja' },
    ];

    expect(ids(filtrarArbolPorRol(arbol, 'approver'))).toEqual(['hoja']);
    expect(ids(arbol)).toEqual(['grupo', 'solo-creador', 'hoja']);
  });
});
