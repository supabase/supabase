const Message = ({ message }) => (
  <>
    <div className="flex items-center">
      <div className="">
        <p className="text-white font-bold">{message.user_id}</p>
        <p className="text-white">{message.message}</p>
      </div>
    </div>
  </>
)

export default Message
