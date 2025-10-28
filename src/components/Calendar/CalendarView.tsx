import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, CheckCircle, XCircle } from 'lucide-react';
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
  guest_name?: string;
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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
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

  // ✅ Realtime notification untuk admin
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const channel = supabase
      .channel('booking_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const newBooking = payload.new as Booking;
          if (newBooking.status === 'pending') {
            alert(`📅 Booking baru dibuat oleh User ID: ${newBooking.user_id} untuk tanggal ${newBooking.booking_date}`);
            loadPendingBookings();
            loadBookings();
          }
        }
      );

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadCars(), loadBookings(), loadPendingBookings()]);
    setLoading(false);
  };

  const loadCars = async () => {
    const { data } = await supabase.from('cars').select('*').eq('is_active', true).order('name');
    setCars(data || []);
  };

  const loadBookings = async () => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;
    const { data } = await supabase
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
    setBookings(data || []);
  };

  const loadPendingBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        user_profile:user_id(full_name),
        created_by_profile:created_by(full_name),
        car:car_id(name, plate_number)
      `)
      .eq('status', 'pending')
      .order('booking_date', { ascending: true });
    setPendingBookings(data || []);
  };

  const approveBooking = async (booking: Booking) => {
    await supabase.from('bookings').update({ status: 'approved' }).eq('id', booking.id);
    alert('✅ Booking disetujui');
    setSelectedBooking(null);
    loadBookings();
    loadPendingBookings();
  };

  const rejectBooking = async (booking: Booking) => {
    await supabase.from('bookings').update({ status: 'rejected' }).eq('id', booking.id);
    alert('❌ Booking ditolak');
    setSelectedBooking(null);
    loadBookings();
    loadPendingBookings();
  };

  const getBookingForCarAndDate = (carId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter((b) => b.car_id === carId && b.booking_date === dateStr);
  };

  const scrollToDate = (dateStr: string) => {
    setShowPendingModal(false);
    setHighlightedDate(dateStr);
    setTimeout(() => {
      const target = document.getElementById(`cell-${dateStr}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setTimeout(() => setHighlightedDate(null), 3000);
    }, 300);
  };

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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{monthNames[month]} {year}</h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft />
          </button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Pending Notification */}
      {profile?.role === 'admin' && (
        <button
          onClick={() => setShowPendingModal(true)}
          className="mb-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg font-medium hover:bg-yellow-200 transition"
        >
          🔔 Ada {pendingBookings.length} booking belum di-ACC
        </button>
      )}

      {/* Calendar Table */}
      <div className="overflow-x-auto" ref={calendarRef}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-50 border border-gray-300 p-3 text-left">Mobil</th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i} className={`border p-2 ${isToday(i + 1) ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id}>
                <td className="sticky left-0 bg-white border p-3 font-medium text-gray-800">
                  <div>{car.name}</div>
                  <div className="text-sm text-gray-500">{car.plate_number}</div>
                </td>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayBookings = getBookingForCarAndDate(car.id, day);
                  const isHighlighted = highlightedDate === dateStr;
                  return (
                    <td key={day} id={`cell-${dateStr}`} className={`border p-1 ${isHighlighted ? 'bg-blue-200' : ''}`}>
                      {dayBookings.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => onViewBooking(b)}
                          className={`block w-full text-left text-xs rounded p-2 border mb-1 ${getStatusColor(b.status)}`}
                        >
                          <div className="font-semibold">{b.purpose}</div>
                          <div>{b.start_time.slice(0, 5)}-{b.end_time.slice(0, 5)}</div>
                          <div className="text-[10px] text-gray-600">Oleh: {b.created_by_profile?.full_name}</div>
                          {b.guest_name && <div className="text-[10px] text-gray-600">Tamu: {b.guest_name}</div>}
                        </button>
                      ))}
                      {dayBookings.length === 0 && (
                        <button
                          onClick={() => onCreateBooking(car.id, dateStr)}
                          className="w-full text-gray-400 hover:text-blue-600"
                        >
                          <Plus size={14} />
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

      {/* Pending Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="font-bold text-lg">Booking Belum Disetujui ({pendingBookings.length})</h3>
              <button onClick={() => setShowPendingModal(false)}>✕</button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {pendingBookings.map((b) => (
                <div
                  key={b.id}
                  className="border rounded-lg p-3 mb-3 hover:bg-blue-50 transition cursor-pointer"
                  onClick={() => setSelectedBooking(b)}
                >
                  <div className="font-semibold">{b.purpose}</div>
                  <div className="text-sm text-gray-600">
                    {b.booking_date} | {b.car?.name} ({b.car?.plate_number})
                  </div>
                  <div className="text-sm">Oleh: {b.user_profile?.full_name}</div>
                  {b.guest_name && <div className="text-sm text-gray-600">Tamu: {b.guest_name}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Detail Booking</h3>
            <p><strong>Mobil:</strong> {selectedBooking.car?.name} ({selectedBooking.car?.plate_number})</p>
            <p><strong>Tanggal:</strong> {selectedBooking.booking_date}</p>
            <p><strong>Jam:</strong> {selectedBooking.start_time} - {selectedBooking.end_time}</p>
            <p><strong>Oleh:</strong> {selectedBooking.created_by_profile?.full_name}</p>
            {selectedBooking.guest_name && <p><strong>Tamu:</strong> {selectedBooking.guest_name}</p>}
            <p><strong>Tujuan:</strong> {selectedBooking.destination}</p>
            <p><strong>Keperluan:</strong> {selectedBooking.purpose}</p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => approveBooking(selectedBooking)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
              >
                <CheckCircle size={16} /> Setujui
              </button>
              <button
                onClick={() => rejectBooking(selectedBooking)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700"
              >
                <XCircle size={16} /> Tolak
              </button>
            </div>
            <button onClick={() => setSelectedBooking(null)} className="mt-4 text-gray-500 w-full">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
