'use client';

import Link from 'next/link';
import { Library } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-[#870000] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Library className="h-6 w-6 text-[#f3ac0e]" />
              <span className="font-bold text-lg tracking-tight">UniLib</span>
            </Link>
            <Link href="/my-books" className="text-sm font-medium hover:text-[#f3ac0e] transition-colors">
              My Books
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
