'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const MOCK_BOOKS = [
  { id: '1', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', category: 'Computer Science', status: 'Available' },
  { id: '2', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Software Engineering', status: 'Available' },
  { id: '3', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780201616224', category: 'Software Engineering', status: 'Borrowed' },
  { id: '4', title: 'Design Patterns', author: 'Erich Gamma', isbn: '9780201633610', category: 'Software Engineering', status: 'Available' },
  { id: '5', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', isbn: '9780136042594', category: 'Computer Science', status: 'Available' },
];

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  
  if (!url || !key) return false;
  if (url.includes('placeholder.supabase.co')) return false;
  if (url.includes('YOUR_SUPABASE_URL')) return false;
  
  return true;
};

export async function getBooks(searchQuery?: string) {
  if (!isSupabaseConfigured()) {
    return MOCK_BOOKS.filter(book => 
      !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(b => ({ ...b, borrowCount: Math.floor(Math.random() * 50) }));
  }

  try {
    let query = supabase.from('books').select('*').order('title');

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch error, falling back to mock data:', error.message || 'Unknown error');
      return MOCK_BOOKS.filter(book => 
        !searchQuery || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(b => ({ ...b, borrowCount: Math.floor(Math.random() * 50) }));
    }

    // Fetch borrow counts for popularity
    const { data: reservations } = await supabase.from('reservations').select('book_id');
    const borrowCounts: Record<string, number> = {};
    reservations?.forEach(r => {
      borrowCounts[r.book_id] = (borrowCounts[r.book_id] || 0) + 1;
    });

    return (data || []).map(book => ({
      ...book,
      borrowCount: borrowCounts[book.id] || 0
    }));
  } catch (err) {
    console.warn('Unexpected error fetching books, falling back to mock data');
    return MOCK_BOOKS.map(b => ({ ...b, borrowCount: Math.floor(Math.random() * 50) }));
  }
}

export async function reserveBook(studentId: string, bookId: string, studentName: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database is not configured. This is a demo version.' };
  }

  try {
    // 1. Check if the student exists, if not create a profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    let userId = profile?.id;

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error(`Database error when checking profile: ${profileError.message}`);
    }

    if (!profile) {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ student_id: studentId, name: studentName }])
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error details:', createError);
        throw new Error(`Failed to create student profile: ${createError.message || createError.details || 'Unknown error'}`);
      }
      userId = newProfile.id;
    }

    // 2. Check if the book is available
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('status')
      .eq('id', bookId)
      .single();

    if (bookError) {
      console.error('Book fetch error:', bookError);
      if (bookError.code === '22P02') {
        throw new Error('Invalid book ID format. Please refresh the page to load the latest data from the database.');
      }
      throw new Error(`Database error when finding book: ${bookError.message}`);
    }

    if (!book) {
      throw new Error('Book not found in the database. Please refresh the page.');
    }

    if (book.status !== 'Available' && book.status !== 'Borrowed') {
      throw new Error('Book is not available for reservation or queuing');
    }

    // 3. Create reservation
    const { error: reserveError } = await supabase
      .from('reservations')
      .insert([
        {
          user_id: userId,
          book_id: bookId,
          status: 'Active',
        },
      ]);

    if (reserveError) {
      if (reserveError.code === '23505') {
        throw new Error('You have already borrowed or queued for this book.');
      }
      throw new Error('Failed to create reservation');
    }

    // 4. Update book status ONLY if it was Available
    if (book.status === 'Available') {
      const { data: updatedBook, error: updateError } = await supabase
        .from('books')
        .update({ status: 'Borrowed' })
        .eq('id', bookId)
        .select();

      if (updateError) {
        throw new Error('Failed to update book status');
      }
      
      if (!updatedBook || updatedBook.length === 0) {
        throw new Error('Database policy restriction: Missing UPDATE policy for books. Please check your Supabase policies.');
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Reservation error:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

export async function cancelOrReturnBook(reservationId: string, studentId: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database is not configured. This is a demo version.' };
  }

  try {
    // 1. Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (profileError || !profile) {
      throw new Error('Student not found');
    }

    // 2. Get the reservation
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('id, book_id, status')
      .eq('id', reservationId)
      .eq('user_id', profile.id)
      .single();

    if (resError || !reservation) {
      throw new Error('Reservation not found or does not belong to you');
    }

    // 3. Get all active reservations for this book to check queue position
    const { data: allRes, error: allResError } = await supabase
      .from('reservations')
      .select('id')
      .eq('book_id', reservation.book_id)
      .eq('status', 'Active')
      .order('reserved_at', { ascending: true });

    if (allResError) throw allResError;

    const isBorrower = allRes && allRes.length > 0 && allRes[0].id === reservationId;
    const hasNextInQueue = allRes && allRes.length > 1;

    // 4. Update reservation status
    const newStatus = isBorrower ? 'Completed' : 'Cancelled';
    const { data: updatedRes, error: updateResError } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', reservationId)
      .select();

    if (updateResError) {
      // Handle the case where the user has borrowed and returned this exact book before
      // which violates the UNIQUE(user_id, book_id, status) constraint
      if (updateResError.code === '23505') {
        // As a workaround for the strict UNIQUE constraint, we'll just delete the reservation
        // instead of marking it as completed/cancelled again.
        const { error: deleteError } = await supabase
          .from('reservations')
          .delete()
          .eq('id', reservationId);
          
        if (deleteError) {
          throw new Error('Failed to return book due to database constraints. Please ask admin to run the fix SQL.');
        }
      } else {
        throw updateResError;
      }
    } else if (!updatedRes || updatedRes.length === 0) {
      throw new Error('Database policy restriction: Missing UPDATE policy for reservations. Please run the SQL command provided in the chat to fix this.');
    }

    // 5. If borrower returned and no one else in queue, make book Available
    if (isBorrower && !hasNextInQueue) {
      const { data: updatedBook, error: updateBookError } = await supabase
        .from('books')
        .update({ status: 'Available' })
        .eq('id', reservation.book_id)
        .select();
        
      if (updateBookError) throw updateBookError;
      
      if (!updatedBook || updatedBook.length === 0) {
        throw new Error('Database policy restriction: Missing UPDATE policy for books. Please check your Supabase policies.');
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Cancel/Return error:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

export async function getStudentReservations(studentId: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database is not configured. This is a demo version.' };
  }

  try {
    // 1. Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, student_id')
      .eq('student_id', studentId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Student ID not found in the system. You may not have borrowed any books yet.' };
    }

    // 2. Get ALL reservations for gamification stats
    const { data: allUserReservations, error: allResError } = await supabase
      .from('reservations')
      .select(`
        id,
        status,
        books (
          category
        )
      `)
      .eq('user_id', profile.id);

    let stats = {
      totalBorrowed: 0,
      csBooks: 0,
      badges: [] as string[]
    };

    if (!allResError && allUserReservations) {
      stats.totalBorrowed = allUserReservations.length;
      stats.csBooks = allUserReservations.filter((r: any) => r.books?.category === 'Computer Science').length;
      
      if (stats.totalBorrowed >= 5) stats.badges.push('Novice Reader');
      if (stats.totalBorrowed >= 20) stats.badges.push('Avid Reader');
      if (stats.csBooks >= 10) stats.badges.push('Tech Wizard');
      if (stats.csBooks >= 5 && stats.csBooks < 10) stats.badges.push('Tech Apprentice');
      
      // Give at least one badge for trying
      if (stats.totalBorrowed > 0 && stats.badges.length === 0) {
        stats.badges.push('Curious Mind');
      }
    }

    // 3. Get active reservations with book details
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select(`
        id,
        reserved_at,
        status,
        books (
          id,
          title,
          category,
          status
        )
      `)
      .eq('user_id', profile.id)
      .eq('status', 'Active')
      .order('reserved_at', { ascending: false });

    if (resError) throw resError;

    if (!reservations || reservations.length === 0) {
      return { success: true, data: [], profile, stats };
    }

    // 4. Determine queue position by fetching all active reservations for these books
    const bookIds = reservations.map((r: any) => r.books.id);
    const { data: allActiveRes } = await supabase
      .from('reservations')
      .select('id, book_id, reserved_at')
      .in('book_id', bookIds)
      .eq('status', 'Active')
      .order('reserved_at', { ascending: true });

    const enrichedReservations = reservations.map((res: any) => {
      const bookRes = allActiveRes?.filter(r => r.book_id === res.books.id) || [];
      const queueIndex = bookRes.findIndex(r => r.id === res.id);

      const isReadyToPickup = queueIndex === 0;
      const queuePosition = queueIndex; // 1 means 1st in queue (after the borrower)

      // Calculate due date: 7 days after they actually borrowed it
      const borrowedDate = new Date(res.reserved_at);
      const dueDate = new Date(borrowedDate);
      dueDate.setDate(dueDate.getDate() + 7);

      return {
        id: res.id,
        book: res.books,
        reservedAt: res.reserved_at,
        isReadyToPickup,
        queuePosition,
        dueDate: isReadyToPickup ? dueDate.toISOString() : null,
      };
    });

    return { success: true, data: enrichedReservations, profile, stats };
  } catch (error: any) {
    console.error('Error fetching student reservations:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}
