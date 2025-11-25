-- Seed data for SchoolCare

-- Insert 3 classes
INSERT INTO public.classes (name, section, academic_year) VALUES
('Grade 1', 'A', '2024-2025'),
('Grade 2', 'B', '2024-2025'),
('Grade 3', 'C', '2024-2025');

-- Get class IDs for later use (stored in variables)
DO $$
DECLARE
  class1_id uuid;
  class2_id uuid;
  class3_id uuid;
BEGIN
  -- Get class IDs
  SELECT id INTO class1_id FROM public.classes WHERE name = 'Grade 1' AND section = 'A' LIMIT 1;
  SELECT id INTO class2_id FROM public.classes WHERE name = 'Grade 2' AND section = 'B' LIMIT 1;
  SELECT id INTO class3_id FROM public.classes WHERE name = 'Grade 3' AND section = 'C' LIMIT 1;

  -- Insert 10 teachers
  INSERT INTO public.employees (employee_number, first_name, last_name, email, phone, gender, department, role, hire_date, status) VALUES
  ('EMP001', 'Sarah', 'Johnson', 'sarah.johnson@schoolcare.edu', '+1234567001', 'female', 'Mathematics', 'teacher', '2020-08-15', 'active'),
  ('EMP002', 'Michael', 'Smith', 'michael.smith@schoolcare.edu', '+1234567002', 'male', 'Science', 'teacher', '2019-07-20', 'active'),
  ('EMP003', 'Emily', 'Davis', 'emily.davis@schoolcare.edu', '+1234567003', 'female', 'English', 'teacher', '2021-09-01', 'active'),
  ('EMP004', 'James', 'Wilson', 'james.wilson@schoolcare.edu', '+1234567004', 'male', 'History', 'teacher', '2018-06-10', 'active'),
  ('EMP005', 'Lisa', 'Anderson', 'lisa.anderson@schoolcare.edu', '+1234567005', 'female', 'Art', 'teacher', '2022-01-15', 'active'),
  ('EMP006', 'Robert', 'Martinez', 'robert.martinez@schoolcare.edu', '+1234567006', 'male', 'Physical Education', 'teacher', '2020-03-20', 'active'),
  ('EMP007', 'Jennifer', 'Garcia', 'jennifer.garcia@schoolcare.edu', '+1234567007', 'female', 'Music', 'teacher', '2021-04-10', 'active'),
  ('EMP008', 'David', 'Rodriguez', 'david.rodriguez@schoolcare.edu', '+1234567008', 'male', 'Computer Science', 'teacher', '2019-11-05', 'active'),
  ('EMP009', 'Maria', 'Brown', 'maria.brown@schoolcare.edu', '+1234567009', 'female', 'Languages', 'teacher', '2020-02-14', 'active'),
  ('EMP010', 'William', 'Taylor', 'william.taylor@schoolcare.edu', '+1234567010', 'male', 'Administration', 'principal', '2015-01-01', 'active');

  -- Insert 120 students (40 per class)
  -- Class 1 students (40)
  INSERT INTO public.students (admission_number, first_name, last_name, date_of_birth, gender, class_id, parent_name, parent_email, parent_phone, status) VALUES
  ('STU001', 'Liam', 'Anderson', '2017-03-15', 'male', class1_id, 'John Anderson', 'john.anderson@email.com', '+1234560001', 'active'),
  ('STU002', 'Emma', 'Thomas', '2017-05-20', 'female', class1_id, 'Mary Thomas', 'mary.thomas@email.com', '+1234560002', 'active'),
  ('STU003', 'Noah', 'Jackson', '2017-02-10', 'male', class1_id, 'Robert Jackson', 'robert.jackson@email.com', '+1234560003', 'active'),
  ('STU004', 'Olivia', 'White', '2017-07-25', 'female', class1_id, 'Sarah White', 'sarah.white@email.com', '+1234560004', 'active'),
  ('STU005', 'Ethan', 'Harris', '2017-01-30', 'male', class1_id, 'Michael Harris', 'michael.harris@email.com', '+1234560005', 'active'),
  ('STU006', 'Ava', 'Martin', '2017-04-18', 'female', class1_id, 'Jennifer Martin', 'jennifer.martin@email.com', '+1234560006', 'active'),
  ('STU007', 'Mason', 'Thompson', '2017-06-12', 'male', class1_id, 'David Thompson', 'david.thompson@email.com', '+1234560007', 'active'),
  ('STU008', 'Sophia', 'Garcia', '2017-08-05', 'female', class1_id, 'Lisa Garcia', 'lisa.garcia@email.com', '+1234560008', 'active'),
  ('STU009', 'Lucas', 'Martinez', '2017-09-22', 'male', class1_id, 'Carlos Martinez', 'carlos.martinez@email.com', '+1234560009', 'active'),
  ('STU010', 'Isabella', 'Robinson', '2017-03-08', 'female', class1_id, 'Patricia Robinson', 'patricia.robinson@email.com', '+1234560010', 'active'),
  ('STU011', 'Oliver', 'Clark', '2017-05-14', 'male', class1_id, 'James Clark', 'james.clark@email.com', '+1234560011', 'active'),
  ('STU012', 'Mia', 'Rodriguez', '2017-07-19', 'female', class1_id, 'Maria Rodriguez', 'maria.rodriguez@email.com', '+1234560012', 'active'),
  ('STU013', 'Elijah', 'Lewis', '2017-02-28', 'male', class1_id, 'William Lewis', 'william.lewis@email.com', '+1234560013', 'active'),
  ('STU014', 'Charlotte', 'Lee', '2017-04-16', 'female', class1_id, 'Linda Lee', 'linda.lee@email.com', '+1234560014', 'active'),
  ('STU015', 'Benjamin', 'Walker', '2017-06-30', 'male', class1_id, 'Thomas Walker', 'thomas.walker@email.com', '+1234560015', 'active'),
  ('STU016', 'Amelia', 'Hall', '2017-08-11', 'female', class1_id, 'Barbara Hall', 'barbara.hall@email.com', '+1234560016', 'active'),
  ('STU017', 'James', 'Allen', '2017-01-25', 'male', class1_id, 'Richard Allen', 'richard.allen@email.com', '+1234560017', 'active'),
  ('STU018', 'Harper', 'Young', '2017-03-20', 'female', class1_id, 'Nancy Young', 'nancy.young@email.com', '+1234560018', 'active'),
  ('STU019', 'Alexander', 'King', '2017-05-07', 'male', class1_id, 'Daniel King', 'daniel.king@email.com', '+1234560019', 'active'),
  ('STU020', 'Evelyn', 'Wright', '2017-07-15', 'female', class1_id, 'Susan Wright', 'susan.wright@email.com', '+1234560020', 'active'),
  ('STU021', 'Henry', 'Lopez', '2017-09-03', 'male', class1_id, 'Jose Lopez', 'jose.lopez@email.com', '+1234560021', 'active'),
  ('STU022', 'Abigail', 'Hill', '2017-02-18', 'female', class1_id, 'Betty Hill', 'betty.hill@email.com', '+1234560022', 'active'),
  ('STU023', 'Sebastian', 'Scott', '2017-04-25', 'male', class1_id, 'Paul Scott', 'paul.scott@email.com', '+1234560023', 'active'),
  ('STU024', 'Emily', 'Green', '2017-06-08', 'female', class1_id, 'Karen Green', 'karen.green@email.com', '+1234560024', 'active'),
  ('STU025', 'Jack', 'Adams', '2017-08-20', 'male', class1_id, 'Mark Adams', 'mark.adams@email.com', '+1234560025', 'active'),
  ('STU026', 'Ella', 'Baker', '2017-01-12', 'female', class1_id, 'Helen Baker', 'helen.baker@email.com', '+1234560026', 'active'),
  ('STU027', 'Owen', 'Nelson', '2017-03-28', 'male', class1_id, 'Steven Nelson', 'steven.nelson@email.com', '+1234560027', 'active'),
  ('STU028', 'Scarlett', 'Carter', '2017-05-19', 'female', class1_id, 'Dorothy Carter', 'dorothy.carter@email.com', '+1234560028', 'active'),
  ('STU029', 'Daniel', 'Mitchell', '2017-07-06', 'male', class1_id, 'Kenneth Mitchell', 'kenneth.mitchell@email.com', '+1234560029', 'active'),
  ('STU030', 'Victoria', 'Perez', '2017-09-14', 'female', class1_id, 'Sandra Perez', 'sandra.perez@email.com', '+1234560030', 'active'),
  ('STU031', 'Matthew', 'Roberts', '2017-02-22', 'male', class1_id, 'Brian Roberts', 'brian.roberts@email.com', '+1234560031', 'active'),
  ('STU032', 'Grace', 'Turner', '2017-04-09', 'female', class1_id, 'Donna Turner', 'donna.turner@email.com', '+1234560032', 'active'),
  ('STU033', 'Jackson', 'Phillips', '2017-06-17', 'male', class1_id, 'George Phillips', 'george.phillips@email.com', '+1234560033', 'active'),
  ('STU034', 'Chloe', 'Campbell', '2017-08-28', 'female', class1_id, 'Carol Campbell', 'carol.campbell@email.com', '+1234560034', 'active'),
  ('STU035', 'Samuel', 'Parker', '2017-01-05', 'male', class1_id, 'Ronald Parker', 'ronald.parker@email.com', '+1234560035', 'active'),
  ('STU036', 'Lily', 'Evans', '2017-03-12', 'female', class1_id, 'Michelle Evans', 'michelle.evans@email.com', '+1234560036', 'active'),
  ('STU037', 'David', 'Edwards', '2017-05-26', 'male', class1_id, 'Kevin Edwards', 'kevin.edwards@email.com', '+1234560037', 'active'),
  ('STU038', 'Zoey', 'Collins', '2017-07-31', 'female', class1_id, 'Emily Collins', 'emily.collins@email.com', '+1234560038', 'active'),
  ('STU039', 'Joseph', 'Stewart', '2017-09-18', 'male', class1_id, 'Jason Stewart', 'jason.stewart@email.com', '+1234560039', 'active'),
  ('STU040', 'Aria', 'Morris', '2017-02-05', 'female', class1_id, 'Ruth Morris', 'ruth.morris@email.com', '+1234560040', 'active');

  -- Class 2 students (40)
  INSERT INTO public.students (admission_number, first_name, last_name, date_of_birth, gender, class_id, parent_name, parent_email, parent_phone, status) VALUES
  ('STU041', 'Carter', 'Rogers', '2016-03-15', 'male', class2_id, 'Eric Rogers', 'eric.rogers@email.com', '+1234560041', 'active'),
  ('STU042', 'Layla', 'Reed', '2016-05-20', 'female', class2_id, 'Laura Reed', 'laura.reed@email.com', '+1234560042', 'active'),
  ('STU043', 'Wyatt', 'Cook', '2016-02-10', 'male', class2_id, 'Frank Cook', 'frank.cook@email.com', '+1234560043', 'active'),
  ('STU044', 'Penelope', 'Morgan', '2016-07-25', 'female', class2_id, 'Deborah Morgan', 'deborah.morgan@email.com', '+1234560044', 'active'),
  ('STU045', 'Luke', 'Bell', '2016-01-30', 'male', class2_id, 'Gary Bell', 'gary.bell@email.com', '+1234560045', 'active'),
  ('STU046', 'Nora', 'Murphy', '2016-04-18', 'female', class2_id, 'Sharon Murphy', 'sharon.murphy@email.com', '+1234560046', 'active'),
  ('STU047', 'Grayson', 'Bailey', '2016-06-12', 'male', class2_id, 'Larry Bailey', 'larry.bailey@email.com', '+1234560047', 'active'),
  ('STU048', 'Hannah', 'Rivera', '2016-08-05', 'female', class2_id, 'Angela Rivera', 'angela.rivera@email.com', '+1234560048', 'active'),
  ('STU049', 'Julian', 'Cooper', '2016-09-22', 'male', class2_id, 'Nicholas Cooper', 'nicholas.cooper@email.com', '+1234560049', 'active'),
  ('STU050', 'Addison', 'Richardson', '2016-03-08', 'female', class2_id, 'Kimberly Richardson', 'kimberly.richardson@email.com', '+1234560050', 'active'),
  ('STU051', 'Lincoln', 'Cox', '2016-05-14', 'male', class2_id, 'Timothy Cox', 'timothy.cox@email.com', '+1234560051', 'active'),
  ('STU052', 'Eleanor', 'Howard', '2016-07-19', 'female', class2_id, 'Melissa Howard', 'melissa.howard@email.com', '+1234560052', 'active'),
  ('STU053', 'Maverick', 'Ward', '2016-02-28', 'male', class2_id, 'Scott Ward', 'scott.ward@email.com', '+1234560053', 'active'),
  ('STU054', 'Luna', 'Torres', '2016-04-16', 'female', class2_id, 'Christine Torres', 'christine.torres@email.com', '+1234560054', 'active'),
  ('STU055', 'Isaiah', 'Peterson', '2016-06-30', 'male', class2_id, 'Jeffrey Peterson', 'jeffrey.peterson@email.com', '+1234560055', 'active'),
  ('STU056', 'Stella', 'Gray', '2016-08-11', 'female', class2_id, 'Janet Gray', 'janet.gray@email.com', '+1234560056', 'active'),
  ('STU057', 'Levi', 'Ramirez', '2016-01-25', 'male', class2_id, 'Ryan Ramirez', 'ryan.ramirez@email.com', '+1234560057', 'active'),
  ('STU058', 'Violet', 'James', '2016-03-20', 'female', class2_id, 'Rachel James', 'rachel.james@email.com', '+1234560058', 'active'),
  ('STU059', 'Hudson', 'Watson', '2016-05-07', 'male', class2_id, 'Jacob Watson', 'jacob.watson@email.com', '+1234560059', 'active'),
  ('STU060', 'Aurora', 'Brooks', '2016-07-15', 'female', class2_id, 'Amy Brooks', 'amy.brooks@email.com', '+1234560060', 'active'),
  ('STU061', 'Leo', 'Kelly', '2016-09-03', 'male', class2_id, 'Justin Kelly', 'justin.kelly@email.com', '+1234560061', 'active'),
  ('STU062', 'Savannah', 'Sanders', '2016-02-18', 'female', class2_id, 'Katherine Sanders', 'katherine.sanders@email.com', '+1234560062', 'active'),
  ('STU063', 'Asher', 'Price', '2016-04-25', 'male', class2_id, 'Douglas Price', 'douglas.price@email.com', '+1234560063', 'active'),
  ('STU064', 'Hazel', 'Bennett', '2016-06-08', 'female', class2_id, 'Jacqueline Bennett', 'jacqueline.bennett@email.com', '+1234560064', 'active'),
  ('STU065', 'Mateo', 'Wood', '2016-08-20', 'male', class2_id, 'Henry Wood', 'henry.wood@email.com', '+1234560065', 'active'),
  ('STU066', 'Brooklyn', 'Barnes', '2016-01-12', 'female', class2_id, 'Virginia Barnes', 'virginia.barnes@email.com', '+1234560066', 'active'),
  ('STU067', 'Ezra', 'Ross', '2016-03-28', 'male', class2_id, 'Peter Ross', 'peter.ross@email.com', '+1234560067', 'active'),
  ('STU068', 'Claire', 'Henderson', '2016-05-19', 'female', class2_id, 'Gloria Henderson', 'gloria.henderson@email.com', '+1234560068', 'active'),
  ('STU069', 'Jaxon', 'Coleman', '2016-07-06', 'male', class2_id, 'Carl Coleman', 'carl.coleman@email.com', '+1234560069', 'active'),
  ('STU070', 'Skylar', 'Jenkins', '2016-09-14', 'female', class2_id, 'Teresa Jenkins', 'teresa.jenkins@email.com', '+1234560070', 'active'),
  ('STU071', 'Adrian', 'Perry', '2016-02-22', 'male', class2_id, 'Arthur Perry', 'arthur.perry@email.com', '+1234560071', 'active'),
  ('STU072', 'Paisley', 'Powell', '2016-04-09', 'female', class2_id, 'Julia Powell', 'julia.powell@email.com', '+1234560072', 'active'),
  ('STU073', 'Axel', 'Long', '2016-06-17', 'male', class2_id, 'Harold Long', 'harold.long@email.com', '+1234560073', 'active'),
  ('STU074', 'Audrey', 'Patterson', '2016-08-28', 'female', class2_id, 'Carolyn Patterson', 'carolyn.patterson@email.com', '+1234560074', 'active'),
  ('STU075', 'Colton', 'Hughes', '2016-01-05', 'male', class2_id, 'Roger Hughes', 'roger.hughes@email.com', '+1234560075', 'active'),
  ('STU076', 'Lucy', 'Flores', '2016-03-12', 'female', class2_id, 'Diane Flores', 'diane.flores@email.com', '+1234560076', 'active'),
  ('STU077', 'Cameron', 'Washington', '2016-05-26', 'male', class2_id, 'Joe Washington', 'joe.washington@email.com', '+1234560077', 'active'),
  ('STU078', 'Ellie', 'Butler', '2016-07-31', 'female', class2_id, 'Alice Butler', 'alice.butler@email.com', '+1234560078', 'active'),
  ('STU079', 'Nathan', 'Simmons', '2016-09-18', 'male', class2_id, 'Gerald Simmons', 'gerald.simmons@email.com', '+1234560079', 'active'),
  ('STU080', 'Madelyn', 'Foster', '2016-02-05', 'female', class2_id, 'Judith Foster', 'judith.foster@email.com', '+1234560080', 'active');

  -- Class 3 students (40)
  INSERT INTO public.students (admission_number, first_name, last_name, date_of_birth, gender, class_id, parent_name, parent_email, parent_phone, status) VALUES
  ('STU081', 'Connor', 'Gonzales', '2015-03-15', 'male', class3_id, 'Keith Gonzales', 'keith.gonzales@email.com', '+1234560081', 'active'),
  ('STU082', 'Aaliyah', 'Bryant', '2015-05-20', 'female', class3_id, 'Anna Bryant', 'anna.bryant@email.com', '+1234560082', 'active'),
  ('STU083', 'Thomas', 'Alexander', '2015-02-10', 'male', class3_id, 'Wayne Alexander', 'wayne.alexander@email.com', '+1234560083', 'active'),
  ('STU084', 'Piper', 'Russell', '2015-07-25', 'female', class3_id, 'Sara Russell', 'sara.russell@email.com', '+1234560084', 'active'),
  ('STU085', 'Charles', 'Griffin', '2015-01-30', 'male', class3_id, 'Ralph Griffin', 'ralph.griffin@email.com', '+1234560085', 'active'),
  ('STU086', 'Ruby', 'Diaz', '2015-04-18', 'female', class3_id, 'Pamela Diaz', 'pamela.diaz@email.com', '+1234560086', 'active'),
  ('STU087', 'Caleb', 'Hayes', '2015-06-12', 'male', class3_id, 'Randy Hayes', 'randy.hayes@email.com', '+1234560087', 'active'),
  ('STU088', 'Bella', 'Myers', '2015-08-05', 'female', class3_id, 'Kathleen Myers', 'kathleen.myers@email.com', '+1234560088', 'active'),
  ('STU089', 'Ryan', 'Ford', '2015-09-22', 'male', class3_id, 'Eugene Ford', 'eugene.ford@email.com', '+1234560089', 'active'),
  ('STU090', 'Anna', 'Hamilton', '2015-03-08', 'female', class3_id, 'Janice Hamilton', 'janice.hamilton@email.com', '+1234560090', 'active'),
  ('STU091', 'Josiah', 'Graham', '2015-05-14', 'male', class3_id, 'Russell Graham', 'russell.graham@email.com', '+1234560091', 'active'),
  ('STU092', 'Natalie', 'Sullivan', '2015-07-19', 'female', class3_id, 'Marie Sullivan', 'marie.sullivan@email.com', '+1234560092', 'active'),
  ('STU093', 'Dominic', 'Wallace', '2015-02-28', 'male', class3_id, 'Louis Wallace', 'louis.wallace@email.com', '+1234560093', 'active'),
  ('STU094', 'Sadie', 'Woods', '2015-04-16', 'female', class3_id, 'Frances Woods', 'frances.woods@email.com', '+1234560094', 'active'),
  ('STU095', 'Ian', 'Cole', '2015-06-30', 'male', class3_id, 'Albert Cole', 'albert.cole@email.com', '+1234560095', 'active'),
  ('STU096', 'Ivy', 'West', '2015-08-11', 'female', class3_id, 'Theresa West', 'theresa.west@email.com', '+1234560096', 'active'),
  ('STU097', 'Brayden', 'Jordan', '2015-01-25', 'male', class3_id, 'Johnny Jordan', 'johnny.jordan@email.com', '+1234560097', 'active'),
  ('STU098', 'Kennedy', 'Owens', '2015-03-20', 'female', class3_id, 'Beverly Owens', 'beverly.owens@email.com', '+1234560098', 'active'),
  ('STU099', 'Gavin', 'Reynolds', '2015-05-07', 'male', class3_id, 'Billy Reynolds', 'billy.reynolds@email.com', '+1234560099', 'active'),
  ('STU100', 'Alice', 'Fisher', '2015-07-15', 'female', class3_id, 'Cheryl Fisher', 'cheryl.fisher@email.com', '+1234560100', 'active'),
  ('STU101', 'Easton', 'Ellis', '2015-09-03', 'male', class3_id, 'Willie Ellis', 'willie.ellis@email.com', '+1234560101', 'active'),
  ('STU102', 'Autumn', 'Marshall', '2015-02-18', 'female', class3_id, 'Doris Marshall', 'doris.marshall@email.com', '+1234560102', 'active'),
  ('STU103', 'Bryson', 'Romero', '2015-04-25', 'male', class3_id, 'Clarence Romero', 'clarence.romero@email.com', '+1234560103', 'active'),
  ('STU104', 'Quinn', 'Mcdonald', '2015-06-08', 'female', class3_id, 'Marilyn Mcdonald', 'marilyn.mcdonald@email.com', '+1234560104', 'active'),
  ('STU105', 'Miles', 'Garrett', '2015-08-20', 'male', class3_id, 'Roy Garrett', 'roy.garrett@email.com', '+1234560105', 'active'),
  ('STU106', 'Sophie', 'Cruz', '2015-01-12', 'female', class3_id, 'Joyce Cruz', 'joyce.cruz@email.com', '+1234560106', 'active'),
  ('STU107', 'Xavier', 'Ortiz', '2015-03-28', 'male', class3_id, 'Jesse Ortiz', 'jesse.ortiz@email.com', '+1234560107', 'active'),
  ('STU108', 'Valentina', 'Gomez', '2015-05-19', 'female', class3_id, 'Evelyn Gomez', 'evelyn.gomez@email.com', '+1234560108', 'active'),
  ('STU109', 'Eli', 'Murray', '2015-07-06', 'male', class3_id, 'Philip Murray', 'philip.murray@email.com', '+1234560109', 'active'),
  ('STU110', 'Genesis', 'Freeman', '2015-09-14', 'female', class3_id, 'Judy Freeman', 'judy.freeman@email.com', '+1234560110', 'active'),
  ('STU111', 'Jeremiah', 'Wells', '2015-02-22', 'male', class3_id, 'Howard Wells', 'howard.wells@email.com', '+1234560111', 'active'),
  ('STU112', 'Willow', 'Webb', '2015-04-09', 'female', class3_id, 'Irene Webb', 'irene.webb@email.com', '+1234560112', 'active'),
  ('STU113', 'Kai', 'Simpson', '2015-06-17', 'male', class3_id, 'Lawrence Simpson', 'lawrence.simpson@email.com', '+1234560113', 'active'),
  ('STU114', 'Athena', 'Stevens', '2015-08-28', 'female', class3_id, 'Denise Stevens', 'denise.stevens@email.com', '+1234560114', 'active'),
  ('STU115', 'Carson', 'Tucker', '2015-01-05', 'male', class3_id, 'Terry Tucker', 'terry.tucker@email.com', '+1234560115', 'active'),
  ('STU116', 'Isabelle', 'Porter', '2015-03-12', 'female', class3_id, 'Catherine Porter', 'catherine.porter@email.com', '+1234560116', 'active'),
  ('STU117', 'Silas', 'Hunter', '2015-05-26', 'male', class3_id, 'Samuel Hunter', 'samuel.hunter@email.com', '+1234560117', 'active'),
  ('STU118', 'Elena', 'Hicks', '2015-07-31', 'female', class3_id, 'Lois Hicks', 'lois.hicks@email.com', '+1234560118', 'active'),
  ('STU119', 'Micah', 'Crawford', '2015-09-18', 'male', class3_id, 'Dennis Crawford', 'dennis.crawford@email.com', '+1234560119', 'active'),
  ('STU120', 'Serenity', 'Henry', '2015-02-05', 'female', class3_id, 'Phyllis Henry', 'phyllis.henry@email.com', '+1234560120', 'active');

END $$;