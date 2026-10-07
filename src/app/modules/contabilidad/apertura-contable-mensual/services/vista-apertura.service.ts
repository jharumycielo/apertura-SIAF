import { Injectable, computed, inject } from '@angular/core';

import { CurrentUserService } from '../../../../core/auth/current-user.service';
import { VistaAmbito, vistaDeAmbito } from '../models/apertura-contable-mensual.model';

/** La vista de la apertura contable mensual que corresponde al ámbito del usuario con sesión. */
@Injectable({ providedIn: 'root' })
export class VistaAperturaService {
  private readonly usuario = inject(CurrentUserService);

  readonly vista = computed<VistaAmbito>(() => vistaDeAmbito(this.usuario.user().nivelAmbito));
}
