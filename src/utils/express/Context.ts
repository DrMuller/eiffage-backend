export default class Context {
  constructor(readonly user: UserContext) { }
}

export interface UserContext {
  _id: string;
  email: string;
  roles: string[];
  organisationId?: string;
}
