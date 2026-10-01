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
];
