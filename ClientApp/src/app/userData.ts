export class UserData {
  id: string;
  name: string;
  domain_id: string;
  email: string;
  description:string;
  primary_namespace_id: string;
  primary_namespace_name: string;
  default_project_roles: string[];
  projects?:project[];
}

class project {
  id:string;
  name:string;
  roleId:string;
}

export class UserData2 {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  primary_namespace_id: string;
  description?: string;
  role_ids:string[];
}

export class UserCreationData {
  name: string;
  email: string;
  enabled: boolean;
  password: string;
  primary_namespace_id: string;
  description?:string;
  role_ids: string[];
}
