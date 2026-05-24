export type UserRole = string;

export type AuthUser = {
  id: number | string;
  email: string;
  name: string;
  role: UserRole;
  clientId: number | string | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
};
