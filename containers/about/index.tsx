"use client"
import React, { useState } from 'react'
import { Portfo } from "@/constants/data";
import Image from "next/image";
import Link from 'next/link';

import {
    ArrowDownOnSquareIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    ClipboardDocumentIcon
} from '@heroicons/react/24/outline'

import { Eductaion, Experience, Certification } from '@/constants/data'


const GridSection = () => {

    const [selectTab, setSelectedTab] = useState(1);

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-7 auto-rows-auto gap-7 w-full py-10">
            <div className=" w-full col-span-7 md:col-span-7 lg:col-span-4  bg-bgSecondaryColor border border-borderColor rounded-xl px-5 py-10 flex flex-col gap-6 ">
                <span>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-t from-[#29292b] to-[#dcdcdc] bg-clip-text text-transparent">Hey there! I’m Kuladeep 👋🏿</h1>
                </span>
                <p className=" text-white w-full">
                I'm a Cybersecurity Engineer with a Master's degree and 2 years of practical experience. I have strong expertise in IT and security, backed by a Certified Ethical Hacker (CEH) certification. When I'm not working, I love trying new foods and traveling to different places. I also enjoy going to the gym and exploring the latest gadgets and technologies like virtual reality and AI. In addition to cybersecurity, I'm a developer who builds applications mostly using the Python. I'm always eager to learn about new technologies and take on exciting challenges.
                </p>

                <Link href="https://drive.google.com/file/d/1mDpVBbH0pcPeNtPdEwFkNsvFGdqppzby/view?usp=sharing" target='_blank' className='bg-white w-[250px] md:w-1/3 lg:w-1/3 flex items-center justify-center py-2 rounded-md gap-3'>
                    <ArrowDownOnSquareIcon className='w-6 h-6' /> Download Resume
                </Link>

            </div>
            <div className="w-full col-span-7 md:col-span-7 lg:col-span-3 bg-bgSecondaryColor border border-borderColor rounded-lg bg-grid-borderColor p-8 md:p-8 lg:p-0 order-first">
  <div className="h-full flex flex-col justify-center text-center rounded-lg items-center text-white gap-2 bg-gradient-to-bl from-transparent via-bgSecondaryColor to-bgSecondaryColor">
    <Image src={Portfo} alt="Avatar" className="w-auto h-auto rounded-lg" />
  </div>
</div>
<div className='w-full bg-bgSecondaryColor border border-borderColor col-span-7 rounded-md px-5 py-5 flex flex-col'>
  <div className="tabls flex gap-5 flex-wrap md:flex-wrap lg:flex-nowrap">
    <div
      onClick={() => setSelectedTab(1)}
      className={`text-textColor ${selectTab === 1 ? 'text-white text-base bg-[#282828] border-4 border-borderColor' : 'border-transparent'} flex gap-2 cursor-pointer px-4 py-2 hover:bg-[#282828] rounded-xl border-4 `}
    >
      <AcademicCapIcon className="h-6 w-6 text-textColor" />
      Education
    </div>
    <div
      onClick={() => setSelectedTab(2)}
      className={`text-textColor ${selectTab === 2 ? 'text-white text-base bg-[#282828] border-4 border-borderColor' : 'border-transparent'} flex gap-2 cursor-pointer px-4 py-2 hover:bg-[#282828] rounded-xl border-4 `}
    >
      <BriefcaseIcon className="h-6 w-6 text-textColor" />
      Experience
    </div>
    <div
      onClick={() => setSelectedTab(3)}
      className={`text-textColor ${selectTab === 3 ? 'text-white text-base bg-[#282828] border-4 border-borderColor' : 'border-transparent'} flex gap-2 cursor-pointer px-4 py-2 hover:bg-[#282828] rounded-xl border-4 `}
    >
      <ClipboardDocumentIcon className="h-6 w-6 text-textColor" />
      Certifications
    </div>
  </div>

  <div className='mt-5 flex flex-col gap-5'>
    {selectTab === 1 && (
      <React.Fragment>
        {Eductaion.map((item: any) => (
          <div className="card border border-borderColor py-4 px-5 rounded-md flex items-center justify-start gap-5">
            <div className="ico p-2 rounded-md bg-borderColor">
              <AcademicCapIcon className="h-6 w-6 text-textColor" />
            </div>
            <div className="text_contents flex flex-col gap-2">
              <p className=' text-white'>{item.title}</p>
              <p className=' text-textColor text-xs'>{item.programme} | {item.start}-{item.end}</p>
            </div>
          </div>
        ))}
      </React.Fragment>
    )}

    {selectTab === 2 && (
      <React.Fragment>
        {Experience.map((item: any) => (
          <div className="card border border-borderColor py-4 px-5 rounded-md flex items-center justify-start gap-5">
            <div className="ico p-2 rounded-md bg-borderColor">
              <BriefcaseIcon className="h-6 w-6 text-textColor" />
            </div>
            <div className="text_contents flex flex-col gap-2">
              <p className=' text-white'>{item.title}</p>
              <p className=' text-textColor text-xs'>{item.company} | {item.start}-{item.end}</p>
            </div>
          </div>
        ))}
      </React.Fragment>
    )}

    {selectTab === 3 && (
      <React.Fragment>
        {Certification.map((item: any) => (
          <Link href={item.link} target="_blank" className="card border border-borderColor py-4 px-5 rounded-md flex items-center justify-start gap-5">
            <div className="ico p-2 rounded-md bg-borderColor">
              <ClipboardDocumentIcon className="h-6 w-6 text-textColor" />
            </div>
            <div className="text_contents flex flex-col gap-2">
              <p className=' text-white'>{item.title}</p>
              <p className=' text-textColor text-xs'>{item.site} | {item.year}</p>
            </div>
          </Link>
        ))}
      </React.Fragment>
    )}
  </div>
</div>

        </div>
    )
}

export default GridSection