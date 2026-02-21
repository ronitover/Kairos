-- Add email column to students. Required for admin student list and reset password.
-- Run this in Supabase SQL Editor if you get "column students.email does not exist".
-- Emails are synced from Auth (student register/login) into this column.
alter table students add column if not exists email varchar(255);
