import { Injectable, inject } from '@angular/core';

import { CurrentUserService } from '../../../../core/auth/current-user.service';
import { ESTADO } from '../../../../core/models/documento.model';
import {
  CLAVE_DOCUMENTOS_APERTURA,
  CLAVE_DOCUMENTOS_CREADOS,
  DocumentoApertura,
} from '../models/apertura-contable-mensual.model';

/** Cómo va un documento de apertura contable mensual: su estado y quién lo resolvió. */
export interface SeguimientoDocumento {
  estado: string;
  /** Quien aprobó, observó o rechazó, con la fecha y hora (dd/mm/aaaa hh:mm:ss). */
  resueltoPor?: { usuario: string; fecha: string };
  comentario?: string;
}

type Ambito = DocumentoApertura['ambito'];

/** Qué ámbitos de creador ve cada ámbito de usuario: el Pliego ve también lo de sus unidades ejecutoras. */
const AMBITOS_VISIBLES: Record<Ambito, readonly Ambito[]> = {
  DGCP: ['DGCP'],
  PLIEGO: ['PLIEGO', 'UE'],
  UE: ['UE'],
};

const SISTEMA_DE_EJEMPLO_ARCHIVO = (n: string) => ({ name: `DocEntregable${n}.pdf`, size: 512_000 });

/** Documentos de ejemplo para probar aprobar, observar o rechazar (todos llegan verificados). */
const DOCUMENTOS_DE_EJEMPLO: readonly DocumentoApertura[] = [
  {
    numero: '0001',
    ambito: 'DGCP',
    fecha: '20/11/2023',
    fechaHora: '19/08/2025 08:00:59',
    entidad: '009 - Ministerio de Economía Finanzas',
    etiquetaEntidad: 'Pliego',
    nombreEntidad: 'MINISTERIO DE SALUD',
    creador: 'RICARDO JOHN DOE BUSTAMANTE',
    configuracion: {
      periodo: '2026 - 01',
      tipoCierre: 'Operativo',
      fechaInicio: '01/01/2026',
      fechaFin: '31/01/2026',
      fechaCierre: '18/02/2026',
      justificacion: 'Solicito la modificación de la fecha cierre operativo',
      archivo: SISTEMA_DE_EJEMPLO_ARCHIVO('001'),
    },
  },
  {
    numero: '0002',
    ambito: 'DGCP',
    fecha: '05/03/2026',
    fechaHora: '05/03/2026 09:15:20',
    entidad: '009 - Ministerio de Economía Finanzas',
    etiquetaEntidad: 'Pliego',
    nombreEntidad: 'MINISTERIO DE DEFENSA',
    creador: 'ANA TORRES DÍAZ',
    configuracion: {
      periodo: '2026 - 02',
      tipoCierre: 'Contable',
      fechaInicio: '01/02/2026',
      fechaFin: '28/02/2026',
      fechaCierre: '18/03/2026',
      justificacion: 'Solicito la modificación de la fecha de cierre contable',
      archivo: SISTEMA_DE_EJEMPLO_ARCHIVO('002'),
    },
  },
  {
    numero: '0003',
    ambito: 'DGCP',
    fecha: '08/04/2026',
    fechaHora: '08/04/2026 11:40:05',
    entidad: '009 - Ministerio de Economía Finanzas',
    etiquetaEntidad: 'Pliego',
    nombreEntidad: 'MINISTERIO DE EDUCACION',
    creador: 'ANA TORRES DÍAZ',
    configuracion: {
      periodo: '2026 - 03',
      tipoCierre: 'Operativo',
      fechaInicio: '01/03/2026',
      fechaFin: '31/03/2026',
      fechaCierre: '15/04/2026',
      justificacion: 'Solicito ampliar el plazo del cierre operativo de marzo',
      archivo: SISTEMA_DE_EJEMPLO_ARCHIVO('003'),
    },
  },
  {
    numero: '0004',
    ambito: 'PLIEGO',
    fecha: '12/02/2026',
    fechaHora: '12/02/2026 10:05:41',
    entidad: '011 - Ministerio de Salud',
    etiquetaEntidad: 'Unidad ejecutora',
    nombreEntidad: 'HOSPITAL HERMILIO VALDIZAN',
    creador: 'MARCO QUISPE HUAMÁN',
    configuracion: {
      periodo: '2026 - 01',
      tipoCierre: 'Operativo',
      fechaInicio: '01/01/2026',
      fechaFin: '31/01/2026',
      fechaCierre: '20/02/2026',
      justificacion: 'Solicito la modificación del cierre operativo de enero',
      archivo: SISTEMA_DE_EJEMPLO_ARCHIVO('004'),
    },
  },
  {
    numero: '0005',
    ambito: 'PLIEGO',
    fecha: '10/03/2026',
    fechaHora: '10/03/2026 15:22:10',
    entidad: '011 - Ministerio de Salud',
    etiquetaEntidad: 'Unidad ejecutora',
    nombreEntidad: 'HOSPITAL SERGIO BERNALES',
    creador: 'MARCO QUISPE HUAMÁN',
    configuracion: {
      periodo: '2026 - 02',
      tipoCierre: 'Contable',
      fechaInicio: '01/02/2026',
      fechaFin: '28/02/2026',
      fechaCierre: '25/03/2026',
      justificacion: 'Solicito la modificación de la fecha de cierre contable',
      archivo: SISTEMA_DE_EJEMPLO_ARCHIVO('005'),
    },
  },
];

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Documentos «Configuración mensual» de «Documentos y registros» y su estado. En el taller no hay backend para ellos:
 * hay documentos de ejemplo, cada edición que graba un creador agrega uno nuevo (llega verificado) y lo que el
 * aprobador resuelve queda en el `localStorage`. Cada usuario ve los de su ámbito.
 */
@Injectable({ providedIn: 'root' })
export class DocumentoAperturaService {
  private readonly usuario = inject(CurrentUserService);

  /** Documentos que ve el usuario con sesión, el más nuevo primero. */
  listar(): DocumentoApertura[] {
    const visibles = AMBITOS_VISIBLES[this.usuario.user().nivelAmbito ?? 'DGCP'];
    return this.todos()
      .filter((d) => visibles.includes(d.ambito))
      .sort((a, b) => b.numero.localeCompare(a.numero));
  }

  obtenerDocumento(numero: string): DocumentoApertura | undefined {
    return this.todos().find((d) => d.numero === numero);
  }

  /** Agrega el documento que genera una edición grabada; llega verificado, listo para el aprobador. */
  crear(datos: Omit<DocumentoApertura, 'numero' | 'fecha' | 'fechaHora'>): DocumentoApertura {
    const ahora = new Date();
    const fecha = `${pad(ahora.getDate())}/${pad(ahora.getMonth() + 1)}/${ahora.getFullYear()}`;
    const siguiente = Math.max(0, ...this.todos().map((d) => Number(d.numero))) + 1;
    const documento: DocumentoApertura = {
      ...datos,
      numero: String(siguiente).padStart(4, '0'),
      fecha,
      fechaHora: `${fecha} ${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`,
    };

    try {
      localStorage.setItem(CLAVE_DOCUMENTOS_CREADOS, JSON.stringify([...this.creados(), documento]));
    } catch {
      // Sin almacenamiento: el documento no llega a la lista.
    }
    return documento;
  }

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

  private todos(): DocumentoApertura[] {
    return [...DOCUMENTOS_DE_EJEMPLO, ...this.creados()];
  }

  private creados(): DocumentoApertura[] {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_DOCUMENTOS_CREADOS) ?? '[]') as DocumentoApertura[];
    } catch {
      return [];
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
