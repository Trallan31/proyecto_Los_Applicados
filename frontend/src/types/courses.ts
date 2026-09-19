export interface Course {
  id: string | number;
  userId: number;
  name: string;
  code: string;       // Código del ramo (ej: "IIC2143", "MAT1630")
  shortName: string;  // Siglas/Abreviatura (ej: "CAL")
  color: string;
}

export type SessionType = "Cátedra" | "Auxiliar" | "Laboratorio";

export interface CourseSession {
  id: string | number;
  courseId: string | number;
  dayOfWeek: number; // 0 = Lunes, 1 = Martes, 2 = Miércoles, 3 = Jueves, 4 = Viernes, 5 = Sábado
  startHour: number; // Hora inicio (ej: 8 para 8:00 AM)
  duration: number;  // Duración en horas (ej: 2)
  type: SessionType;

}
