import { AgendaResponse } from '@/types/agenda';

export const DEFAULT_AGENDA_DATA: AgendaResponse = {
  sala: {
    nombre: 'Sala SOCADO',
    email: 'sala.socado@kaizenholdings.net',
    timezone: 'America/Caracas',
  },
  fecha: '2026-10-08',
  total: 3,
  eventos: [
    {
      id: null,
      titulo: 'Disponible',
      organizador: null,
      correo_organizador: null,
      fecha: '08/10/2026',
      desde: '08:00 AM',
      hasta: '05:00 PM',
      zona_horaria: 'America/Caracas',
    },
    {
      id: 'AAMkADNmOGZmNDA0LWU0MDgtNDlkZC1iNGU1LTNhYTEyZmMzNzE0NgFRAAgI3yTPGKIAAEYAAAAA4EKLYG9sIE6H5SKjs7EBoAcAABfPHW-GjUend6-vbrrsBQAAAAABDQAAABfPHW-GjUend6-vbrrsBQABpSoeRQAAEA==',
      titulo: 'Yotziel Melean ',
      organizador: 'Yotziel Melean',
      correo_organizador: 'ymelean@kaizenholdings.net',
      fecha: '08/10/2026',
      desde: '10:00 AM',
      hasta: '11:30 AM',
      zona_horaria: 'America/Caracas',
    },
    {
      id: null,
      titulo: 'Disponible',
      organizador: null,
      correo_organizador: null,
      fecha: '08/10/2026',
      desde: '11:30 AM',
      hasta: '05:00 PM',
      zona_horaria: 'America/Caracas',
    },
  ],
};

export const DEFAULT_SALAS = [
  {
    nombre: 'Sala SOCADO',
    email: 'sala.socado@kaizenholdings.net',
  },
  {
    nombre: 'Sala Principal',
    email: 'sala.principal@kaizenholdings.net',
  },
  {
    nombre: 'Sala Innovación',
    email: 'sala.innovacion@kaizenholdings.net',
  },
];

