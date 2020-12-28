import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class RoleService{
    constructor(
        private http:HttpClient
    ){}

    getRoleList():Observable<string[]>{
        return this.http.get<string[]>('/user/rolelist');
    }
}
