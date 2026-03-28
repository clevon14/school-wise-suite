
INSERT INTO subjects (name, code, description) VALUES
  ('Kannada', 'KAN', 'First Language - Kannada literature and grammar (Karnataka state language)'),
  ('English', 'ENG', 'Second/Third Language - English language, literature and grammar'),
  ('Hindi', 'HIN', 'Third Language - Hindi language and literature'),
  ('Sanskrit', 'SAN', 'Third Language - Sanskrit language and literature'),
  ('Urdu', 'URD', 'First/Third Language - Urdu language and literature'),
  ('Mathematics', 'MATH', 'Arithmetic, Algebra, Geometry, Trigonometry and Data Handling'),
  ('Environmental Studies', 'EVS', 'Integrated approach to Science and Social Studies (Classes 1-5)'),
  ('Science', 'SCI', 'General Science - Physics, Chemistry and Biology (Classes 6-10)'),
  ('Social Science', 'SST', 'History, Civics, Geography, Economics and Sociology'),
  ('Physical Education', 'PE', 'Health, fitness and sports education'),
  ('Art Education', 'ART', 'Drawing, painting and creative arts'),
  ('Value Education', 'VE', 'Moral values, ethics and life skills'),
  ('Information Technology', 'IT', 'Computer fundamentals and digital literacy (NSQF vocational)'),
  ('Retail', 'RET', 'Retail management vocational subject (NSQF scheme)'),
  ('Automobile', 'AUTO', 'Automobile technology vocational subject (NSQF scheme)')
ON CONFLICT DO NOTHING;
