/** Fila de la tabla «Configuración de apertura contable mensual» (Figma node-id 3142:170479). */
export interface AperturaContableMensualRegistro {
  periodo: string;
  pliego: string;
  fechaInicio: string;
  fechaFin: string;
  cierreOperativo: string;
  estadoOperativo: string;
  cierreContable: string;
  condicionContable: string;
  responsable: string;
}

const PLIEGOS = ['Ministerio de Salud', 'Ministerio de Defensa'];
const RESPONSABLE = 'RICARDO JOHN DOE BUSTAMANTE';
const AÑO = 2026;

const dd = (dia: number, mes: number): string => `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${AÑO}`;
const ultimoDia = (mes: number): number => new Date(AÑO, mes, 0).getDate();

/**
 * Datos de ejemplo de los 12 periodos del año (el Figma solo detalla enero y febrero; el resto sigue el mismo
 * patrón: cierre operativo el 10 y cierre contable el 18 del mes siguiente).
 */
export function generarRegistrosAperturaContableMensual(entidades: readonly string[] = PLIEGOS): AperturaContableMensualRegistro[] {
  const registros: AperturaContableMensualRegistro[] = [];

  for (let mes = 1; mes <= 12; mes++) {
    const mesCierre = mes === 12 ? 1 : mes + 1;

    for (const pliego of entidades) {
      registros.push({
        periodo: `${AÑO} - ${String(mes).padStart(2, '0')}`,
        pliego,
        fechaInicio: dd(1, mes),
        fechaFin: dd(ultimoDia(mes), mes),
        cierreOperativo: dd(10, mesCierre),
        estadoOperativo: 'Cerrado',
        cierreContable: dd(18, mesCierre),
        condicionContable: 'SIN DECLARAR',
        responsable: RESPONSABLE,
      });
    }
  }

  return registros;
}

/** Fila de la pestaña «Pliegos»: la situación de un periodo para un pliego (Figma node-id 2404:122064). */
export interface SituacionPeriodoPliego {
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  cierreOperativo: string;
  estadoOperativo: string;
  cierreContable: string;
  condicionContable: string;
  responsable: string;
}

export interface SituacionPliego {
  id: string;
  pliego: string;
  periodos: SituacionPeriodoPliego[];
}

const PLIEGOS_SITUACION = [
  'MINISTERIO DE SALUD',
  'MINISTERIO DE DEFENSA',
  'MINISTERIO DE EDUCACION',
  'MINISTERIO DE TRABAJO',
  'MINISTERIO DE ECONOMIA',
  'MINISTERIO DE JUSTICIA',
  'MINISTERIO DE CULTURA',
  'MINISTERIO DE ENERGIA Y MINAS',
  'MINISTERIO DE TRANSPORTES',
];

/** Estado del cierre contable de los primeros meses; del 05 en adelante aún no se declara. */
const CIERRES_CONTABLES: Record<number, { condicion: string; abierto?: boolean }> = {
  1: { condicion: 'CERRADO' },
  2: { condicion: 'OMISO' },
  3: { condicion: 'OMISO', abierto: true },
  4: { condicion: 'OMISO' },
};

/**
 * Situación de los 12 periodos de 2026 más el periodo 13 (ajustes) de cada pliego. El Figma detalla solo el
 * Ministerio de Salud; los demás pliegos siguen el mismo patrón. El periodo 13 se muestra como «2027 - 13», como en
 * el diseño.
 */
