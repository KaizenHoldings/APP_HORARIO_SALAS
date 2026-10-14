export interface SalaInfo {
  nombre: string;
  email: string;
  timezone: string;
}

export interface EventoSala {
  id: string | null;
  titulo: string;
  organizador: string | null;
  correo_organizador: string | null;
  fecha: string;
  desde: string;
  hasta: string;
  zona_horaria: string;
}

export interface AgendaResponse {
  sala: SalaInfo;
  fecha: string;
  total: number;
  eventos: EventoSala[];
}

