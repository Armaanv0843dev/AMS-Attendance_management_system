-- Attendance Management System (AMS) Database Schema
-- Run this in your Supabase SQL Editor

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  roll_no TEXT NOT NULL UNIQUE,
  email TEXT,
  course TEXT,
  semester TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (for development)
-- WARNING: This is only for development. Use proper auth in production.

CREATE POLICY "Allow public read on students" ON students
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on students" ON students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on students" ON students
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on students" ON students
  FOR DELETE USING (true);

CREATE POLICY "Allow public read on attendance" ON attendance
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on attendance" ON attendance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on attendance" ON attendance
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on attendance" ON attendance
  FOR DELETE USING (true);
