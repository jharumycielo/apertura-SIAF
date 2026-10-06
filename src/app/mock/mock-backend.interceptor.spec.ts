import { HttpClient, HttpErrorResponse, HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Observable } from 'rxjs';

import type { LoginResponse } from '../core/api/auth-api.service';
import type { SolicitudResponse } from '../core/api/solicitudes-api.service';
import type { CuentaBancariaDatos, CuentaBancariaRegistro } from '../modules/tesoreria/cuentas-bancarias/models/cuenta-bancaria.model';
import { mockBackendInterceptor } from './mock-backend.interceptor';
import { reiniciarDatosDemo } from './mock-db';
import { CONTRASENA_DEMO } from './usuarios-demo';

/**
 * El backend simulado sigue las reglas del flujo de una solicitud. Si una clase cambia una regla, este spec dice
 * cuál se rompió.
 */
describe('mockBackendInterceptor', () => {
  const API = '/api/v1';
  let http: HttpClient;
  let red: HttpTestingController;

  const CUENTA: CuentaBancariaDatos = {
    bancoCodigo: '002',
    tipoCuenta: 'CORRIENTE',
    moneda: 'PEN',
    numeroCuenta: '19412345678901',
    denominacion: 'Cuenta de prueba',
    fechaApertura: '2026-09-10',
    esRecaudadora: false,
  };

  /** Resuelve la petición simulada (tiene una latencia de 250 ms) y devuelve la respuesta o el error. */
  function esperar<T>(peticion: Observable<T>): { valor?: T; error?: HttpErrorResponse } {
    const resultado: { valor?: T; error?: HttpErrorResponse } = {};
    peticion.subscribe({ next: (v) => (resultado.valor = v), error: (e: HttpErrorResponse) => (resultado.error = e) });
    tick(300);
    return resultado;
  }

  function entrar(dni: string): HttpHeaders {
    const { valor } = esperar(http.post<LoginResponse>(`${API}/auth/login`, { dni, password: CONTRASENA_DEMO }));
    return new HttpHeaders({ Authorization: `Bearer ${valor!.accessToken}` });
  }

  function archivo(): FormData {
    const form = new FormData();
    form.append('archivo', new File(['%PDF'], 'constancia.pdf', { type: 'application/pdf' }));
    return form;
  }

  beforeEach(() => {
    reiniciarDatosDemo();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockBackendInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    red = TestBed.inject(HttpTestingController);
  });

  // Ninguna llamada a la API sale a la red: las responde el simulador.
  afterEach(() => red.verify());

  afterAll(() => reiniciarDatosDemo());

  it('rechaza una contraseña incorrecta con el mensaje que muestra el login', fakeAsync(() => {
    const { error } = esperar(http.post(`${API}/auth/login`, { dni: '11111111', password: 'otra' }));

    expect(error?.status).toBe(401);
    expect(error?.error.message).toContain('DNI o contraseña incorrectos');
  }));

  it('cada usuario entra con un perfil de su ámbito: DGCP, Pliego o UE', fakeAsync(() => {
    const esperado: [string, string, 'DGCP' | 'PLIEGO' | 'UE'][] = [
      ['11111111', 'CREADOR', 'DGCP'],
      ['22222222', 'APROBADOR', 'DGCP'],
      ['44444444', 'CREADOR', 'PLIEGO'],
      ['33333333', 'APROBADOR', 'PLIEGO'],
      ['55555555', 'CREADOR', 'UE'],
    ];

    for (const [dni, rol, ambito] of esperado) {
      const { valor } = esperar(http.post<LoginResponse>(`${API}/auth/login`, { dni, password: CONTRASENA_DEMO }));
      expect(valor?.perfilesDisponibles.length).withContext(dni).toBe(1);
      expect(valor?.perfilActivo.rolCodigo).withContext(dni).toBe(rol);
      expect(valor?.perfilActivo.nivelAmbito).withContext(dni).toBe(ambito);
    }
  }));

  it('cada entidad ve solo sus solicitudes: la UE comparte las del Pliego y la DGCP no las ve', fakeAsync(() => {
    const bandeja = (dni: string) =>
      esperar(http.get<SolicitudResponse[]>(`${API}/solicitudes/bandeja-creador?tipos=SRCB`, { headers: entrar(dni) })).valor!;

    expect(bandeja('11111111').length).toBe(4);
    expect(bandeja('44444444').length).toBe(8);
    expect(bandeja('55555555').map((s) => s.id).sort()).toEqual(bandeja('44444444').map((s) => s.id).sort());
    expect(bandeja('11111111').every((s) => s.entidadCreadora?.siglas === 'MEF')).toBeTrue();
  }));

  it('una solicitud de la UE la aprueba el aprobador del Pliego y no el de la DGCP', fakeAsync(() => {
    const rosa = entrar('55555555');
    const creada = esperar(http.post<SolicitudResponse>(`${API}/solicitudes`, { tipoAccion: 'creacion', organoLinea: 'OA', justificacion: 'Cuenta de la UE' }, { headers: rosa }));
    const id = creada.valor!.id;
    esperar(http.post(`${API}/solicitudes/${id}/cuenta-bancaria`, CUENTA, { headers: rosa }));
    esperar(http.post(`${API}/solicitudes/${id}/sustentos`, archivo(), { headers: rosa }));
    const elaborada = esperar(http.patch<{ numero: string }>(`${API}/solicitudes/${id}/estado`, { estadoNuevo: 'ELABORADO' }, { headers: rosa }));
    expect(elaborada.valor?.numero).toMatch(/^PCB-SRCB-00013-\d{4}-MINSA-OA$/);
    esperar(http.patch(`${API}/solicitudes/${id}/estado`, { estadoNuevo: 'VERIFICADO' }, { headers: rosa }));

    const avisos = (dni: string) =>
      esperar(http.get<{ documento: { id: string } }[]>(`${API}/notificaciones`, { headers: entrar(dni) })).valor!;
    expect(avisos('33333333').some((n) => n.documento.id === id)).toBeTrue();
    expect(avisos('22222222').some((n) => n.documento.id === id)).toBeFalse();
  }));

  it('la bandeja no muestra solicitudes en NUEVO y pagina si se pide', fakeAsync(() => {
    const headers = entrar('11111111');
    esperar(http.post(`${API}/solicitudes`, { tipoAccion: 'creacion', organoLinea: 'DGCP', justificacion: 'Borrador' }, { headers }));

    const { valor } = esperar(http.get<{ data: SolicitudResponse[]; total: number }>(`${API}/solicitudes/bandeja-creador?tipos=SRCB&page=1&limit=3`, { headers }));

    expect(valor?.data.length).toBe(3);
    expect(valor?.total).toBe(4);
  }));

  it('recorre el flujo completo: elaborar, verificar y aprobar crea la cuenta y avisa a cada rol', fakeAsync(() => {
    const ana = entrar('11111111');
    const creada = esperar(http.post<SolicitudResponse>(`${API}/solicitudes`, { tipoAccion: 'creacion', organoLinea: 'DGCP', justificacion: 'Cuenta nueva' }, { headers: ana }));
    const id = creada.valor!.id;

    // Sin datos ni sustento no se puede elaborar.
    expect(esperar(http.patch(`${API}/solicitudes/${id}/estado`, { estadoNuevo: 'ELABORADO' }, { headers: ana })).error?.status).toBe(400);

    esperar(http.post(`${API}/solicitudes/${id}/cuenta-bancaria`, CUENTA, { headers: ana }));
    esperar(http.post(`${API}/solicitudes/${id}/sustentos`, archivo(), { headers: ana }));
    const elaborada = esperar(http.patch<{ numero: string }>(`${API}/solicitudes/${id}/estado`, { estadoNuevo: 'ELABORADO' }, { headers: ana }));
    expect(elaborada.valor?.numero).toMatch(/^PCB-SRCB-00013-\d{4}-MEF-DGCP$/);

    // El creador no puede aprobar.
    expect(esperar(http.patch(`${API}/solicitudes/${id}/estado`, { estadoNuevo: 'APROBADO' }, { headers: ana })).error?.status).toBe(409);
    esperar(http.patch(`${API}/solicitudes/${id}/estado`, { estadoNuevo: 'VERIFICADO' }, { headers: ana }));

    const luis = entrar('22222222');
    const avisos = esperar(http.get<{ titulo: string; documento: { id: string } }[]>(`${API}/notificaciones`, { headers: luis }));
    expect(avisos.valor?.some((n) => n.documento.id === id && n.titulo === 'Solicitud por aprobar')).toBeTrue();

    esperar(http.patch(`${API}/solicitudes/${id}/estado`, { estadoNuevo: 'APROBADO' }, { headers: luis }));

    const registros = esperar(http.get<CuentaBancariaRegistro[]>(`${API}/cuentas-bancarias`, { headers: luis }));
    const cuenta = registros.valor?.find((r) => r.documentoId === id);
    expect(cuenta?.codigo).toBe('CB-0009');
    expect(cuenta?.numeroCuenta).toBe(CUENTA.numeroCuenta);

    const detalle = esperar(http.get<SolicitudResponse>(`${API}/solicitudes/${id}`, { headers: luis }));
    expect(detalle.valor?.historialEstados?.map((h) => h.estadoNuevo)).toEqual(['NUEVO', 'ELABORADO', 'VERIFICADO', 'APROBADO']);

    const avisosAna = esperar(http.get<{ titulo: string; documento: { id: string } }[]>(`${API}/notificaciones`, { headers: ana }));
    expect(avisosAna.valor?.some((n) => n.documento.id === id && n.titulo === 'Solicitud aprobada')).toBeTrue();
  }));

  it('observar pide comentario y una solicitud observada ya no se puede eliminar', fakeAsync(() => {
    const luis = entrar('22222222');
    const bandeja = esperar(http.get<SolicitudResponse[]>(`${API}/solicitudes/bandeja-aprobador?tipos=SRCB`, { headers: luis }));
    const verificada = bandeja.valor!.find((s) => s.estado === 'VERIFICADO')!;

    expect(esperar(http.patch(`${API}/solicitudes/${verificada.id}/estado`, { estadoNuevo: 'OBSERVADO' }, { headers: luis })).error?.status).toBe(400);
    esperar(http.patch(`${API}/solicitudes/${verificada.id}/estado`, { estadoNuevo: 'OBSERVADO', comentario: 'Falta la constancia.' }, { headers: luis }));

    const ana = entrar('11111111');
    esperar(http.patch(`${API}/solicitudes/${verificada.id}/estado`, { estadoNuevo: 'ELABORADO' }, { headers: ana }));
    const eliminar = esperar(http.patch(`${API}/solicitudes/${verificada.id}/estado`, { estadoNuevo: 'ELIMINADO' }, { headers: ana }));

    expect(eliminar.error?.status).toBe(409);
    expect(eliminar.error?.error.message).toContain('observada');
  }));

  it('deja pasar lo que no es de la API (los assets)', () => {
    http.get('assets/datos.json').subscribe();

    red.expectOne('assets/datos.json').flush({});
  });
});
