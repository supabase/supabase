import { FC } from 'react'

interface Props {
  users: Record<string, any>
}

const Users: FC<Props> = ({ users }) => {
  return (
    <div className="relative">
      {users
        ? Object.entries(users).map(([userId, userData], idx) => {
            return (
              <div key={userId} className="relative">
                <div
                  key={userId}
                  className={[
                    'transition-all absolute right-0 h-8 w-8 bg-scale-1200 rounded-full bg-center bg-[length:50%_50%]',
                    'bg-no-repeat shadow-md flex items-center justify-center',
                  ].join(' ')}
                  style={{
                    border: `1px solid ${userData.hue}`,
                    background: userData.color,
                    transform: `translateX(${
                      Math.abs(idx - (Object.keys(users).length - 1)) * -20
                    }px)`,
                  }}
                >
                  <div
                    style={{ background: userData.color }}
                    className="w-7 h-7 animate-ping-once rounded-full"
                  />
                </div>
              </div>
            )
          })
        : null}
    </div>
  )
}

export default Users
