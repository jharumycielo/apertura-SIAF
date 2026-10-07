import { Injectable, inject } from '@angular/core';

import { CurrentUserService } from '../../../../core/auth/current-user.service';
import { TokenService } from '../../../../core/auth/token.service';
import { buscarUsuarioPorPerfil } from '../../../../mock/usuarios-demo';
import {
  CLAVE_CONFIGURACIONES_APERTURA,
  ConfiguracionPliego,
  EntradaHistorial,
  SituacionPeriodoPliego,
  generarConfiguracionDePliego,
} from '../models/apertura-contable-mensual.model';

/** Lo que el usuario grabó al editar la apertura contable mensual de un pliego. */
export interface EdicionPliego {
  periodo: SituacionPeriodoPliego;
  tipoCierre: ConfiguracionPliego['tipoCierre'];
  fechaInicio: string;
  fechaFin: string;
  fechaCierre: string;
  justificacion: string;
  archivo: { name: string; size: number } | null;
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** dd/mm/aaaa hh:mm:ss, el formato del historial. */
function fechaHoraActual(): string {
  const f = new Date();
  return `${pad(f.getDate())}/${pad(f.getMonth() + 1)}/${f.getFullYear()} ${pad(f.getHours())}:${pad(f.getMinutes())}:${pad(f.getSeconds())}`;
}

type Ambito = 'DGCP' | 'PLIEGO' | 'UE';
type ConfiguracionesPorAmbito = Partial<Record<Ambito, Record<string, ConfiguracionPliego>>>;

/**
 * Configuración de la apertura contable mensual de cada pliego. En el taller no hay backend para esta pantalla: lo que
 * se graba al editar queda en el `localStorage` y el detalle de solo lectura lo muestra. Cada ámbito (DGCP, Pliego y
 * UE) tiene sus propias ediciones: lo que graba un creador no lo ve el de otro ámbito. Un pliego que nunca se editó
 * muestra la configuración de ejemplo del Figma.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracionPliegoService {
  private readonly token = inject(TokenService);
  private readonly usuario = inject(CurrentUserService);

  /** `clave` es el pliego o, para la UE, `unidad|periodo`; `periodo` da las fechas del ejemplo si nunca se editó. */
  obtener(clave: string, periodo?: SituacionPeriodoPliego): ConfiguracionPliego {
    return this.leer()[this.ambito()]?.[clave] ?? generarConfiguracionDePliego(periodo);
  }

  /** Guarda la edición y agrega «Modificación» al historial del pliego. */
  guardar(clave: string, edicion: EdicionPliego): void {
    const previa = this.obtener(clave, edicion.periodo);
    const entrada: EntradaHistorial = {
      item: Math.max(0, ...previa.historial.map((e) => e.item)) + 1,
      fechaHora: fechaHoraActual(),
      tipoAccion: 'Modificación',
      usuario: this.usuarioActual(),
      cierreContable: edicion.periodo.cierreContable,
      estado: edicion.periodo.estadoOperativo as EntradaHistorial['estado'],
    };

    const nueva: ConfiguracionPliego = {
      periodo: edicion.periodo.periodo,
      tipoCierre: edicion.tipoCierre,
      fechaInicio: edicion.fechaInicio,
      fechaFin: edicion.fechaFin,
      fechaCierre: edicion.fechaCierre,
      justificacion: edicion.justificacion,
      archivo: edicion.archivo ?? previa.archivo,
      historial: [entrada, ...previa.historial],
    };

    try {
      const todas = this.leer();
      const ambito = this.ambito();
      localStorage.setItem(CLAVE_CONFIGURACIONES_APERTURA, JSON.stringify({ ...todas, [ambito]: { ...todas[ambito], [clave]: nueva } }));
    } catch {
      // Sin almacenamiento: el detalle vuelve a mostrar el ejemplo.
    }
  }

  private ambito(): Ambito {
    return this.usuario.user().nivelAmbito ?? 'DGCP';
  }

  private leer(): ConfiguracionesPorAmbito {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_CONFIGURACIONES_APERTURA) ?? '{}') as ConfiguracionesPorAmbito;
    } catch {
      return {};
    }
  }

  /** Nombre en mayúsculas del usuario con sesión (solo existen los usuarios de demostración). */
  usuarioActual(): string {
    const perfilId = this.token.getJwtPayload()?.perfilId;
    const usuario = perfilId ? buscarUsuarioPorPerfil(perfilId)?.usuario : null;
    return usuario ? `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`.toUpperCase() : 'USUARIO';
  }
}
