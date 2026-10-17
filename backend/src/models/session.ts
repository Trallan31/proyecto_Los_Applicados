
import { model, Schema, Types } from "mongoose";
import { schemaOptions } from "./shared";

interface ISession {
  courseId: Types.ObjectId;
  dayOfWeek: number;
  startHour: number;
  duration: number;
  type: "Cátedra" | "Auxiliar" | "Laboratorio";
}

const sessionSchema = new Schema<ISession>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      validate: {
        validator: Number.isInteger,
        message: "dayOfWeek debe ser un entero entre 0 y 6.",
      },
    },
    startHour: {
      type: Number,
      required: true,
      min: 0,
      max: 23.99,
    },
    duration: {
      type: Number,
      required: true,
      min: 0.25,
      max: 24,
    },
    type: {
      type: String,
      required: true,
      enum: ["Cátedra", "Auxiliar", "Laboratorio"],
    },
  },
  schemaOptions
);

sessionSchema.pre("validate", function () {
  if (
    this.startHour !== undefined &&
    this.duration !== undefined &&
    this.startHour + this.duration > 24
  ) {
    this.invalidate(
      "duration",
      "La sesión no puede terminar después de las 24:00."
    );
  }
});

export default model<ISession>("Session", sessionSchema);
