import { Avatar, AvatarFallback, AvatarImage } from 'ui'

export default function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/mildtomato.png" alt="@mildtomato" />
      <AvatarFallback>MT</AvatarFallback>
    </Avatar>
  )
}
