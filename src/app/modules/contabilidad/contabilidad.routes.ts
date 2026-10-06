import { Routes } from '@angular/router';

/** Proceso «Gestión contabilidad»: por ahora solo Configuración de apertura contable mensual. */
export const CONTABILIDAD_ROUTES: Routes = [
  {
    path: 'procesos/apertura-contable-mensual/configuracion',
    loadComponent: () =>
      import('./apertura-contable-mensual/pages/configuracion/apertura-contable-mensual-configuracion.component').then(
        (m) => m.AperturaContableMensualConfiguracionComponent,
      ),
  },
  {
    path: 'procesos/apertura-contable-mensual/configuracion/detalle/:pliegoId',
    loadComponent: () =>
      import('./apertura-contable-mensual/pages/detalle/apertura-contable-mensual-detalle.component').then(
        (m) => m.AperturaContableMensualDetalleComponent,
      ),
  },
  {
    path: 'procesos/apertura-contable-mensual/configuracion/editar/:pliegoId',
    loadComponent: () =>
      import('./apertura-contable-mensual/pages/editar/apertura-contable-mensual-editar.component').then(
        (m) => m.AperturaContableMensualEditarComponent,
      ),
  },
];
