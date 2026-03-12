import MyBooksClient from './MyBooksClient';

export const dynamic = 'force-dynamic';

export default function MyBooksPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <MyBooksClient />
    </main>
  );
}
