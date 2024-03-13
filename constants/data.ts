import {
    HomeIcon,
    BriefcaseIcon,
    IdentificationIcon,
    RectangleStackIcon
} from '@heroicons/react/24/outline'
import Avatar from '@/assets/avatar.png'
import Portfo from '@/assets/portfo.png'
import ceh from '@/assets/ceh.png'
import { FaBarsProgress, FaComputer, FaDocker, FaHandFist, FaHandHolding, FaLaptop, FaLaptopCode, FaLaptopFile, FaLinux, FaMailchimp, FaPython, FaReact, FaShieldVirus, FaUserSecret, FaWifi, FaXTwitter } from 'react-icons/fa6'
import { RiBarChartGroupedFill, RiEqualFill, RiFlutterFill, RiFlutterLine, RiLinkedinFill, RiNotionFill } from 'react-icons/ri'
import { BsInstagram, BsDribbble, BsGithub } from 'react-icons/bs'

import { FaCloudUploadAlt, FaCubes, FaExclamationTriangle, FaFigma, FaFileArchive, FaHandshakeAltSlash, FaSketch, FaSlack, FaSmile, FaSpotify } from 'react-icons/fa'


export const navLinks = [
    { href: '/', label: "Home", Icon: HomeIcon },
    { href: '/about', label: "About Me", Icon: IdentificationIcon },
]

export {
    Avatar,
    Portfo,
    ceh
}


export const SocialLinks = [
    { name: 'Twitter', url: 'https://twitter.com/kuladeepmantri', Icon: FaXTwitter },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/kuladeepmantri/', Icon: RiLinkedinFill },
    { name: 'Instagram', url: 'https://www.instagram.com/kuladeep_mantri/', Icon: BsInstagram },
    { name: 'Github', url: 'https://github.com/kuladeepmantri', Icon: BsGithub}
    
]


export const FeaturedProjects = [
    { name: 'DocIntel (OCR + LLM)', category: 'In the works', url:'', Icon: FaExclamationTriangle },
    { name: 'DecipherIQ', category: 'Flask, OpenAI', url: 'https://github.com/kuladeepmantri/DecipherIQ', Icon: FaUserSecret },
    { name: 'DeID Anonymizer', category: 'Python, PyQT5, PySpark', url: 'https://github.com/kuladeepmantri/DeID-Anonymizer', Icon: FaFileArchive },
    { name: 'BioCloud 2FA', category: 'Flutter, Firebase, AES 256', url: 'https://github.com/kuladeepmantri/BioCloud-2FA', Icon: FaCloudUploadAlt },
]

export const Testimonials = [
    {
        name: 'ProtonMail',
        desc: "An encrypted email service based in Switzerland, prioritizing user privacy and security."
    },
    {
        name: 'OnionShare',
        desc: "File-sharing tool utilizing the Tor network for anonymity and privacy."
    },
    {
        name: 'Signal',
        desc: "Widely regarded as the most secure messaging app, with end-to-end encryption and disappearing message features."
    },
    {
        name: 'DuckDuckGo',
        desc: "A privacy-focused search engine that doesn't track your browsing history or search queries."
    },
    {
        name: 'Tails OS',
        desc: "A live operating system (runs from a USB drive) that forces all internet traffic through the Tor network and leaves no traces of activity on your computer."
    }
]

export const Tools = [
    { name: 'python', Icon: FaPython },
    { name: 'linux', Icon: FaLinux },
    { name: 'docker', Icon: FaDocker},
    { name: 'wireshark', Icon: FaWifi },
    { name: 'burpsuite', Icon: RiBarChartGroupedFill },
    { name: 'splunk', Icon: FaShieldVirus},
    { name: 'flutter', Icon: RiFlutterFill },
    { name: 'reactjs', Icon: FaReact },
    { name: 'vmware', Icon: FaLaptop },
    { name: 'tensorflow', Icon: FaComputer },
    { name: 'pandas', Icon: RiEqualFill },
    { name : 'huggingface', Icon: FaSmile}
  ]

export const Experience = [
    {
        title: 'Information Security Intern',
        company: 'Phoenix Global',
        start: '2020',
        end: '2021'
    },
    {
        title: 'Project Intern',
        company: 'Unschool.in',
        start: '2019',
        end: '2020'
    }
]

export const Eductaion = [
    {
        title: 'Illinois Institute of Technology',
        programme: 'Master of Cybersecurity',
        start: '2021',
        end: '2023'
    },
    {
        title: 'GITAM Deemed University',
        programme: 'Bachelor of Technology, Computer Science',
        start: '2017',
        end: '2021'
    }
]

export const Certification = [
    {
        title: 'Certified Ethical Hacker (CEH)',
        site: 'EC-Council',
        year: '2023',
        link: 'https://aspen.eccouncil.org/VerifyBadge?type=certification&a=QHi65KIwCtS6TgPugwO9dJQgM+arH1NuZ3p/zbi33Qw='
    }
]