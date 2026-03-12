'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, BookOpen, Library, CheckCircle2, AlertCircle, Filter, TrendingUp, Users } from 'lucide-react';
import ReservationModal from './ReservationModal';
import { supabase } from '@/lib/supabase';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: 'Available' | 'Borrowed' | 'Reserved';
  description?: string;
  borrowCount?: number;
}

interface BookListProps {
  initialBooks: Book[];
}

export default function BookList({ initialBooks }: BookListProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Real-time updates for books
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url.includes('placeholder')) return;

    const booksChannel = supabase
      .channel('public:books')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'books' },
        (payload) => {
          const updatedBook = payload.new as Book;
          setBooks((currentBooks) =>
            currentBooks.map((book) =>
              book.id === updatedBook.id ? { ...book, status: updatedBook.status } : book
            )
          );
        }
      )
      .subscribe();

    const reservationsChannel = supabase
      .channel('public:reservations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        (payload) => {
          const newReservation = payload.new;
          setBooks((currentBooks) =>
            currentBooks.map((book) =>
              book.id === newReservation.book_id
                ? { ...book, borrowCount: (book.borrowCount || 0) + 1 }
                : book
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(booksChannel);
      supabase.removeChannel(reservationsChannel);
    };
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(books.map(b => b.category));
    return ['All', ...Array.from(cats)].sort();
  }, [books]);

  // Get top 3 trending books
  const trendingBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0))
      .slice(0, 3);
  }, [books]);

  const filteredBooks = books.filter((book) => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery);
      
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || book.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleReservationSuccess = () => {
    setSelectedBook(null);
    setSuccessMessage('Reservation confirmed successfully!');
    // In a real app, we'd refetch or optimistically update
    // For this demo, we'll just update the local state
    setBooks(
      books.map((b) =>
        b.id === selectedBook?.id ? { ...b, status: 'Borrowed', borrowCount: (b.borrowCount || 0) + 1 } : b
      )
    );
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#870000] flex items-center gap-3">
            <Library className="w-8 h-8" />
            University Library
          </h1>
          <p className="text-[#393214] mt-2 text-lg">
            Search and reserve books from our academic collection.
          </p>
        </div>
      </div>

      {/* Trending Section */}
      {trendingBooks.length > 0 && searchQuery === '' && selectedCategory === 'All' && selectedStatus === 'All' && (
        <div className="mb-12">
          <div className="flex items-center gap-2 text-[#f3ac0e] font-bold text-xl mb-4">
            <TrendingUp className="w-6 h-6" />
            <h2>Trending Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingBooks.map((book, index) => (
              <div key={`trending-${book.id}`} className="bg-gradient-to-br from-[#870000] to-[#5a0000] rounded-2xl p-1 shadow-md relative overflow-hidden group cursor-pointer" onClick={() => setSelectedBook(book)}>
                <div className="absolute top-0 right-0 bg-[#f3ac0e] text-[#393214] font-bold px-3 py-1 rounded-bl-lg z-10">
                  #{index + 1}
                </div>
                <div className="bg-white rounded-xl h-full p-5 flex flex-col relative z-0 group-hover:bg-opacity-95 transition-all">
                  <span className="text-xs font-semibold text-[#870000] uppercase tracking-wider mb-2">{book.category}</span>
                  <h3 className="text-lg font-bold text-[#393214] mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{book.author}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
                      <Users className="w-3 h-3 mr-1" />
                      {book.borrowCount || 0} borrows
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${book.status === 'Available' ? 'text-green-700 bg-green-100' : 'text-amber-700 bg-amber-100'}`}>
                      {book.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 space-y-4">
        <div className="flex items-center gap-2 text-[#870000] font-semibold mb-2">
          <Filter className="w-5 h-5" />
          <h2>Filter & Search</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="relative md:col-span-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#870000] focus:border-[#870000] sm:text-sm transition-all shadow-sm"
            />
          </div>
          
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#870000] focus:border-[#870000] sm:text-sm shadow-sm"
            >
              <option value="All" disabled className="text-gray-400">Category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#870000] focus:border-[#870000] sm:text-sm shadow-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Borrowed">Borrowed / In Queue</option>
            </select>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800 shadow-sm animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {book.category}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    book.status === 'Available'
                      ? 'bg-green-100 text-green-800'
                      : book.status === 'Borrowed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {book.status === 'Available' ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {book.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[#393214] mb-2 line-clamp-2">
                {book.title}
              </h3>
              <p className="text-gray-600 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {book.author}
              </p>
              <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">
                {book.description || 'No description available for this book.'}
              </p>
              <div className="text-sm text-gray-500 font-mono bg-gray-50 p-2 rounded-md inline-block">
                ISBN: {book.isbn}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
              <button
                onClick={() => setSelectedBook(book)}
                disabled={book.status !== 'Available' && book.status !== 'Borrowed'}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  book.status === 'Available'
                    ? 'text-[#393214] bg-[#f3ac0e] hover:bg-[#d99a0c] focus:ring-[#f3ac0e]'
                    : book.status === 'Borrowed'
                    ? 'text-white bg-[#870000] hover:bg-[#6b0000] focus:ring-[#870000]'
                    : 'text-gray-500 bg-gray-200'
                }`}
              >
                {book.status === 'Available' ? 'Reserve Book' : book.status === 'Borrowed' ? 'Join Queue' : 'Currently Unavailable'}
              </button>
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-lg">No books found matching your search.</p>
            <p className="text-sm mt-1">Try adjusting your keywords or ISBN.</p>
          </div>
        )}
      </div>

      {selectedBook && (
        <ReservationModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
}
