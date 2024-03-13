"use client";
import React, { useState, useRef } from "react";
import { navLinks } from "@/constants/data";
import Link from "next/link";

import { usePathname } from 'next/navigation';

import {
  Bars2Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'



const Navbar = () => {
  const currentRoute = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const copyEmail = () => {
    setLoading(true);
    navigator.clipboard.writeText('kuladeepbmantri@gmail.com');

    // Add a timeout to setLoading(false) to simulate a delay
    setTimeout(() => {
      setLoading(false);
    }, 1000); // Change the timeout duration (in milliseconds) as needed
  }


  return (
    <nav className="bg-bgSecondaryColor mt-10 py-3 px-5 rounded-2xl border border-borderColor relative">
      <div className="flex flex-row justify-between items-center">
        <div className="logo text-white text-lg font-bold">
          Kuladeep Mantri
        </div>

        <div className="flex gap-4 items-center">
          <div className=" gap-3 border-r border-hoverColor hidden md:hidden lg:flex">
            {navLinks.map((item: any) => (
              <Link

                href={item.href}
                className={`text-textColor ${currentRoute === item.href ? 'text-white text-base bg-[#282828] border-4 border-borderColor' : 'border-transparent'} flex gap-2 cursor-pointer px-4 py-2 hover:bg-[#282828] rounded-xl border-4 `}
              >
                <item.Icon className="h-6 w-6 text-textColor" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden md:hidden lg:flex gap-3 bg-[#222121] p-1 rounded-xl">
            <Link
              href="https://www.linkedin.com/in/kuladeepmantri/" target="_blank"
              className="text-white w-36 bg-hoverColor justify-center flex gap-2 cursor-pointer px-4 py-2 hover:bg-[#003B78] rounded-xl  hover:border-borderColor"
            >
              LinkedIn
            </Link>
            <div
              onClick={copyEmail}
              className="text-black w-36 bg-white  justify-center flex gap-2 cursor-pointer px-4 py-2 rounded-xl"
            >
              {loading ? 'Copying...' : 'Copy Email'}
            </div>
          </div>

          <div className="bg-[#282828] border-4 border-borderColor rounded-md flex md:flex lg:hidden">
            {!menuOpen ? <Bars2Icon className="text-white w-10 h-10 cursor-pointer" onClick={() => setMenuOpen(true)} /> : <XMarkIcon className="text-white w-10 h-10 cursor-pointer" onClick={() => setMenuOpen(false)} />}
          </div>

          {menuOpen && (
            <div className="drawr_menu p-10 w-[300px] rounded-md absolute bg-borderColor right-0 top-20 ">
              <div className="flex flex-col">
                {navLinks.map((item: any) => (
                  <Link

                    href={item.href}
                    className={`text-textColor ${currentRoute === item.href ? 'text-white text-base bg-[#282828] border-4 border-borderColor' : 'border-transparent'} flex gap-2 cursor-pointer px-4 py-2 hover:bg-[#282828] rounded-xl border-4 `}
                  >
                    <item.Icon className="h-6 w-6 text-textColor" />
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-5 mt-5">
                <Link
                  href="https://www.linkedin.com/in/kuladeepmantri/"
                  className="text-white w-36 bg-hoverColor justify-center flex gap-2 cursor-pointer px-4 py-2 hover:bg-[#003B78] rounded-xl  hover:border-borderColor"
                >
                  LinkedIn 
                </Link>
                <div
                  onClick={copyEmail}
                  className="text-black w-36 bg-white  justify-center flex gap-2 cursor-pointer px-4 py-2 rounded-xl"
                >
                  {loading ? 'Copying...' : 'Copy Email'}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
