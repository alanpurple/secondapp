import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {RoleService} from './role.service';
import {ErrorAlert} from './error.alert';
import {UserCreationData, UserData} from './userData';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  templateUrl: './user.dialog.html'
})
export class UserDialog implements OnInit {
  constructor(
    private roleService:RoleService,
    private errorAlert:ErrorAlert,
    public dialogRef:MatDialogRef<UserDialog>,
    @Inject(MAT_DIALOG_DATA) public _user:UserCreationData,
    @Inject(MAT_DIALOG_DATA) public isNew:boolean,
    //@Inject(MAT_DIALOG_DATA) public name:FormControl,
    @Inject(MAT_DIALOG_DATA) public email:FormControl,
    @Inject(MAT_DIALOG_DATA) public roles:string[]
  ){
    //this.name=new FormControl('', [Validators.required, Validators.pattern(this.name_re)]);
    this.email = new FormControl('', [Validators.required, Validators.email]);
  }

  selectedRole:string;

  ngOnInit() {
    this.roleService.getRoleList().subscribe(
      roles => {
        if (!roles)
          this.errorAlert.open('role list missing, ask your service provider');
        else {
          this.roles = roles;
          this.selectedRole = roles[0];
        }
      },
      err => this.errorAlert.open(err)
    );
  }

  @Input()
  set user(data:UserCreationData){
    if(data){
      this.isNew=false;
      this._user=data;
    }
  }

  //name_re = /^[a-z0-9]+(\-[a-z0-9]?[a-z0-9]*/;
  getEmailErrorMsg() {
    if (this.email.hasError('required')) {
      return 'You must enter a value';
    }
    else
      return this.email.hasError('email') ? 'Not a valid email' : '';
  }

  /* getNameErrorMsg() {
    if (this.name.hasError('required')) {
      return 'You must enter a value';
    }
    else
      return this.name.hasError('pattern') ?
        'Not a valid name(only use lower case alphabet and numeric)' : '';
  } */
}
