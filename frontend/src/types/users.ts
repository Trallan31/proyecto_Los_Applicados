export interface User {
  id: number;
  username: string;
  name: string;
  lastName: string;
  mail: string;
  initials: string;
  avatarColor: string;
}

export interface Member extends User {
  role: "Admin" | "Miembro";
}
