-- Delete related data first to avoid foreign key violations
DELETE FROM quiz_answers;
DELETE FROM quiz_attempts;
DELETE FROM quiz_questions;
DELETE FROM quizzes;
DELETE FROM test_results;
DELETE FROM tests;
DELETE FROM marks;
DELETE FROM attendance;
DELETE FROM payments;
DELETE FROM fee_assignments;
DELETE FROM student_transport;
DELETE FROM syllabus_progress;
DELETE FROM employee_attendance;
DELETE FROM notifications;
DELETE FROM documents;
DELETE FROM class_subjects;

-- Now delete the main tables
DELETE FROM students;
DELETE FROM employees;