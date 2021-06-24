import IconBar from "../nav/IconBar"

export default function DashboardLayout ({ children }) {
  return (
    <div className="flex">
      <div className="w-14 h-screen bg-sidebar-light dark:bg-sidebar-dark border-r dark:border-dark">
        <IconBar />
      </div>
      <div className="w-64 h-screen overflow-auto bg-sidebar-linkbar-light dark:bg-sidebar-linkbar-dark hide-scrollbar border-r dark:border-dark ">
        Menu List
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
