import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SignUpForm } from './components/Auth/SignUpForm';
import { CalendarView } from './components/Calendar/CalendarView';
import { BookingModal } from './components/Booking/BookingModal';
import { BookingDetailModal } from './components/Booking/BookingDetailModal';
import { CarManagement } from './components/Admin/CarManagement';
import { LogOut, Calendar, Car, User } from 'lucide-react';
import { supabase } from './lib/supabase';

function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <Calendar className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Sistem Penjadwalan<br />Mobil Internal
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Kelola dan jadwalkan penggunaan mobil perusahaan dengan mudah dan efisien
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <span>Lihat jadwal mobil secara real-time</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-blue-600" />
              </div>
              <span>Booking mobil dengan cepat</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <span>Sistem persetujuan terintegrasi</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full">
          {showLogin ? (
            <LoginForm onToggleForm={() => setShowLogin(false)} />
          ) : (
            <SignUpForm onToggleForm={() => setShowLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'admin'>('calendar');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedCarName, setSelectedCarName] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateBooking = (carId: string, date: string) => {
    setSelectedCarId(carId);
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const handleViewBooking = async (booking: any) => {
    const { data: car } = await supabase
      .from('cars')
      .select('name')
      .eq('id', booking.car_id)
      .maybeSingle();

    setSelectedBooking(booking);
    setSelectedCarName(car?.name || '');
    setShowDetailModal(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Penjadwalan Mobil</h1>
                <p className="text-xs text-gray-500">{profile?.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-800">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">
                  {profile?.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profile?.role === 'admin' && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Kalender Booking
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Car className="w-5 h-5 inline mr-2" />
              Kelola Mobil
            </button>
          </div>
        )}

        {activeTab === 'calendar' ? (
          <CalendarView
            key={refreshKey}
            onCreateBooking={handleCreateBooking}
            onViewBooking={handleViewBooking}
          />
        ) : (
          <CarManagement />
        )}
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        carId={selectedCarId}
        date={selectedDate}
        onSuccess={handleSuccess}
      />

      <BookingDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        booking={selectedBooking}
        carName={selectedCarName}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
