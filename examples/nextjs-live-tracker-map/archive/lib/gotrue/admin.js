export default class Admin {
  constructor(user) {
    this.user = user;
  }

  // Return a list of all users in an audience
  listUsers(aud) {
    return this.user._request('/admin/users', {
      method: 'GET',
      audience: aud,
    });
  }

  getUser(user) {
    return this.user._request(`/admin/users/${user.id}`);
  }

  updateUser(user, attributes = {}) {
    return this.user._request(`/admin/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(attributes),
    });
  }

  createUser(email, password, attributes = {}) {
    attributes.email = email;
    attributes.password = password;
    return this.user._request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(attributes),
    });
  }

  deleteUser(user) {
    return this.user._request(`/admin/users/${user.id}`, {
      method: 'DELETE',
    });
  }
}