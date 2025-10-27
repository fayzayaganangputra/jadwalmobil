import { useState } from 'react';
import { CalendarView } from '../components/Calendar/CalendarView';
import { BookingModal } from '../components/Booking/BookingModal';
import { Navbar } from '../components/Layout/Navbar';

export default function Dashboard() {
  const [isBookingOpen, setBookingOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  const handleCreateBooking = (carId: string, date: string) => {
    setSelectedCar(carId);
    setSelectedDate(date);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <CalendarView
          onCreateBooking={handleCreateBooking}
          onViewBooking={() => {}}
        />
      </main>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setBookingOpen(false)}
        carId={selectedCar}
        date={selectedDate}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
