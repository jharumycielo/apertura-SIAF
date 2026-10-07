import { TestBed } from '@angular/core/testing';

import { ESTADO } from '../../../../core/models/documento.model';
import { CLAVE_DOCUMENTOS_APERTURA } from '../models/apertura-contable-mensual.model';
import { DocumentoAperturaService } from './documento-apertura.service';

describe('DocumentoAperturaService', () => {
  let servicio: DocumentoAperturaService;

  beforeEach(() => {
    localStorage.removeItem(CLAVE_DOCUMENTOS_APERTURA);
    servicio = TestBed.inject(DocumentoAperturaService);
  });

  afterAll(() => localStorage.removeItem(CLAVE_DOCUMENTOS_APERTURA));

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
});
