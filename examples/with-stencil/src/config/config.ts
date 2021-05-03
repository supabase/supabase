
const supabaseConfig = {
  supabaseUrl: 'https://akakxshwrukpetyzjnyi.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMDk3ODA4OSwiZXhwIjoxOTI2NTU0MDg5fQ.xQTiGKgZ0p7Ch1paDP2KCExiVhFeqZicLm4s36XFUIk'
};

const httpCode = {
  success: 200,
  notFound: 404,
  serverError: 504
};

const appName: string = 'Stencil & Supabase';

const appConfig = {
  name: appName,
  pageTitlePrefix: appName,
  pageTitle: {
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    password: 'Update Password'
  },
  loadingBtnTxt: 'Loading...'
};

export {
  supabaseConfig,
  httpCode,
  appConfig
}
