"use client"

import React from "react";
import { Avatar } from "@/constants/data";
import Image from "next/image";
import Link from "next/link";
// import { EvervaultCard, Icon } from "@/components/shadcn";


import { FeaturedProjects, Testimonials, SocialLinks, Tools } from "@/constants/data";

const GridSection = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-7 auto-rows-auto gap-7 w-full py-10">
      <div className=" w-full col-span-7 md:col-span-4  bg-bgSecondaryColor border border-borderColor rounded-xl px-5 py-10 flex flex-col gap-6 ">

        <div className="title text-white text-3xl md:text-4xl font-bold">
        Cybersecurity Graduate, Certified Ethical Hacker & AI/ML Developer. </div>
        <span>
          <h1 className="text-4xl font-bold bg-gradient-to-t from-[#29292b] to-[#dcdcdc] bg-clip-text text-transparent">@kuladeepmantri</h1>
        </span>
        <p className=" text-textColor w-3/4">
        </p>

      </div>
      <div className="w-full col-span-7 md:col-span-3 bg-bgSecondaryColor border border-borderColor rounded-xl bg-grid-borderColor p-10 md:p-0 order-first ">
        <div className=" h-full flex flex-col  justify-center text-center rounded-xl items-center text-white gap-2 bg-gradient-to-bl from-transparent via-bgSecondaryColor to-bgSecondaryColor">
          <Image src={Avatar} alt="Avatar" width={200} height={200} className=" rounded-full border-8 border-[#222121]" />

        </div>
      </div>
      

      <div className="w-full flex flex-col gap-5 col-span-7 md:col-span-7 lg:col-span-2 row-span-2 bg-bgSecondaryColor border border-borderColor rounded-xl p-2">
        <div className="header flex flex-row items-center justify-between border border-borderColor rounded-tr-xl rounded-tl-xl p-3">
          <h4 className="text-white font-bold">Featured Projects</h4>
          <Link href="https://github.com/kuladeepmantri?tab=repositories" target="_blank" className=" bg-borderColor text-textColor px-3 py-2 rounded-md ">
            View All
          </Link>
        </div>

        {FeaturedProjects.map((project: any) => (
          <Link href={project.url} target="_blank" className="card border p-3 border-borderColor rounded-xl flex flex-row justify-start gap-10 items-center">
            <div className="ico p-2 rounded-md bg-borderColor">
              <project.Icon className="h-6 w-6 text-textColor" />
            </div>

            <div className="textContent flex flex-col gap-2">
              <h4 className="text-white">{project.name}</h4>
              <p className=" text-textColor">{project.category}</p>
            </div>
          </Link>
        ))}

      </div>




      <div className="w-full col-span-7 md:col-span-7 lg:col-span-3 row-span-1 bg-bgSecondaryColor border border-borderColor rounded-xl p-2">
  <div className="header flex flex-row items-center justify-start gap-5 border border-borderColor rounded-tr-xl rounded-tl-xl p-3">
    <h4 className="text-white font-bold">Toolkit</h4>
  </div>

  <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 py-5">
    {Tools.map((item: any) => (
      <div key={item.name} className="group relative">
        <div className="relative p-4 rounded-lg shadow-md bg-bgSecondaryColor flex flex-col items-center justify-center transition duration-300 transform hover:scale-105 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-sky-400">
          <div className="mb-2 transition duration-300 group-hover:opacity-0">
            <item.Icon className="h-8 w-8 sm:h-6 sm:w-6 text-textColor" />
          </div>
          <h3 className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-center text-white opacity-0 transition duration-300 group-hover:opacity-100">{item.name}</h3>
        </div>
      </div>
    ))}
  </div>
</div>


      {/* <div className="w-full col-span-7 md:col-span-7 lg:col-span-3 row-span-1 bg-bgSecondaryColor border border-borderColor rounded-xl p-2">
  <div className="header flex flex-row items-center justify-start gap-5 border border-borderColor rounded-tr-xl rounded-tl-xl p-3">
    <h4 className="text-white font-bold">Toolkit</h4>
  </div>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-5">
    {Tools.map((item: any) => (
      <div key={item.name} className="group relative">
        <div className="relative p-4 rounded-lg shadow-md bg-bgSecondaryColor flex flex-col items-center justify-center transition duration-300 transform hover:scale-105 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500">
          <div className="mb-2 transition duration-300 group-hover:opacity-0">
            <item.Icon className="h-8 w-8 text-textColor" />
          </div>
          <h3 className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-center text-white opacity-0 transition duration-300 group-hover:opacity-100">{item.name}</h3>
        </div>
      </div>
    ))}
  </div>
</div> */}










      <div className="w-full col-span-7  md:col-span-7 lg:col-span-2 row-span-1 bg-bgSecondaryColor border border-borderColor rounded-xl p-2">
        <div className="header flex flex-row items-center justify-start gap-5 border border-borderColor rounded-tr-xl rounded-tl-xl p-3">
          <h4 className="text-white font-bold">Recommendations</h4>
        </div>
        <div className="relative m-auto w-auto overflow-hidden bg-bgSecondaryColor before:absolute before:left-0 before:top-0 before:z-[2] before:h-full before:w-[100px] before:content-[''] after:absolute after:right-0 after:top-0 after:z-[2] after:h-full after:w-[100px] after:-scale-x-100  after:content-['']">
          <div className="animate-infinite-slider flex-col space-y-5 h-[calc(30px*10)]">
            {Testimonials.map((item, index) => (
              <div
                className="slide flex flex-col h-[125px] w-full gap-2 items-start px-5 justify-center text-white bg-[#1c1c1c1] rounded-md border-2 border-[#1e1d1d]"
                key={index}
              >
                <p>{item.name}</p>
                <p className="text-sm text-textColor">{item.desc}</p>
              </div>
            ))}
            {Testimonials.map((item, index) => (
              <div
                className="slide flex flex-col h-[125px] w-full gap-2 items-start px-5 justify-center text-white bg-[#1c1c1c1] rounded-md border-2 border-[#1e1d1d]"
                key={index}
              >
                <p>{item.name}</p>
                <p className="text-sm text-textColor">{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className="w-full col-span-7 md:col-span-7 lg:col-span-5 row-span-1 bg-bgSecondaryColor border border-borderColor rounded-xl p-5">
  <div className="flex flex-col md:flex-row items-center justify-between gap-5">
    <div className="text-center md:text-left">
      <h2 className="text-2xl font-bold text-white mb-2">Let's Connect!</h2>
      <p className="text-textColor">Feel free to reach out and start a conversation.</p>
    </div>
    <div className="flex gap-4">
      {SocialLinks.map((item: any, index: number) => (
        <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="group relative">
          <div className="p-3 rounded-full bg-borderColor transition duration-300 transform group-hover:scale-110">
            <item.Icon className="h-6 w-6 text-textColor transition duration-300 group-hover:animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition duration-300 transform scale-0 group-hover:scale-150"></div>
          </div>
        </a>
      ))}
    </div>
  </div>
</div>
</div>
  );
};

export default GridSection;
