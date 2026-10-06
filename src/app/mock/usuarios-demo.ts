import type { PerfilItem } from '../core/api/auth-api.service';

/**
 * Usuarios de demostración del taller. Entran con su DNI y la contraseña común.
 *
 * Cada ámbito es una entidad distinta y cada usuario solo ve lo de su entidad:
 * - DGCP: Ana (creador) y Luis (aprobador).
 * - Pliego: Marco (creador) y Carla (aprobador).
 * - UE (unidad ejecutora del Pliego): Rosa (creador). Comparte entidad con el Pliego, así que su solicitud la
 *   aprueba Carla.
 *
 * Son datos de ejemplo: no hay contraseñas reales ni se validan contra un servidor.
 */
export const CONTRASENA_DEMO = 'Taller2026*';

export interface UsuarioDemo {
  id: string;
  dni: string;
  email: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  /** Qué muestra en el panel de usuarios del login. */
  descripcion: string;
  perfiles: PerfilItem[];
}

/** Dónde trabaja un usuario: de aquí salen la entidad y la unidad de las solicitudes que crea. */
export interface AmbitoDemo {
  entidad: string;
  entidadId: string;
  entidadCodigo: string;
  entidadSiglas: string;
  ue: string | null;
  ueId: string | null;
  ueSiglas: string | null;
  unidad: string;
  unidadSigla: string;
  unidadId: string;
  nivelAmbito: 'DGCP' | 'PLIEGO' | 'UE';
  entidadAmbitoId: string;
  entidadAmbitoCodigo: string;
}

export const AMBITO_DGCP: AmbitoDemo = {
  entidad: 'Ministerio de Economía y Finanzas',
  entidadId: 'ent-mef',
  entidadCodigo: '0001',
  entidadSiglas: 'MEF',
  ue: null,
  ueId: null,
  ueSiglas: null,
  unidad: 'Dirección General de Contabilidad Pública',
  unidadSigla: 'DGCP',
  unidadId: 'uo-dgcp',
  nivelAmbito: 'DGCP',
  entidadAmbitoId: 'amb-dgcp',
  entidadAmbitoCodigo: 'DGCP',
};

export const AMBITO_PLIEGO: AmbitoDemo = {
  entidad: 'Ministerio de Salud',
  entidadId: 'ent-minsa',
  entidadCodigo: '011',
  entidadSiglas: 'MINSA',
  ue: null,
  ueId: null,
  ueSiglas: null,
  unidad: 'Oficina General de Administración',
  unidadSigla: 'OGA',
  unidadId: 'uo-minsa-oga',
  nivelAmbito: 'PLIEGO',
  entidadAmbitoId: 'amb-pliego',
  entidadAmbitoCodigo: 'PLIEGO',
};

export const AMBITO_UE: AmbitoDemo = {
  ...AMBITO_PLIEGO,
  ue: 'Hospital Nacional Dos de Mayo',
  ueId: 'ue-hndm',
  ueSiglas: 'HNDM',
  unidad: 'Oficina de Administración',
  unidadSigla: 'OA',
  unidadId: 'uo-hndm-oa',
  nivelAmbito: 'UE',
  entidadAmbitoId: 'amb-ue',
  entidadAmbitoCodigo: 'UE',
};

function perfil(id: string, ambito: AmbitoDemo, rolCodigo: 'CREADOR' | 'APROBADOR', rol: string, perfilFuncional: string): PerfilItem {
  return {
    id,
    ...ambito,
    procedimiento: 'Registro de cuentas bancarias',
    procedimientoCodigo: 'RCB',
    rol,
    rolCodigo,
    perfilFuncional,
  };
}

const creador = (id: string, ambito: AmbitoDemo) => perfil(id, ambito, 'CREADOR', 'Creador', 'Operador de cuentas bancarias');
const aprobador = (id: string, ambito: AmbitoDemo) => perfil(id, ambito, 'APROBADOR', 'Aprobador', 'Aprobador de cuentas bancarias');

export const USUARIOS_DEMO: UsuarioDemo[] = [
  {
    id: 'usr-ana',
    dni: '11111111',
    email: 'ana.torres@taller.pe',
    nombres: 'Ana',
    apellidoPaterno: 'Torres',
    apellidoMaterno: 'Díaz',
    descripcion: 'Creador · DGCP: registra y verifica solicitudes',
    perfiles: [creador('perfil-ana-creador', AMBITO_DGCP)],
  },
  {
    id: 'usr-luis',
    dni: '22222222',
    email: 'luis.ramirez@taller.pe',
    nombres: 'Luis',
    apellidoPaterno: 'Ramírez',
    apellidoMaterno: 'Soto',
    descripcion: 'Aprobador · DGCP: aprueba, observa o rechaza',
    perfiles: [aprobador('perfil-luis-aprobador', AMBITO_DGCP)],
  },
  {
    id: 'usr-marco',
    dni: '44444444',
    email: 'marco.quispe@taller.pe',
    nombres: 'Marco',
    apellidoPaterno: 'Quispe',
    apellidoMaterno: 'Huamán',
    descripcion: 'Creador · Pliego: registra y verifica solicitudes',
    perfiles: [creador('perfil-marco-creador', AMBITO_PLIEGO)],
  },
  {
    id: 'usr-carla',
    dni: '33333333',
    email: 'carla.mendoza@taller.pe',
    nombres: 'Carla',
    apellidoPaterno: 'Mendoza',
    apellidoMaterno: 'Ríos',
    descripcion: 'Aprobador · Pliego: aprueba, observa o rechaza (Pliego y UE)',
    perfiles: [aprobador('perfil-carla-aprobador', AMBITO_PLIEGO)],
  },
  {
    id: 'usr-rosa',
    dni: '55555555',
    email: 'rosa.flores@taller.pe',
    nombres: 'Rosa',
    apellidoPaterno: 'Flores',
    apellidoMaterno: 'Vega',
    descripcion: 'Creador · UE: registra y verifica solicitudes',
    perfiles: [creador('perfil-rosa-creador', AMBITO_UE)],
  },
];

export function buscarUsuarioPorPerfil(perfilId: string): { usuario: UsuarioDemo; perfil: PerfilItem } | null {
  for (const usuario of USUARIOS_DEMO) {
    const encontrado = usuario.perfiles.find((p) => p.id === perfilId);
    if (encontrado) return { usuario, perfil: encontrado };
  }
  return null;
}
