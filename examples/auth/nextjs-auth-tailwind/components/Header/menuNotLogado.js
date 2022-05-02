import React from 'react'
import Link from 'next/link'
const MenuNotLogado = () => (
  <div className="flex space-x-4">
    <Link href="/auth">
      <a className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">LOGIN</a>
    </Link>
  </div>
)

export default MenuNotLogado
