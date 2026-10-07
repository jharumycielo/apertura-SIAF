import { TestBed } from '@angular/core/testing';

import { ESTADO } from '../../../../core/models/documento.model';
import { CurrentUserService } from '../../../../core/auth/current-user.service';
import { CLAVE_DOCUMENTOS_APERTURA, CLAVE_DOCUMENTOS_CREADOS } from '../models/apertura-contable-mensual.model';
import { DocumentoAperturaService } from './documento-apertura.service';

describe('DocumentoAperturaService', () => {
  let servicio: DocumentoAperturaService;

  beforeEach(() => {
    localStorage.removeItem(CLAVE_DOCUMENTOS_APERTURA);
    localStorage.removeItem(CLAVE_DOCUMENTOS_CREADOS);
    servicio = TestBed.inject(DocumentoAperturaService);
  });

  afterAll(() => {
    localStorage.removeItem(CLAVE_DOCUMENTOS_APERTURA);
    localStorage.removeItem(CLAVE_DOCUMENTOS_CREADOS);
  });

  const como = (nivelAmbito: 'DGCP' | 'PLIEGO' | 'UE') =>
    TestBed.inject(CurrentUserService).setUser({ name: 'Usuario', office: 'X', nivelAmbito });

  it('un documento que nadie resolvió está verificado', () => {
    expect(servicio.obtener('0001').estado).toBe(ESTADO.VERIFICADO);
  });

  it('recuerda el estado y quién lo resolvió', () => {
    servicio.guardar('0001', { estado: ESTADO.APROBADO, resueltoPor: { usuario: 'LUIS RAMÍREZ SOTO', fecha: '06/10/2026 16:50:37' } });

    const seguimiento = servicio.obtener('0001');
    expect(seguimiento.estado).toBe(ESTADO.APROBADO);
    expect(seguimiento.resueltoPor?.usuario).toBe('LUIS RAMÍREZ SOTO');
  });

  it('el estado de un documento no afecta a otro', () => {
    servicio.guardar('0001', { estado: ESTADO.RECHAZADO, comentario: 'No procede' });

    expect(servicio.obtener('0002').estado).toBe(ESTADO.VERIFICADO);
  });

  it('hay varios documentos de ejemplo para probar aprobar y rechazar, cada ámbito con los suyos', () => {
    como('DGCP');
    expect(servicio.listar().map((d) => d.numero)).toEqual(['0003', '0002', '0001']);

    como('PLIEGO');
    expect(servicio.listar().map((d) => d.numero)).toEqual(['0005', '0004']);
  });

  it('un documento nuevo sigue la numeración y lo ve solo el ámbito del creador (el Pliego ve el de su UE)', () => {
    const base = { entidad: '011 - Ministerio de Salud', etiquetaEntidad: 'Unidad ejecutora' as const, nombreEntidad: 'HOSPITAL NACIONAL DOS DE MAYO', creador: 'ROSA FLORES VEGA' };
    const configuracion = { periodo: '2026 - 03', tipoCierre: 'Operativo' as const, fechaInicio: '01/03/2026', fechaFin: '31/03/2026', fechaCierre: '10/04/2026', justificacion: 'Prueba', archivo: null };

    const creado = servicio.crear({ ...base, ambito: 'UE', configuracion });

    expect(creado.numero).toBe('0006');
    como('PLIEGO');
    expect(servicio.listar()[0].numero).toBe('0006');
    como('DGCP');
    expect(servicio.listar().some((d) => d.numero === '0006')).toBeFalse();
  });
});
