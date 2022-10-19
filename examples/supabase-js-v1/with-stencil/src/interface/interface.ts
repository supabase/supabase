interface ICM {
  [key: string]: any;
}
interface IBaseRes {
  status: number;
  data: any;
  message: string;
  errors?: ICM;
}
interface IUserBase {
  email: string;
  password: string;
}
interface IUserRegister extends IUserBase {
  name?: string;
}
interface IUserLogin extends IUserBase {
  stayLoggedIn?: boolean;
}
interface IErrorRes {
  code: string;
  message: any;
}
export { IBaseRes, IUserRegister, IUserLogin, IErrorRes };
