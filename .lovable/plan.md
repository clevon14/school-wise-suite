
# Handwritten Form Scanner for Student Admission

## Overview
Create a feature that allows staff to upload a photo/scan of a handwritten admission form, use AI vision to extract the data, and automatically populate the digital admission form.

## How It Works

```text
+-------------------+     +------------------+     +-------------------+
|  Upload Photo/    | --> | AI Vision        | --> | Pre-filled Form   |
|  Scan of Form     |     | Extracts Data    |     | Ready for Review  |
+-------------------+     +------------------+     +-------------------+
        |                        |                         |
   Camera/Gallery         Gemini 2.5 Pro            Staff reviews &
   or File Upload         reads handwriting          submits
```

## User Experience

1. **Open Add Student Dialog** - A new "Scan Form" button appears alongside the manual entry option
2. **Upload Image** - User takes a photo or uploads a scanned image of the handwritten form
3. **AI Processing** - System analyzes the image and extracts all readable fields
4. **Review & Edit** - Form fields are pre-populated; user reviews and corrects any misread values
5. **Submit** - User submits the form as normal

## Fields to Extract

The AI will attempt to extract these fields from the handwritten form:

**Student Info**: Name, Admission Number, PEN Number, Aadhar, Gender, Date of Birth, Place of Birth, Village, Taluka, District

**Father's Details**: Name, Living status, Aadhar, Occupation, Qualification, Phone

**Mother's Details**: Name, Living status, Aadhar, Occupation, Qualification, Phone

**Family Info**: Annual Income, Guardian Address, Phone, Email, Nationality, Religion, Caste, Category, Mother Tongue, Languages, Siblings count

**Previous School**: School name, Standards attended, Leaving date, SLC details

**Admission Details**: Class, Standard, Medium

---

## Technical Implementation

### 1. New Edge Function: `scan-admission-form`

Creates a new Supabase Edge Function that:
- Accepts a base64-encoded image of the handwritten form
- Sends it to Gemini 2.5 Pro with vision capabilities
- Uses a structured prompt to extract form fields
- Returns JSON with extracted field values

**Location**: `supabase/functions/scan-admission-form/index.ts`

**Key Features**:
- Uses Lovable AI Gateway (already configured)
- Leverages Gemini's multimodal capabilities for handwriting recognition
- Returns structured JSON matching the form schema
- Includes confidence indicators for uncertain fields

### 2. Frontend Component: `FormScanner`

Creates a new React component for the scanning interface:
- Camera capture option (for mobile devices)
- File upload option (for scanned documents)
- Loading state with progress indicator
- Preview of uploaded image
- Error handling for poor quality images

**Location**: `src/components/forms/FormScanner.tsx`

### 3. Update AddStudentDialog

Modifies the existing student admission form:
- Adds "Scan Handwritten Form" button at the top
- Integrates FormScanner component
- Populates form fields with extracted data
- Highlights fields that need review (low confidence)

### 4. Supabase Config Update

Adds the new edge function to the config:

**Location**: `supabase/config.toml`

```toml
[functions.scan-admission-form]
verify_jwt = false
```

---

## AI Prompt Strategy

The edge function will use a detailed prompt instructing the AI to:

1. Identify and read all handwritten text in the image
2. Map values to specific form fields
3. Handle common handwriting variations
4. Return null for unreadable/missing fields
5. Provide confidence scores where uncertain
6. Parse dates in multiple formats (DD/MM/YYYY, DD-MM-YYYY, etc.)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/scan-admission-form/index.ts` | Create | AI vision processing |
| `src/components/forms/FormScanner.tsx` | Create | Image upload/capture UI |
| `src/components/forms/AddStudentDialog.tsx` | Modify | Add scan button, integrate scanner |
| `supabase/config.toml` | Modify | Register new function |

---

## Limitations & Considerations

1. **Handwriting Quality**: Very poor handwriting may result in errors - users should always review
2. **Form Layout**: Works best with the standard Holy Cross admission form layout
3. **Image Quality**: Better results with clear, well-lit photos/scans
4. **Processing Time**: May take 5-10 seconds depending on image size
5. **API Costs**: Each scan uses AI credits (one API call per form)

---

## Future Enhancements

- Support for multiple form templates
- Batch scanning of multiple forms
- Confidence highlighting (color-code uncertain fields)
- History of scanned forms for audit
- Support for scanning teacher application forms
