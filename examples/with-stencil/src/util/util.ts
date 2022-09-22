const appMsg = (key: string): string => {
  const msg = {
    'server': 'An internal error occurred, please try again.',
    'server-ref': 'Internal error, Please try to refresh your page.',
    'not-found': 'The resource you are looking for not found.',
    'logout': 'You are logout out successfully.',
  };
  return msg[key] ? msg[key] : '';
};
const checkEmpty = (value: any): boolean => {
  return value;
};
const getFormValidations = (key, values = {}) => {
  const validations = {
    login: {
      email: {
        value: values['email'] ? values['email'] : null,
        validate: checkEmpty,
        isValid: values['email'] ? true : false,
      },
      password: {
        value: values['password'] ? values['password'] : null,
        validate: checkEmpty,
        isValid: values['password'] ? true : false,
      },
    },
    register: {
      email: {
        value: values['email'] ? values['email'] : null,
        validate: checkEmpty,
        isValid: values['email'] ? true : false,
      },
      password: {
        value: values['password'] ? values['password'] : null,
        validate: checkEmpty,
        isValid: values['password'] ? true : false,
      },
    },
  };
  return validations[key] ? validations[key] : {};
};

export { appMsg, getFormValidations };
