-- Enable RLS on all new tables and create security policies

-- 1. TIMETABLE
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage timetable"
ON timetable FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view timetable for their classes"
ON timetable FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() AND e.id = timetable.teacher_id
  )
);

-- 2. FEE CATEGORIES
ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee categories"
ON fee_categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view fee categories"
ON fee_categories FOR SELECT
TO authenticated
USING (true);

-- 3. FEE ASSIGNMENTS
ALTER TABLE fee_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee assignments"
ON fee_assignments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents can view their childrens fees"
ON fee_assignments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = fee_assignments.student_id AND s.user_id = auth.uid()
  )
);

-- 4. PAYMENTS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payments"
ON payments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents can view their payments"
ON payments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
    SELECT 1 FROM fee_assignments fa
    INNER JOIN students s ON s.id = fa.student_id
    WHERE fa.id = payments.fee_assignment_id AND s.user_id = auth.uid()
  )
);

-- 5. EXAMS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage exams"
ON exams FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view exams"
ON exams FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 6. EXAM SUBJECTS
ALTER TABLE exam_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage exam subjects"
ON exam_subjects FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view exam subjects"
ON exam_subjects FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 7. MARKS
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage marks"
ON marks FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can enter marks for their subjects"
ON marks FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) AND EXISTS (
    SELECT 1 FROM employees e
    INNER JOIN class_subjects cs ON cs.teacher_id = e.id
    INNER JOIN students s ON s.class_id = cs.class_id
    WHERE e.user_id = auth.uid() AND s.id = marks.student_id
  )
);

CREATE POLICY "Teachers can view marks for their subjects"
ON marks FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'teacher'::app_role) AND EXISTS (
    SELECT 1 FROM employees e
    INNER JOIN class_subjects cs ON cs.teacher_id = e.id
    INNER JOIN students s ON s.class_id = cs.class_id
    WHERE e.user_id = auth.uid() AND s.id = marks.student_id
  ))
);

CREATE POLICY "Parents can view their childrens marks"
ON marks FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = marks.student_id AND s.user_id = auth.uid()
  )
);

-- 8. SYLLABUS TOPICS
ALTER TABLE syllabus_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage syllabus topics"
ON syllabus_topics FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view syllabus topics"
ON syllabus_topics FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 9. SYLLABUS PROGRESS
ALTER TABLE syllabus_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all syllabus progress"
ON syllabus_progress FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage their syllabus progress"
ON syllabus_progress FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() AND e.id = syllabus_progress.teacher_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() AND e.id = syllabus_progress.teacher_id
  )
);

-- 10. BUSES
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage buses"
ON buses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view buses"
ON buses FOR SELECT
TO authenticated
USING (true);

-- 11. BUS ROUTES
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bus routes"
ON bus_routes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view bus routes"
ON bus_routes FOR SELECT
TO authenticated
USING (true);

-- 12. BUS STOPS
ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bus stops"
ON bus_stops FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view bus stops"
ON bus_stops FOR SELECT
TO authenticated
USING (true);

-- 13. STUDENT TRANSPORT
ALTER TABLE student_transport ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student transport"
ON student_transport FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents can view their childrens transport"
ON student_transport FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_transport.student_id AND s.user_id = auth.uid()
  )
);

-- 14. NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Users can view notifications for their role"
ON notifications FOR SELECT
TO authenticated
USING (
  -- Check if user's role is in the target_role array
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text = ANY(notifications.target_role)
  )
);

-- 15. NOTIFICATION READS
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification reads"
ON notification_reads FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 16. QUIZZES
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quizzes"
ON quizzes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage their quizzes"
ON quizzes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() AND e.id = quizzes.teacher_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() AND e.id = quizzes.teacher_id
  )
);

-- 17. QUIZ QUESTIONS
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage quiz questions"
ON quiz_questions FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM quizzes q
    INNER JOIN employees e ON e.id = q.teacher_id
    WHERE q.id = quiz_questions.quiz_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM quizzes q
    INNER JOIN employees e ON e.id = q.teacher_id
    WHERE q.id = quiz_questions.quiz_id AND e.user_id = auth.uid()
  )
);

-- 18. QUIZ ATTEMPTS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their quiz attempts"
ON quiz_attempts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = quiz_attempts.student_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view quiz attempts"
ON quiz_attempts FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM quizzes q
    INNER JOIN employees e ON e.id = q.teacher_id
    WHERE q.id = quiz_attempts.quiz_id AND e.user_id = auth.uid()
  )
);

-- 19. QUIZ ANSWERS
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their quiz answers"
ON quiz_answers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts qa
    INNER JOIN students s ON s.id = qa.student_id
    WHERE qa.id = quiz_answers.attempt_id AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_attempts qa
    INNER JOIN students s ON s.id = qa.student_id
    WHERE qa.id = quiz_answers.attempt_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view and grade quiz answers"
ON quiz_answers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM quiz_attempts qa
    INNER JOIN quizzes q ON q.id = qa.quiz_id
    INNER JOIN employees e ON e.id = q.teacher_id
    WHERE qa.id = quiz_answers.attempt_id AND e.user_id = auth.uid()
  )
);

-- 20. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());