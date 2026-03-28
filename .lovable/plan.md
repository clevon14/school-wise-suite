

## Plan: Enrich KSEAB Curriculum with Official KCF 2007 Data

### What we have now
- `KSEABCurriculum.tsx`: A static card with basic subject lists for 4 stages (Foundational, Preparatory, Middle, Secondary)
- The Subjects page shows this component below the subjects table

### What the PDF adds
The KCF 2007 document provides official details on:
1. **Three-language formula** with specific combinations (First/Second/Third language options table)
2. **Stage-wise learning objectives** for each subject area (not just subject names)
3. **Subject-specific pedagogy guidelines** (Math, Science, Social Science, Languages)
4. **Marks distribution** for SSLC (already partially covered)
5. **Culture education integration** and vocational education details

### Implementation

**1. Update `src/components/subjects/KSEABCurriculum.tsx`**
- Add a new "Language Policy" section showing the official three-language formula table from the PDF (First Language / Second Language / Third Language combinations A, B, C)
- Add brief learning objectives per stage per subject (e.g., Math: "observation, intuition, hypothesizing" for science; "think and reason, visualize abstractions" for math)
- Make it tabbed: "Subject Structure" | "Language Policy" | "Guidelines" so it doesn't overwhelm the page

**2. Store the PDF as a reference asset**
- Copy the PDF to `public/documents/KCF2007-EngVer.pdf`
- Add a "Download Full KCF 2007 Document" link in the curriculum component so administrators can reference the official source

**3. Enhance the curriculum data structure**
- Add `learningObjectives` array to each stage in `curriculumData`
- Add a `languagePolicy` data object with the three combination rows (A, B, C) from the PDF's language table
- Add a `guidelines` section with key curriculum revision principles from Chapter 3

### Files to modify
- `src/components/subjects/KSEABCurriculum.tsx` — Add tabs, language policy table, learning objectives, and PDF download link
- Copy PDF to `public/documents/`

### Scope
This is a UI-only enhancement using static data extracted from the PDF. No database changes needed.

