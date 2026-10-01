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
export function generarRegistrosAperturaContableMensual(): AperturaContableMensualRegistro[] {
  const registros: AperturaContableMensualRegistro[] = [];

  for (let mes = 1; mes <= 12; mes++) {
    const mesCierre = mes === 12 ? 1 : mes + 1;

    for (const pliego of PLIEGOS) {
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
