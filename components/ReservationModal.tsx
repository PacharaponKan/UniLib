'use client';

import { useState, useEffect } from 'react';
import { reserveBook, getBooks } from '@/app/actions';
import { X, BookOpen } from 'lucide-react';

interface ReservationModalProps {
  book: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservationModal({ book, onClose, onSuccess }: ReservationModalProps) {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [relatedBooks, setRelatedBooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchRelated = async () => {
      const allBooks = await getBooks();
      const related = allBooks
        .filter((b: any) => b.category === book.category && b.id !== book.id)
        .slice(0, 2);
      setRelatedBooks(related);
    };
    fetchRelated();
  }, [book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await reserveBook(studentId, book.id, studentName);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to reserve book');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-[#870000]/10 my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-[#870000] text-white sticky top-0 z-10">
          <h2 className="text-xl font-semibold">
            {book.status === 'Available' ? 'Confirm Reservation' : 'Join Queue'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            {book.status === 'Borrowed' && (
              <div className="mb-3 p-2 bg-amber-50 text-amber-800 text-sm rounded border border-amber-200">
                <strong>Note:</strong> This book is currently borrowed. You will be placed in the queue.
              </div>
            )}
            <h3 className="font-medium text-[#393214]">{book.title}</h3>
            <p className="text-sm text-gray-500 mt-1">by {book.author}</p>
            {book.description && (
              <p className="text-sm text-gray-600 mt-3 border-t border-gray-200 pt-3">
                {book.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md">
                ISBN: {book.isbn}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-[#393214] mb-1">
                Student ID
              </label>
              <input
                type="text"
                id="studentId"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#870000] focus:border-[#870000] outline-none transition-all"
                placeholder="e.g. S1234567"
              />
            </div>

            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-[#393214] mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="studentName"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#870000] focus:border-[#870000] outline-none transition-all"
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-[#393214] bg-[#f3ac0e] rounded-lg hover:bg-[#d99a0c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Processing...' : book.status === 'Available' ? 'Confirm Reservation' : 'Join Queue'}
              </button>
            </div>
          </form>

          {/* Related Books Section */}
          {relatedBooks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">You might also like</h4>
              <div className="space-y-3">
                {relatedBooks.map(rb => (
                  <div key={rb.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <BookOpen className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[#393214] line-clamp-1">{rb.title}</p>
                      <p className="text-xs text-gray-500">{rb.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
