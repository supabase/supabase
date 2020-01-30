const Message = ({ message }) => (
  <>
    <div className="flex items-center">
      <div className="">
        <p className="text-white font-bold">{message.author.username}</p>
        <p className="text-white">{message.message}</p>
      </div>
    </div>
  </>
)

export default Message
