
DO $$
DECLARE
  c1  uuid := 'f9c6e26d-57bc-4958-8a63-a625e98db204'; -- Class 1
  c2  uuid := '5852bbc3-b0d9-40a8-adb4-ace47b90fa73'; -- Class 2
  c3  uuid := '904f97ce-71b4-4fb2-8615-382f680de267'; -- Class 3
  c4  uuid := 'fb198f0c-3948-449e-b5e2-8e5ac997aae2'; -- Class 4
  c5  uuid := 'cdbf6139-5b05-4bb9-9a49-3e6cfc3dd717'; -- Class 5
  c6  uuid := '8187f3e9-4912-48b9-a584-e7197b05d3bc'; -- Class 6
  c7  uuid := '2da365c8-0c19-4b47-9614-fd8cfb980953'; -- Class 7
  c8  uuid := '744f0f33-bcee-4b25-a30a-153f6181bf4b'; -- Class 8
  c9  uuid := 'b312438a-823b-4605-be12-e2d845fd3a2b'; -- Class 9
  c10 uuid := 'b2231b12-b00f-44a4-8c80-526f5e2f9c20'; -- Class 10
  pairs uuid[][] := ARRAY[
    ARRAY[c9,  c10],
    ARRAY[c8,  c9 ],
    ARRAY[c7,  c8 ],
    ARRAY[c6,  c7 ],
    ARRAY[c5,  c6 ],
    ARRAY[c4,  c5 ],
    ARRAY[c3,  c4 ],
    ARRAY[c2,  c3 ],
    ARRAY[c1,  c2 ]
  ];
  i int;
  v_from uuid;
  v_to uuid;
BEGIN
  FOR i IN 1 .. array_length(pairs, 1) LOOP
    v_from := pairs[i][1];
    v_to   := pairs[i][2];

    INSERT INTO public.promotion_history
      (student_id, from_class_id, to_class_id, action, academic_year, school_id, notes)
    SELECT s.id, v_from, v_to, 'promote', '2026-2027', s.school_id,
           'Annual promotion to AY 2026-2027'
    FROM public.students s
    WHERE s.class_id = v_from AND s.status = 'active';

    UPDATE public.students
    SET class_id = v_to, updated_at = now()
    WHERE class_id = v_from AND status = 'active';
  END LOOP;

  UPDATE public.classes SET academic_year = '2026-2027', updated_at = now();
END $$;
