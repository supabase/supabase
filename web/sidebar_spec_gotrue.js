module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting started',
      items: ['index', 'installing'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Client functions',
      items: ['signup', 'signin', 'signout', 'user', 'update', 'onauthstatechange'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'General functions',
      items: ['api-signupwithemail', 'api-signinwithemail', 'api-resetpasswordforemail', 'api-signout', 'api-getuser', 'api-updateuser', 'api-refreshaccesstoken'],
      collapsed: false,
    }
  ],
}