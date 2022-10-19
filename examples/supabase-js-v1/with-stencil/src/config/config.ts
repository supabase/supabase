const supabaseConfig = {
  supabaseUrl: '',
  supabaseKey: '',
};

const httpCode = {
  success: 200,
  notFound: 404,
  serverError: 504,
};

const appName: string = 'Stencil & Supabase';

const appConfig = {
  name: appName,
  pageTitlePrefix: appName,
  pageTitle: {
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    password: 'Update Password',
  },
  loadingBtnTxt: 'Loading...',
};

export { supabaseConfig, httpCode, appConfig };
