import type { Member } from "./users";
import type { Activity } from "./activities";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  course: string;
  categories: string[];
  members: Member[];
  tasks: Activity[];
}
