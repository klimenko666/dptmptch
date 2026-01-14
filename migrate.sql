-- Migration script to add new columns to existing database
-- Run this if you get 500 errors on /api/employer/vacancies

-- Add work_days column to vacancies table
ALTER TABLE vacancies ADD COLUMN work_days TEXT;

-- Add address column to vacancies table
ALTER TABLE vacancies ADD COLUMN address TEXT;

-- Verify the changes
.schema vacancies