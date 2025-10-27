import { useAuth } from '../../contexts/AuthContext';
import { Car, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Penjadwalan Mobil', path: '/', icon: <Calendar className="w-4 h-4" /> },
    ...(profile?.role === 'admin'
      ? [{ name: 'Manajemen Mobil', path: '/cars', icon: <Car className="w-4 h-4" /> }]
      : []),
  ];

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
          🚗 Jadwal Mobil
        </div>

        {/* Menu Links */}
        <div className="flex items-center gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 font-medium transition-colors ${
                location.pathname === item.path
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-semibold text-gray-800 text-sm">{profile?.full_name || 'User'}</div>
            <div className="text-xs text-gray-500">{profile?.role || 'User'}</div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
