"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  FaBars,
  FaTimes,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaCog, // เพิ่มไอคอน
  FaChartLine, // เพิ่มไอคอน
  FaFilePdf, // เพิ่มไอคอน
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

// --- START: แก้ไขส่วนนี้ ---
const menuItems = [
  { name: "แดชบอร์ด", href: "/user", icon: <MdDashboard /> },
  {
    name: "สถานะระบบ",
    icon: <FaChartLine />,
    subMenu: [
      { name: "อุปกรณ์ของคูณ", href: "../status/realtime" },
      { name: "กราฟย้อนหลัง", href: "/status/history" },
    ],
  },
  {
    name: "ควบคุมอุปกรณ์",
    icon: <FaCog />,
    subMenu: [
      { name: "ปั๊มและวาล์ว", href: "/control/pumps" },
      { name: "เครื่องเติมอากาศ", href: "/control/aerators" },
    ],
  },
  {
    name: "รายงาน",
    icon: <FaFilePdf />,
    subMenu: [
        { name: "สร้างรายงาน", href: "/reports/generate" },
        { name: "ประวัติรายงาน", href: "/reports/history" },
    ],
  },
  { name: "การแจ้งเตือน", href: "/notifications", icon: <FaBell /> },
];
// --- END: แก้ไขส่วนนี้ ---

export const Sidebar: React.FC = () => {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const toggleSubMenu = (name: string) => {
    setOpenSubMenu((prev) => (prev === name ? null : name));
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  if (!session) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return (
    <>
      {/* Mobile header */}
      <header className="bg-white shadow-md flex items-center justify-between px-4 py-3 md:hidden fixed top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-2">
          <MdDashboard className="text-2xl text-blue-600" />
          <span className="font-bold text-lg text-blue-600">My Admin</span>
        </div>
        <button onClick={toggleMenu} aria-label="Toggle menu" className="text-2xl">
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg pt-16 md:pt-6 transform transition-transform duration-300 z-30 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center px-6 mb-8 gap-2">
          <MdDashboard className="text-3xl text-blue-600" />
          <h1 className="font-bold text-xl text-blue-600">My Admin</h1>
        </div>

        {/* Menu */}
        <nav className="flex flex-col px-2 space-y-1 text-gray-700">
          {menuItems.map(({ name, href, icon, subMenu }) => (
            <div key={name}>
              {!subMenu ? (
                <Link
                  href={href}
                  className="flex items-center gap-3 px-4 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <span className="text-lg">{icon}</span>
                  <span>{name}</span>
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleSubMenu(name)}
                    className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{icon}</span>
                      <span>{name}</span>
                    </span>
                    <span
                      className={`transform transition-transform ${
                        openSubMenu === name ? "rotate-90" : "rotate-0"
                      }`}
                    >
                      ▶
                    </span>
                  </button>
                  {/* Submenu */}
                  {openSubMenu === name && (
                    <div className="ml-10 flex flex-col space-y-1 mt-1">
                      {subMenu.map(({ name: subName, href: subHref }) => (
                        <Link
                          key={subName}
                          href={subHref}
                          className="px-4 py-2 rounded hover:bg-blue-100 hover:text-blue-700 transition"
                        >
                          {subName}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom user & settings */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-100 rounded"
          >
            <FaSignOutAlt />
            Logout
          </button>
          <div className="flex items-center gap-3 mt-4">
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt="User Profile"
                width={40}
                height={40}
                className="rounded-full"
                priority
              />
            ) : (
              <FaUserCircle className="text-4xl text-gray-400" />
            )}
            <div>
              <p className="font-semibold">{session.user?.name}</p>
              <p className="text-xs text-gray-500">{session.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};