export function generarSituacionPorPliego(entidades: readonly string[] = PLIEGOS_SITUACION): SituacionPliego[] {
  return entidades.map((pliego) => {
    const periodos: SituacionPeriodoPliego[] = [];

    for (let mes = 1; mes <= 13; mes++) {
      const mesCalendario = Math.min(mes, 12);
      const cierre = CIERRES_CONTABLES[mes];
      const mesCierre = mes === 12 ? 1 : mes === 13 ? 2 : mes + 1;
      const anioCierre = mes >= 12 ? AÑO + 1 : AÑO;
      const diaFin = mes === 13 ? 31 : ultimoDia(mesCalendario);
      const fecha = (dia: number, m: number, anio = AÑO) => `${String(dia).padStart(2, '0')}/${String(m).padStart(2, '0')}/${anio}`;

      periodos.push({
        periodo: mes === 13 ? `${AÑO + 1} - 13` : `${AÑO} - ${String(mes).padStart(2, '0')}`,
        fechaInicio: fecha(1, mesCalendario),
        fechaFin: fecha(diaFin, mesCalendario),
        cierreOperativo: fecha(10, mesCierre, anioCierre),
        estadoOperativo: cierre?.abierto ? 'Abierto' : 'Cerrado',
        cierreContable: cierre ? fecha(18, mesCierre) : '--',
        condicionContable: cierre?.condicion ?? 'SIN DECLARAR',
        responsable: RESPONSABLE,
      });
    }

    return { id: pliego, pliego, periodos };
  });
}

/** Clave del `localStorage` con las configuraciones editadas de cada pliego (el reinicio de datos de la demo la borra). */
export const CLAVE_CONFIGURACIONES_APERTURA = 'taller-siaf-rp:apertura-configuraciones';

/** Clave del `localStorage` con el estado de los documentos de apertura mensual (el reinicio de datos de la demo la borra). */
export const CLAVE_DOCUMENTOS_APERTURA = 'taller-siaf-rp:apertura-documentos';

/** Una fila del historial de la configuración de un periodo. */
export interface EntradaHistorial {
  item: number;
  fechaHora: string;
  tipoAccion: string;
  usuario: string;
  cierreContable: string;
  estado: 'Abierto' | 'Cerrado';
}

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

/** «2026 - 01» → «ENERO - 2026» (el detalle de solo lectura nombra el mes). */
export function nombrePeriodo(periodo: string): string {
  const [anio, mes] = periodo.split(' - ');
  const nombre = MESES[Number(mes) - 1];
  return nombre ? `${nombre} - ${anio}` : periodo;
}

/** Configuración grabada de un pliego, tal como la muestra el detalle de solo lectura (Figma node-id 2404:121770). */
export interface ConfiguracionPliego {
  periodo: string;
  tipoCierre: 'Operativo' | 'Contable';
  fechaInicio: string;
  fechaFin: string;
  fechaCierre: string;
  justificacion: string;
  /** `null` si nunca se adjuntó un documento. */
  archivo: { name: string; size: number } | null;
  historial: EntradaHistorial[];
}

/**
 * Configuración de ejemplo del detalle: el Figma muestra la del Ministerio de Salud (enero de 2026, con el cierre
 * operativo modificado) y los demás pliegos usan la misma. Con `periodo` (la UE abre el detalle de un periodo) toma
 * las fechas de ese periodo.
 */
export function generarConfiguracionDePliego(periodo?: SituacionPeriodoPliego): ConfiguracionPliego {
  return {
    periodo: periodo?.periodo ?? '2026 - 01',
    tipoCierre: 'Operativo',
    fechaInicio: periodo?.fechaInicio ?? '01/01/2026',
    fechaFin: periodo?.fechaFin ?? '31/01/2026',
    fechaCierre: periodo?.cierreOperativo ?? '18/02/2026',
    justificacion: 'Solicito la modificación de la Fecha cierre operativo',
    archivo: { name: 'DocEntregable001.pdf', size: 512_000 },
    historial: [
      { item: 2, fechaHora: '13/02/2026 10:24:27', tipoAccion: 'Modificación', usuario: RESPONSABLE, cierreContable: '06/02/2026', estado: 'Cerrado' },
      { item: 1, fechaHora: '13/02/2026 09:05:34', tipoAccion: 'Creación', usuario: 'SIAF - RP', cierreContable: '06/02/2026', estado: 'Cerrado' },
    ],
  };
}

