import Link from 'next/link';
import { SchoolLogo } from './SchoolLogo';


export default function Layout({ children }: { children: React.ReactNode }) {
   return (
      <div className="flex flex-col min-h-screen">
         <header className="py-6 border-b bg-white sticky top-0 z-30">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <SchoolLogo className="h-12 w-12" />
                  <div>
                     <h1 className="text-xl font-bold">Amfofana High School</h1>
                     <p className="text-xs text-gray-500">Inspiring excellence since 1998</p>
                  </div>
               </div>


               <nav>
                  <ul className="flex items-center gap-6 text-sm">
                     <li><Link className="hover:text-primary" href="/">Home</Link></li>
                     <li><Link className="hover:text-primary" href="/about">About</Link></li>
                     <li><Link className="hover:text-primary" href="/teachers">Teachers</Link></li>
                     <li><Link className="hover:text-primary" href="/gallery">Gallery</Link></li>
                     <li><Link className="hover:text-primary" href="/contact">Contact</Link></li>
                  </ul>
               </nav>
            </div>
         </header>
         <main className="flex-1 py-12">{children}</main>
      </div>
   );
}
