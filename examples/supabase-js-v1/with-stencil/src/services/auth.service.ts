/**
 * This class act as service to handle supabase operations related to user authentications.
 * Login/Register/Change Password/Logout
 *
 * @class SupabaseAuthService
 *
 */

import SupabaseService from './supabase.service';
import { supabaseConfig, httpCode } from '../config/config';
import { AppState, setStateProp } from '../store/app.store';
import { IBaseRes, IUserRegister, IUserLogin } from '../interface/interface';
import { appMsg } from '../util/util';

class SupabaseAuthService {
  supabase: any;

  /**
   * @constructor
   */
  constructor() {
    const connection = new SupabaseService(supabaseConfig.supabaseUrl, supabaseConfig.supabaseKey);
    this.supabase = connection.supabase;
    this.init();
  }

  /**
   * Initialize supabase instance
   * If user is already login set user state
   * @name init
   *
   * @returns {void}
   */
  private init(): void {
    setStateProp('appInit', true);

    try {
      this.supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          AppState.user = session.user;
          AppState.isAuthenticated = true;
        } else {
          AppState.user = undefined;
          AppState.isAuthenticated = false;
        }
      });

      AppState.appInit = false;
    } catch (error) {
      const errorRes = this.buildErrorRes(httpCode.serverError, error);
      AppState.appInit = false;
      AppState.appInitError = errorRes.message ? errorRes.message : appMsg('server-ref');
    }
  }

  /**
   * Build success response
   * @name buildRes
   *
   * @param   {number} status  status code
   * @param   {any} data       response data
   * @param   {string} message message to show
   * @param   {any} errors     errors object if any
   *
   * @returns {IBaseRes}
   */
  private buildRes(status: number, data?: any, message?: string, errors?: any): IBaseRes {
    return {
      status,
      data,
      errors,
      message,
    };
  }

  /**
   * Build error response
   * @name buildErrorRes
   *
   * @param   {number} status  status code
   * @param   {any} errors     errors object if any
   *
   * @returns {IBaseRes}
   */
  private buildErrorRes(status: number, errors?: any): IBaseRes {
    return {
      status: status,
      data: null,
      errors: {},
      message: errors.error_description ? errors.error_description : errors,
    };
  }

  /**
   * Handle supabase login
   * @name login
   *
   * @param {IUserLogin} userData
   *
   * @returns {IBaseRes} Promise that represents <IBaseRes> object
   */
  async login({ email, password }: IUserLogin): Promise<IBaseRes> {
    let _error = null;
    try {
      const { error, data } = await this.supabase.auth.signIn({ email, password });

      if (error) {
        _error = error.message;
        return this.buildErrorRes(httpCode.serverError, error.message);
      }

      return this.buildRes(httpCode.success, data);
    } catch (er) {
      alert('x');
      return this.buildErrorRes(httpCode.serverError, _error);
    }
  }

  /**
   * Handle supabase registration
   * @name register
   *
   * @param {IUserRegister} userData
   *
   *
   */
  //  @returns {IBaseRes} Promise that represents <IBaseRes> object
  async register(userData: IUserRegister) /* Promise<IBaseRes> */ {
    try {
      const { error, data } = await this.supabase.auth.signUp({ email: userData.email, password: userData.password });
      if (error) {
        return this.buildErrorRes(httpCode.serverError, error.message);
      }

      return this.buildRes(httpCode.success, data);
    } catch (error) {
      return this.buildErrorRes(httpCode.serverError, error);
    }
  }

  /**
   * Handle supabase logout
   * @name logOut
   *
   * @returns {IBaseRes} Promise that represents <IBaseRes> object
   */
  async logOut(): Promise<IBaseRes> {
    try {
      if (AppState.isAuthenticated) {
        AppState.isAuthenticated = false;
        AppState.user = undefined;
        try {
          await this.supabase.auth.signOut();
        } catch (error) {
          return this.buildErrorRes(httpCode.serverError, error);
        }
      }
      return this.buildRes(httpCode.success, {}, appMsg('logout'));
    } catch (error) {
      return this.buildErrorRes(httpCode.serverError, error);
    }
  }

  /**
   * Handle supabase update user profile
   * @name updateProfile
   *
   * @param {string} email
   *
   * @returns {IBaseRes} Promise that represents <IBaseRes> object
   */
  async updateProfile(email: string): Promise<IBaseRes> {
    try {
      AppState.user = {
        ...AppState.user,
        email,
      };
      AppState.isAuthenticated = true;

      return this.buildRes(httpCode.success, {}, appMsg('update-profile'));
    } catch (error) {
      return this.buildErrorRes(httpCode.serverError, error);
    }
  }
}

export const AuthService = new SupabaseAuthService();
