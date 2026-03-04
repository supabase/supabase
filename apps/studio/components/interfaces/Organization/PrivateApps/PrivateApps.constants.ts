export interface Permission {
  id: string
  label: string
  description: string
  group: 'organization' | 'project'
}

export const MOCK_PERMISSIONS: Permission[] = [
  // Organization permissions
  {
    id: 'org.read',
    label: 'org.read',
    description: 'View organization details',
    group: 'organization',
  },
  {
    id: 'org.members.read',
    label: 'org.members.read',
    description: 'View organization members',
    group: 'organization',
  },
  {
    id: 'org.members.write',
    label: 'org.members.write',
    description: 'Manage organization members',
    group: 'organization',
  },
  {
    id: 'org.billing.read',
    label: 'org.billing.read',
    description: 'View billing information',
    group: 'organization',
  },
  // Project permissions
  {
    id: 'project.read',
    label: 'project.read',
    description: 'View project details',
    group: 'project',
  },
  {
    id: 'project.write',
    label: 'project.write',
    description: 'Manage project settings',
    group: 'project',
  },
  {
    id: 'database.read',
    label: 'database.read',
    description: 'Read database data',
    group: 'project',
  },
  {
    id: 'database.write',
    label: 'database.write',
    description: 'Write database data',
    group: 'project',
  },
  {
    id: 'auth.read',
    label: 'auth.read',
    description: 'View auth configuration',
    group: 'project',
  },
  {
    id: 'auth.write',
    label: 'auth.write',
    description: 'Manage auth settings',
    group: 'project',
  },
  {
    id: 'storage.read',
    label: 'storage.read',
    description: 'Read storage objects',
    group: 'project',
  },
  {
    id: 'storage.write',
    label: 'storage.write',
    description: 'Write storage objects',
    group: 'project',
  },
]

export const MOCK_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAy8Dbv8prpJ/0kKhlGeJYozo2t60EG8L0561g13R29LvMR5hy
vGZlGJpmn65+A4xHXInJYiPuKzrKUnApeLZ+vw1HocOAZtWK0z3r26uA8kQYOKX9
QQlcPuZFw7nMhOt9NpFpPAP2cHnwC8tqzK6iMYa2MhRy0vUNF8x6jKRXzRJkYqGX
bAm+aeZd8GFnYGblRv0ZeYhV8xoITaS6MkSxrIaAPKlqJFJtCxCEhGpnqkZpUkBj
b0gHK8pQzZ7GzQQ4r7v3Vk0NG9i8H1Q+rOuq2jMDiY9xHEZxHr/xoVN2pBZ1rGp5
K1nxZnBR2yN9P1Zu0f6V4jWK7rF7Z8Q2kMWLWQIDAQABAoIBAC5RgZ+hBx7xHNaM
pPgwGptyVGJBPBgzKpJLUXlchGCFHRMDekrpWo0kFCqkPZqgc9DcnAVKf3MJ5iMy
b3m4K+Q5DKFE2Rl4Aqy5QkWwjU2V3PtMfpuiHvW4hXp+9SEDqJ4sFexaKqMBN2R
5kOCm8n0J9YlJ4Gy+dV3KXjCPpB8Q/Vh9G0gvJDgDFT8RqyPhMbEW3M/ckTzB+Zk
HRlbMNxf2PQRCP+EQPE0sZXS2D3VN/rCmq0B7h7i8K4Y5n7+8rN9dEQpvO5dMnkq
T2CQVR/APzCFrH0l6LkFpYW7DuMkVqFR9s/1R9I0GpIXfAMElCFbNSxXVaGe8oYp
+cUJKAECgYEA7jk3PtnhFH+c0mMK7HEGXw1n1xFcDY5M7V3MV7oFSp5nxc/l9nGn
B7yQK9GVFxJL5Uy8Fzr9W0X6z+PvTNDp3F0dIBMpP9tYZHQBvOa9L4VJpGa1aAkM
5LbsY0kK3ABMQ5b+MKbw9T1sKSb5CuPGCVFM6H8O0X1aFd/nLgkCgYEA2fBhS4+G
8dCOaXpJ1hI8MH8Q7vMn/SJuZoAu5XMHqy3lJdPvv8G4OuiIB/fNkqF2l7Y0yFME
5LZAB1eFlf/7OcfiFjp1V9mQ1VODHulDq9rB3fHM2b9mGKq+hHXqCBg8B6dZL9s7
5U6kZ2S6PtP8JxfUqHcLGFWFXMr9v9M5hgECgYEAjvCNrFQj3WJHEX4r0k4lajkF
4VqxH8iGqBJf7CkECqd+R8mFqRsBP/GQJT0sxIMn7JEK9MJ0c3H2nR6hIp/TYMGM
sEVPrP5cqmS2Ue/VjLYq3+sUVSJjCaA5R6cSqe0d7TPUqj7dBvh0rG28/Y9M3Lvs
0Jys9TbqNfRN1lkCgYBfkEMjRlzGZ3rQ8JYG+3VOVL5u2Qm5ygJ0O5QKqA+5g9aA
m7MUiJpWL2X/nVCi7V0JFjJqN7gN7oiH9tQDlgQ3lXhsZ6L5iXvHi1LXXq3cFLUZ
TG0moBvH4+LOXbsZ5kFkWUe8OJqaQZxP2BjRB1mE5HRY7qOFdK0K7m7BAQKBgQCQ
3KpM8GFRI6mjxvyCChFv+fq1P5AqF1r7Y/rrOV7BxBZ3p3wWG7RqYF7IbZFdYa/n
VYvN6UgL1KJbJ7kh6dEWCGJLMEDpx5zHg5gEV9V3fxMl8T3p+HVQR9iJuL2mGnhb
Rx4z7Q8mXZ98vqP7N8DPRM2a8T/iFUjJBRrM3Q==
-----END RSA PRIVATE KEY-----`

export const MOCK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy8Dbv8prpJ/0kKhlGeJY
ozo2t60EG8L0561g13R29LvMR5hyvGZlGJpmn65+A4xHXInJYiPuKzrKUnApeLZ+
vw1HocOAZtWK0z3r26uA8kQYOKX9QQlcPuZFw7nMhOt9NpFpPAP2cHnwC8tqzK6i
MYa2MhRy0vUNF8x6jKRXzRJkYqGXbAm+aeZd8GFnYGblRv0ZeYhV8xoITaS6MkSx
rIaAPKlqJFJtCxCEhGpnqkZpUkBjb0gHK8pQzZ7GzQQ4r7v3Vk0NG9i8H1Q+rOuq
2jMDiY9xHEZxHr/xoVN2pBZ1rGp5K1nxZnBR2yN9P1Zu0f6V4jWK7rF7Z8Q2kMWL
WQIDAQAB
-----END PUBLIC KEY-----`

export const MOCK_PROJECTS = [
  { id: 'proj_1', name: 'production-db' },
  { id: 'proj_2', name: 'staging-db' },
  { id: 'proj_3', name: 'development-db' },
  { id: 'proj_4', name: 'analytics-db' },
]
