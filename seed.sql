-- Insert mock books
INSERT INTO public.books (title, author, isbn, category, status) VALUES
  ('Introduction to Algorithms', 'Thomas H. Cormen', '9780262033848', 'Computer Science', 'Available'),
  ('Clean Code', 'Robert C. Martin', '9780132350884', 'Software Engineering', 'Available'),
  ('The Pragmatic Programmer', 'Andrew Hunt', '9780201616224', 'Software Engineering', 'Borrowed'),
  ('Design Patterns', 'Erich Gamma', '9780201633610', 'Software Engineering', 'Available'),
  ('Artificial Intelligence: A Modern Approach', 'Stuart Russell', '9780136042594', 'Computer Science', 'Available'),
  ('Database System Concepts', 'Abraham Silberschatz', '9780073523323', 'Database', 'Available'),
  ('Computer Networking: A Top-Down Approach', 'James Kurose', '9780132856201', 'Networking', 'Available'),
  ('Operating System Concepts', 'Abraham Silberschatz', '9781118063330', 'Computer Science', 'Available'),
  ('Structure and Interpretation of Computer Programs', 'Harold Abelson', '9780262510875', 'Computer Science', 'Available'),
  ('Code Complete', 'Steve McConnell', '9780735619678', 'Software Engineering', 'Available');

-- Insert mock profiles
INSERT INTO public.profiles (student_id, name) VALUES
  ('S1234567', 'Alice Smith'),
  ('S7654321', 'Bob Johnson');
