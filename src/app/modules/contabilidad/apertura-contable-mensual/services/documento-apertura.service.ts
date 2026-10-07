import { Injectable } from '@angular/core';

import { ESTADO } from '../../../../core/models/documento.model';
import { CLAVE_DOCUMENTOS_APERTURA } from '../models/apertura-contable-mensual.model';

/** Cómo va un documento de apertura contable mensual: su estado y quién lo resolvió. */
export interface SeguimientoDocumento {
  estado: string;
  /** Quien aprobó, observó o rechazó, con la fecha y hora (dd/mm/aaaa hh:mm:ss). */
  resueltoPor?: { usuario: string; fecha: string };
  comentario?: string;
}

/**
 * Estado de los documentos de «Documentos y registros» de la apertura contable mensual. En el taller no hay backend
 * para ellos: lo que el aprobador resuelve queda en el `localStorage` y la lista y la pantalla de aprobación lo leen.
 */
@Injectable({ providedIn: 'root' })
export class DocumentoAperturaService {
  obtener(numero: string): SeguimientoDocumento {
    return this.leer()[numero] ?? { estado: ESTADO.VERIFICADO };
  }

  guardar(numero: string, seguimiento: SeguimientoDocumento): void {
    try {
      localStorage.setItem(CLAVE_DOCUMENTOS_APERTURA, JSON.stringify({ ...this.leer(), [numero]: seguimiento }));
    } catch {
      // Sin almacenamiento: el documento vuelve a verse verificado.
    }
  }

  private leer(): Record<string, SeguimientoDocumento> {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_DOCUMENTOS_APERTURA) ?? '{}') as Record<string, SeguimientoDocumento>;
    } catch {
      return {};
    }
  }
}
