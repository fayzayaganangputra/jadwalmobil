import { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, User, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Booking {
  id: string;
  car_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  destination: string;
  driver_name: string;
  notes: string;
  status: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  carName?: string;
  onSuccess: () => void;
}

export function BookingDetailModal({ isOpen, onClose, booking, carName, onSuccess }: BookingDetailModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const isOwner = user?.id === booking.user_id;
  const isAdmin = profile?.role === 'admin';
  const canEdit = isOwner && booking.status === 'pending';
  const canApprove = isAdmin;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    const labels = {
      pending: 'Menunggu Persetujuan',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus booking ini?')) return;

    setLoading(true);
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
    setLoading(false);

    if (error) {
      alert('Error menghapus booking: ' + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', booking.id);
    setLoading(false);

    if (error) {
      alert('Error mengubah status: ' + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Detail Booking</h2>
            <p className="text-gray-600 mt-1">{carName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className="mt-1">{getStatusBadge(booking.status)}</div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Dibuat oleh</p>
              <p className="font-medium text-gray-800 mt-1">{booking.profiles?.full_name}</p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Tanggal</p>
                <p className="font-medium text-gray-800">{formatDate(booking.booking_date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Waktu</p>
                <p className="font-medium text-gray-800">
                  {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)} WIB
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Keperluan</p>
                <p className="font-medium text-gray-800">{booking.purpose}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Tujuan</p>
                <p className="font-medium text-gray-800">{booking.destination}</p>
              </div>
            </div>

            {booking.driver_name && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="font-medium text-gray-800">{booking.driver_name}</p>
                </div>
              </div>
            )}

            {booking.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Catatan</p>
                  <p className="font-medium text-gray-800">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-6 flex flex-wrap gap-3">
            {canApprove && booking.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Setujui
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Tolak
                    </>
                  )}
                </button>
              </>
            )}

            {canApprove && booking.status === 'approved' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Tandai Selesai
                  </>
                )}
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Hapus Booking
                  </>
                )}
              </button>
            )}

            {!canEdit && !canApprove && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
