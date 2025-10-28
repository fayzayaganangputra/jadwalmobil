import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Car {
  id: string;
  name: string;
  plate_number: string;
}

interface Booking {
  id: string;
  car_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  destination: string;
  status: string;
  user_id: string;
  user_profile?: { full_name: string };
  created_by_profile?: { full_name: string };
  car?: { name: string; plate_number: string };
}

interface CalendarViewProps {
  onCreateBooking: (carId: string, date: string) => void;
  onViewBooking: (booking: Booking) => void;
}

export function CalendarView({ onCreateBooking, onViewBooking }: CalendarViewProps) {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);

  const calendarRef = useRef<HTMLTableElement | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Realtime listener: update admin ketika ada booking pending baru
  useEffect(() => {
    if (profile?.role === 'admin') {
      const channel = supabase
        .channel('booking_notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bookings' },
          (payload) => {
            const newBooking = payload.new;
            if (newBooking.status === 'pending') {
              alert(
                `📅 Booking baru dibuat oleh User ID: ${newBooking.user_id}\nTanggal: ${newBooking.booking_date}`
              );
              loadPendingBookings();
              loadBookings();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadCars(), loadBookings(), loadPendingBookings()]);
    setLoading(false);
  };

  const loadCars = async () => {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) console.error('Error loading cars:', error);
    else setCars(data || []);
  };

  const loadBookings = async () => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user_profile:user_id(full_name),
        created_by_profile:created_by(full_name),
        car:car_id(name, plate_number)
      `)
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .not('status', 'in', '("cancelled","rejected")');

    if (error) console.error('Error loading bookings:', error);
    else setBookings(data || []);
  };

  const loadPendingBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user_profile:user_id(full_name),
        car:car_id(name, plate_number)
      `)
      .eq('status', 'pending')
      .order('booking_date', { ascending: true });

    if (error) console.error('Error loading pending bookings:', error);
    else setPendingBookings(data || []);
  };

  const getBookingForCarAndDate = (carId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter((b) => b.car_id === carId && b.booking_date === dateStr);
  };

  const previousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  // 🧭 Scroll dan highlight ke tanggal yang diklik dari daftar pending
  const scrollToDate = (dateStr: string) => {
    setShowPendingModal(false);
    setHighlightedDate(dateStr);

    setTimeout(() => {
      const target = document.getElementById(`cell-${dateStr}`);
      if (target && calendarRef.current) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }

      // hilangkan highlight setelah 3 detik
      setTimeout(() => setHighlightedDate(null), 3000);
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header Kalender */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tombol Pending Booking */}
      {profile?.role === 'admin' && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowPendingModal(true)}
            className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg font-medium hover:bg-yellow-200 transition"
          >
            🔔 Ada {pendingBookings.length} booking belum di-ACC
          </button>
        </div>
      )}

      {/* Kalender */}
      <div className="overflow-x-auto" ref={calendarRef}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-50 p-3 text-left font-semibold text-gray-700 sticky left-0 z-10 min-w-[200px]">
                Mobil
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <th
                  key={day}
                  className={`border border-gray-300 bg-gray-50 p-2 text-center font-semibold min-w-[120px] ${
                    isToday(day) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id}>
                <td className="border border-gray-300 p-3 font-medium text-gray-800 bg-white sticky left-0 z-10">
                  <div>
                    <div className="font-semibold">{car.name}</div>
                    <div className="text-sm text-gray-500">{car.plate_number}</div>
                  </div>
                </td>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayBookings = getBookingForCarAndDate(car.id, day);
                  const isHighlighted = highlightedDate === dateStr;

                  return (
                    <td
                      key={day}
                      id={`cell-${dateStr}`}
                      className={`border border-gray-300 p-1 align-top transition-all duration-300 ${
                        isHighlighted ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {dayBookings.length > 0 ? (
                        <div className="space-y-1">
                          {dayBookings.map((booking) => (
                            <button
                              key={booking.id}
                              onClick={() => onViewBooking(booking)}
                              className={`w-full text-left p-2 rounded border text-xs hover:shadow-md transition-shadow ${getStatusColor(booking.status)}`}
                            >
                              <div className="font-semibold truncate">{booking.purpose}</div>
                              <div className="text-xs opacity-75">
                                {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-1">
                                Oleh: {booking.created_by_profile?.full_name || 'Tidak diketahui'}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => onCreateBooking(car.id, dateStr)}
                          className="w-full h-full min-h-[60px] flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span className="text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span className="text-gray-600">Completed</span>
        </div>
      </div>

      {/* Modal Pending Bookings */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Booking Belum Disetujui ({pendingBookings.length})
              </h3>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-gray-600 hover:text-red-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {pendingBookings.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 text-left">Mobil</th>
                      <th className="p-3 text-left">Tanggal</th>
                      <th className="p-3 text-left">Pemesan</th>
                      <th className="p-3 text-left">Tujuan</th>
                      <th className="p-3 text-left">Bulan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBookings.map((b) => {
                      const bookingMonth = new Date(b.booking_date).toLocaleString('id-ID', { month: 'long' });
                      return (
                        <tr
                          key={b.id}
                          onClick={() => scrollToDate(b.booking_date)}
                          className="border-b hover:bg-blue-50 cursor-pointer transition"
                        >
                          <td className="p-3">
                            {b.car?.name || 'Tidak diketahui'} <br />
                            <span className="text-xs text-gray-500">{b.car?.plate_number}</span>
                          </td>
                          <td className="p-3">{b.booking_date}</td>
                          <td className="p-3">{b.user_profile?.full_name || 'Tidak diketahui'}</td>
                          <td className="p-3">{b.destination}</td>
                          <td className="p-3 capitalize">{bookingMonth}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-6">
                  Tidak ada booking pending saat ini.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
