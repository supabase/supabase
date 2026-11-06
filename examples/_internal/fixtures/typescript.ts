type Status = 'active' | 'inactive'

interface User {
  id: number
  name: string
  email?: string
  status?: Status
}

const users: Array<User> = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane' },
]

function getUserById(id: number): User | undefined {
  return users.find((user) => user.id === id)
}

function createUser(name: string, email: string): User {
  const newId = Math.max(...users.map((u) => u.id)) + 1
  const newUser: User = { id: newId, name }
  if (email) {
    newUser.email = email
  }
  users.push(newUser)
  return newUser
}

class UserManager {
  users: Array<User> = []

  constructor(initialUsers = []) {
    this.users = initialUsers
  }

  addUser(user: User) {
    this.users.push(user)
  }

  getUsers() {
    return [...this.users]
  }
}
