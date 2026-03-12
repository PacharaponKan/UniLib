'use client';

import { useState, useEffect } from 'react';
import { getStudentReservations, cancelOrReturnBook } from '@/app/actions';
import { Search, BookOpen, Clock, Calendar, AlertCircle, Award, Shield, Star, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MyBooksClient() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (id: string, silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    setError('');
    try {
      const result = await getStudentReservations(id);
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch reservations');
        setData(null);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setData(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Real-time updates for reservations and books
  useEffect(() => {
    if (!data || !studentId) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url.includes('placeholder')) return;

    const handleRealtimeUpdate = () => {
      // Silently refresh data when a change occurs in the database
      fetchData(studentId, true);
    };

    const reservationsChannel = supabase
      .channel('public:reservations:mybooks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, handleRealtimeUpdate)
      .subscribe();

    const booksChannel = supabase
      .channel('public:books:mybooks')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'books' }, handleRealtimeUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(booksChannel);
    };
  }, [data, studentId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;
    await fetchData(studentId.trim());
  };

  const handleAction = async (reservationId: string) => {
    setActionLoading(reservationId);
    setError(''); // Clear any previous errors
    try {
      const result = await cancelOrReturnBook(reservationId, studentId.trim());
      if (result.success) {
        await fetchData(studentId.trim());
      } else {
        setError(result.error || 'Failed to process request');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDueDateStatus = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: `Overdue by ${Math.abs(diffDays)} days!` };
    } else if (diffDays <= 2) {
      return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', text: `Due in ${diffDays} day(s)` };
    } else {
      return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', text: `Due in ${diffDays} days` };
    }
  };

  const getBadgeIcon = (badge: string) => {
    if (badge.includes('Wizard') || badge.includes('Apprentice')) return <Shield className="w-4 h-4 mr-1" />;
    if (badge.includes('Avid')) return <Star className="w-4 h-4 mr-1" />;
    return <Award className="w-4 h-4 mr-1" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#870000] mb-4">My Books & Queues</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Enter your Student ID to check the books you are currently borrowing or queuing for.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#870000] focus:border-[#870000] outline-none transition-all"
              placeholder="Enter your Student ID (e.g. S1234567)"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#870000] text-white font-medium rounded-lg hover:bg-[#6b0000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#870000] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {data && data.profile && (
        <div className="space-y-6">
          <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#393214]">{data.profile.name}</h2>
                {isRefreshing && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              <p className="text-gray-600 mb-3">Student ID: {data.profile.student_id}</p>
              
              {/* Gamification Badges */}
              {data.stats?.badges && data.stats.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.stats.badges.map((badge: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#f3ac0e]/10 text-[#d99a0c] border border-[#f3ac0e]/20 shadow-sm">
                      {getBadgeIcon(badge)}
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-4 text-center w-full md:w-auto">
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-100 flex-1 md:flex-none">
                <p className="text-2xl font-bold text-[#870000]">
                  {data.stats?.totalBorrowed || 0}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total History</p>
              </div>
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-100 flex-1 md:flex-none">
                <p className="text-2xl font-bold text-[#870000]">
                  {data.data.filter((r: any) => r.isBorrowing).length}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active</p>
              </div>
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-100 flex-1 md:flex-none">
                <p className="text-2xl font-bold text-[#f3ac0e]">
                  {data.data.filter((r: any) => !r.isBorrowing).length}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">In Queue</p>
              </div>
            </div>
          </div>

          {data.data.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No active records</h3>
              <p className="text-gray-500">You haven't borrowed or queued for any books yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {data.data.map((item: any) => {
                  const dueStatus = item.isBorrowing && item.dueDate ? getDueDateStatus(item.dueDate) : null;
                  
                  return (
                    <li key={item.id} className={`p-6 transition-colors ${dueStatus?.bg || 'hover:bg-gray-50'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-[#393214]">{item.book.title}</h3>
                            {item.isBorrowing ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Borrowing
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                In Queue (Position: #{item.queuePosition})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-3">Category: {item.book.category}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                              {item.isBorrowing ? 'Borrowed on: ' : 'Queued on: '}
                              {formatDate(item.reservedAt)}
                            </div>
                            
                            {item.isBorrowing && item.dueDate && dueStatus && (
                              <div className={`flex items-center font-medium px-2.5 py-1 rounded-md border ${dueStatus.color} ${dueStatus.border} bg-white`}>
                                <Calendar className="h-4 w-4 mr-1.5" />
                                {dueStatus.text} ({formatDate(item.dueDate)})
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex-shrink-0">
                          <button
                            onClick={() => handleAction(item.id)}
                            disabled={actionLoading === item.id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                              item.isBorrowing
                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {actionLoading === item.id 
                              ? 'Processing...' 
                              : item.isBorrowing 
                                ? 'Return Book' 
                                : 'Cancel Queue'}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
