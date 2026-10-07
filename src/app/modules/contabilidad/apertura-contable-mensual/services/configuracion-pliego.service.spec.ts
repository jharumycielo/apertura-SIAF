import { TestBed } from '@angular/core/testing';

import { CurrentUserService } from '../../../../core/auth/current-user.service';
import { CLAVE_CONFIGURACIONES_APERTURA, generarSituacionPorPliego } from '../models/apertura-contable-mensual.model';
import { ConfiguracionPliegoService, EdicionPliego } from './configuracion-pliego.service';

describe('ConfiguracionPliegoService', () => {
  let servicio: ConfiguracionPliegoService;
  const [salud, defensa] = generarSituacionPorPliego();

  const edicion = (pliego = defensa): EdicionPliego => ({
    periodo: pliego.periodos[1],
    tipoCierre: 'Contable',
    fechaInicio: '01/02/2026',
    fechaFin: '28/02/2026',
    fechaCierre: '18/03/2026',
    justificacion: 'Cambio al cierre contable',
    archivo: null,
  });

  beforeEach(() => {
    localStorage.removeItem(CLAVE_CONFIGURACIONES_APERTURA);
    servicio = TestBed.inject(ConfiguracionPliegoService);
  });

  afterAll(() => localStorage.removeItem(CLAVE_CONFIGURACIONES_APERTURA));

  it('un pliego que nunca se editó muestra la configuración de ejemplo', () => {
    const configuracion = servicio.obtener(defensa.id);

    expect(configuracion.tipoCierre).toBe('Operativo');
    expect(configuracion.periodo).toBe('2026 - 01');
    expect(configuracion.historial.length).toBe(2);
  });

  it('lo grabado en la edición es lo que muestra el detalle de ese pliego', () => {
    servicio.guardar(defensa.id, edicion());

    const configuracion = servicio.obtener(defensa.id);
    expect(configuracion.tipoCierre).toBe('Contable');
    expect(configuracion.periodo).toBe('2026 - 02');
    expect(configuracion.fechaCierre).toBe('18/03/2026');
    expect(configuracion.justificacion).toBe('Cambio al cierre contable');
  });

  it('cada edición agrega una «Modificación» al historial, la más reciente primero', () => {
    servicio.guardar(defensa.id, edicion());
    servicio.guardar(defensa.id, edicion());

    const historial = servicio.obtener(defensa.id).historial;
    expect(historial.map((e) => e.item)).toEqual([4, 3, 2, 1]);
    expect(historial[0].tipoAccion).toBe('Modificación');
  });

  it('sin documento nuevo conserva el anterior; con uno, lo reemplaza', () => {
    servicio.guardar(defensa.id, edicion());
    expect(servicio.obtener(defensa.id).archivo?.name).toBe('DocEntregable001.pdf');

    servicio.guardar(defensa.id, { ...edicion(), archivo: { name: 'sustento.pdf', size: 1024 } });
    expect(servicio.obtener(defensa.id).archivo).toEqual({ name: 'sustento.pdf', size: 1024 });
  });

  it('cada ámbito tiene sus propias ediciones', () => {
    const usuario = TestBed.inject(CurrentUserService);
    usuario.setUser({ name: 'Creador', office: 'MEF - DGCP', nivelAmbito: 'DGCP' });
    servicio.guardar(defensa.id, edicion());

    usuario.setUser({ name: 'Creador', office: 'MINSA - OGA', nivelAmbito: 'PLIEGO' });
    expect(servicio.obtener(defensa.id).tipoCierre).toBe('Operativo');

    usuario.setUser({ name: 'Creador', office: 'MEF - DGCP', nivelAmbito: 'DGCP' });
    expect(servicio.obtener(defensa.id).tipoCierre).toBe('Contable');
  });

  it('editar un pliego no cambia a los demás', () => {
    servicio.guardar(defensa.id, edicion());

    expect(servicio.obtener(salud.id).tipoCierre).toBe('Operativo');
    expect(servicio.obtener(salud.id).historial.length).toBe(2);
  });
});
