import CreateRoomModal from "@/components/create-room-modal";
import { SubmitButton } from "@/components/submit-button";
import { redirect } from "next/navigation";

export default async function Chat({
  searchParams,
}: {
  searchParams: { show: string; selected: string };
}) {
  const { selected, show } = searchParams;
  const rooms = ["room_1", "room_2", "room_3"];
  const open = async () => {
    "use server";
    return redirect(`/protected?show=true`);
  };
  const send = async (formData: FormData) => {
    "use server";
    const message = formData.get("message") as string;
    console.log(message);
    return "Message sent!";
  };
  return (
    <div className="flex w-full h-full p-10">
      {show == "true" ? <CreateRoomModal /> : ""}
      <div className="flex w-full h-full gap-4">
        <div className="grow-0 flex  flex-col gap-2">
          <div className="bg-white h-[80vh] rounded-md text-slate-900">
            <form className="flex flex-col sm:max-w-md gap-2 text-foreground">
              {rooms.map((room: string) => {
                return (
                  <button
                    key={room}
                    formAction={async () => {
                      "use server";
                      redirect(`/protected?selected=${room}`);
                    }}
                    className={
                      selected == room
                        ? "bg-green-600 rounded pointer p-1 text-white"
                        : "rounded cursor-pointer hover:bg-green-100 p-1 text-black"
                    }
                  >
                    {room}
                  </button>
                );
              })}
            </form>
          </div>
          <form className="flex flex-col sm:max-w-md gap-2 text-foreground">
            <SubmitButton
              formAction={open}
              className="border border-foreground/20 rounded-md px-4 py-2 text-foreground "
              pendingText="Create Room"
            >
              Create Room
            </SubmitButton>
          </form>
        </div>
        <div className="grow flex flex-col gap-2">
          <div className="bg-white h-[80vh] rounded-md text-slate-900 p-1">
            content
          </div>
          <form className="flex text-foreground w-full gap-2">
            <label className="hidden" htmlFor="message" />
            <input
              name="message"
              className="grow rounded-md text-black p-2"
              placeholder="Insert your message"
            ></input>
            <SubmitButton
              formAction={send}
              className="border border-foreground/20 rounded-md px-4 py-2 text-foreground"
              pendingText="Send"
            >
              Send
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