/**
 * Qué cambia de la pantalla «Configuración de apertura contable mensual» según el ámbito del creador. El DGCP trabaja
 * con pliegos (Figma node-id 2404:122064 y 3142:170479); el Pliego, con sus unidades ejecutoras (node-id 3160:302848).
 */
export interface VistaAmbito {
  /** `tabs`: «Situación de apertura general» y la lista de entidades; `periodos`: una sola tabla con los periodos de la entidad. */
  modo: 'tabs' | 'periodos';
  /** Nombre de la segunda pestaña y del encabezado de su tabla. */
  entidadPlural: string;
  /** Sección y rótulos de las pantallas de edición y detalle («Pliego», «Unidad ejecutora»). */
  entidadSingular: string;
  /** Rótulo de la primera columna de las sub-tablas de la pestaña general («Pliego», «UE»). */
  columnaEntidad: string;
  etiquetaNombre: string;
  /** Entidades que se muestran dentro de cada periodo de la pestaña «Situación de apertura general». */
  entidadesGeneral: readonly string[];
  /** Entidades de la segunda pestaña (en mayúsculas, como en el Figma). */
  entidadesLista: readonly string[];
}

const VISTA_DGCP: VistaAmbito = {
  modo: 'tabs',
  entidadPlural: 'Pliegos',
  entidadSingular: 'Pliego',
  columnaEntidad: 'Pliego',
  etiquetaNombre: 'Nombre del pliego',
  entidadesGeneral: PLIEGOS,
  entidadesLista: PLIEGOS_SITUACION,
};

const UNIDADES_EJECUTORAS = ['Hospital Hermilio Valdizan', 'Hospital Maria Auxiliadora', 'Hospital Sergio Bernales'];

/** Unidades ejecutoras de la pestaña «Unidades ejecutoras» (Figma node-id 2429:89759). */
const LISTA_UNIDADES_EJECUTORAS = [
  'HOSPITAL HERMILIO VALDIZAN',
  'HOSPITAL SERGIO BERNALES',
  'HOSPITAL CAYETANO HEREDIA',
  'HOSPITAL DE APOYO DEPARTAMENTAL MARIA AUXILIADORA',
  'HOSPITAL NACIONAL ARZOBISPO LOAYZA',
  'HOSPITAL NACIONAL DOS DE MAYO',
  'HOSPITAL DE APOYO SANTA ROSA',
  'HOSPITAL DE EMERGENCIAS CASIMIRO ULLOA',
  'HOSPITAL DE EMERGENCIAS PEDIATRICAS',
];

const VISTA_PLIEGO: VistaAmbito = {
  modo: 'tabs',
  entidadPlural: 'Unidades ejecutoras',
  entidadSingular: 'Unidad ejecutora',
  columnaEntidad: 'UE',
  etiquetaNombre: 'Nombre de la unidad ejecutora',
  entidadesGeneral: UNIDADES_EJECUTORAS,
  entidadesLista: LISTA_UNIDADES_EJECUTORAS,
};

/** La unidad ejecutora ve solo sus periodos, sin pestañas (Figma node-id 2522:36943). */
const VISTA_UE: VistaAmbito = {
  modo: 'periodos',
  entidadPlural: 'Unidades ejecutoras',
  entidadSingular: 'Unidad ejecutora',
  columnaEntidad: 'UE',
  etiquetaNombre: 'Nombre de la unidad ejecutora',
  entidadesGeneral: ['Hospital Nacional Dos de Mayo'],
  entidadesLista: ['HOSPITAL NACIONAL DOS DE MAYO'],
};

export function vistaDeAmbito(ambito: 'DGCP' | 'PLIEGO' | 'UE' | null | undefined): VistaAmbito {
  if (ambito === 'PLIEGO') return VISTA_PLIEGO;
  return ambito === 'UE' ? VISTA_UE : VISTA_DGCP;
}
