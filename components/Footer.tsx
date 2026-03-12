import Link from 'next/link';
import { Library, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#870000] text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Library className="w-6 h-6 text-[#f3ac0e]" />
              <span className="text-xl font-bold text-[#f3ac0e]">CMTC Library</span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">
              แหล่งเรียนรู้และสืบค้นทรัพยากรสารสนเทศ เพื่อสนับสนุนการศึกษาและการวิจัยของนักศึกษาวิทยาลัยเทคนิคเชียงใหม่
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-[#a03333] pb-2 inline-block">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="hover:text-[#f3ac0e] transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f3ac0e]"></span>
                  Search Books
                </Link>
              </li>
              <li>
                <Link href="/my-books" className="hover:text-[#f3ac0e] transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f3ac0e]"></span>
                  My Reservations
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-[#a03333] pb-2 inline-block">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#f3ac0e] shrink-0" />
                <span className="text-gray-200">9 ถนนเวียงแก้ว ตำบลศรีภูมิ<br />อำเภอเมือง จังหวัดเชียงใหม่ 50200</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#f3ac0e] shrink-0" />
                <span className="text-gray-200">053-211-615</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#f3ac0e] shrink-0" />
                <span className="text-gray-200">library@cmtc.ac.th</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#a03333] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} Chiang Mai Technical College Library. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
