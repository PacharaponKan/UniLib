import { getBooks } from './actions';
import BookList from '@/components/BookList';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const books = await getBooks();

  return (
    <main className="min-h-screen bg-white">
      <BookList initialBooks={books || []} />
    </main>
  );
}
