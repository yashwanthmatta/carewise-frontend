# Photography briefs

Written 18 Nov 2026 for the owner's request for photorealistic, clearly illustrative human imagery.

**Status: no photos exist yet.** This session has no image-generation tool. The owner chose not to add a Gemini API key, and the network blocks stock-photo sites. So nothing here has been generated, and nothing on the site pretends otherwise.

The homepage already has the places for the photos, called slots. Until a photo is listed, each slot shows its product illustration.

## How a photo gets onto the site

1. **Produce the image.** It can come from a licensed photographer, a licensed stock photo, or an image generator whose terms allow commercial use (for example Gemini, ChatGPT or Midjourney on a paid plan). Use the prompts below. Keep the original file and a note of the tool, date and prompt.
2. **Check it** against the [quality checklist](#quality-checklist). Reject it rather than fix it if the hands, eyes, teeth or equipment look wrong.
3. **Export it** at the sizes in the table, as AVIF, WebP and JPG. For example, with `npx sharp-cli` or Squoosh:
   - name the files `assets/photos/<slot>-800.avif`, `-1600.avif`, and the same for `.webp` and `.jpg`;
   - aim for under 250 KB for the 1600 px JPG of the hero, and under 180 KB for the others.
4. **List it** in `assets/photos/photos.json`:
   ```json
   { "photos": [
     { "slot": "hero", "base": "assets/photos/hero", "widths": [800, 1600],
       "width": 1600, "height": 700, "position": "60% 40%",
       "alt": "A woman at her kitchen table reading a lab report on a laptop" }
   ] }
   ```
   `photos.js` then shows it with the disclosure line, and the illustration steps aside. A file that fails to load falls back to the illustration.
5. **Run** `node scripts/eval/photo-slots.mjs` and look at the page at 1440, 768 and 390 px.

### The disclosure

Every photo shows a visible line by default: *"Illustrative AI-generated image. Not an actual FollowThrough patient or clinician."*

- For a licensed real photograph, set `"disclosure"` to a credit instead, for example "Photo: Jane Doe / Licensed". Never leave a photo without a line.
- Never caption a person as a patient, clinician, employee, partner or reviewer, and never put a name, quote or star rating next to one.

## Art direction for the whole set

- **One light:** soft daylight from one side, as if from a north-facing window. Gentle shadows, no flash, no ring light.
- **One palette:** warm ivory, oat, sand, clay and muted sage. Skin keeps its true colour. No teal-and-orange grade, no high saturation.
- **One camera feel:** a 35–50 mm lens at eye level, shallow but not extreme depth of field, slight natural grain. It should look like an editorial photograph, not a 3D render.
- **People:** adults of different ages (30s to 70s), ethnicities and body types across the set. Ordinary clothes in muted colours. Relaxed, attentive expressions that are not posed smiles at the camera. No face may appear twice.
- **Screens and paper:** any report or screen is blurred, angled away, or shows only shapes and bars. No legible names, dates of birth, values, diagnoses or logos.
- **Never:** extra or fused fingers, odd teeth or eyes, plastic skin, fake-looking medical kit, a hospital that looks like a film set, gloves on the wrong hands, needles in the wrong place, stock-photo thumbs-up poses.

## The seven images

| # | Slot (where it goes) | Sizes | Status |
|---|---|---|---|
| 1 | `hero`: homepage hero, under the headline | 1600×700 and 800×1000 (phone crop) | Slot built |
| 2 | Understanding results: upload page or demo | 1600×1000 | Not placed yet; the homepage keeps the product preview there |
| 3 | `lab`: lab testing section | 1200×1500 (4:5) | Slot built |
| 4 | `clinician`: "Two kinds of explanation" | 1200×1500 (4:5) | Slot built |
| 5 | Everyday wellness: pricing or final call to action | 1600×1000 | Not placed yet |
| 6 | `reminders`: "Remember the next step" | 1200×1500 (4:5) | Slot built |
| 7 | Family: Family plan and pricing | 1600×1000 | Not placed yet |

### 1. Hero: reading a report at home

Photorealistic editorial photograph. A woman in her late 50s sits at a light oak kitchen table by a large window in soft morning light. She reads a laptop screen with a calm, attentive expression, one hand resting near a mug.

- **Setting and styling:** warm ivory walls, linen, a plant and a ceramic bowl, uncluttered. She wears a sand-coloured knit sweater.
- **Screen:** angled away, showing only soft shapes, with no readable text.
- **Composition:** her face and laptop sit on the right third, leaving calm empty space on the left and top for a headline.
- **Camera:** 35 mm, eye level, natural skin texture, true-to-life hands with five fingers each, subtle film grain.
- **Grade:** muted warm palette of ivory, oat and clay.
- **Avoid:** stock-photo look, oversaturation and visible logos.

Crops: wide 16:7 for desktop. Also produce a 4:5 version with her centred lower, for phones.

### 2. Understanding results: over the shoulder

Photorealistic over-the-shoulder photograph of a man in his 40s on a sofa, holding a tablet that shows an abstract dashboard. The dashboard has only coloured bars and a line chart, with no readable text or numbers.

- **Light and setting:** soft afternoon window light, warm neutral living room, shallow depth of field.
- **Pose:** his hand and thumb are naturally placed on the tablet edge.
- **Grade:** muted sage and sand.
- **Avoid:** fake medical data, logos, legible text and extra fingers.

### 3. Lab testing: getting ready for a routine blood draw

Photorealistic photograph in a clean, modern outpatient blood-draw room with neutral walls and daylight.

- **The professional:** a collection professional in plain navy scrubs and properly worn nitrile gloves.
- **What they are doing:** preparing for a routine draw. They place a tourniquet on the upper arm of a seated adult whose arm rests on a padded armrest.
- **Equipment:** a closed tray with sealed tubes and gauze, medically plausible.
- **Mood:** both people look calm. The patient's face is partly visible, with a relaxed expression.
- **Avoid:** branding, logos and name badges; any needle in skin; blood; exaggerated equipment.
- **Grade:** muted, warm and even.

Disclosure to keep: the default line. This person does not work for FollowThrough, and the room is not a partner site.

### 4. Clinician review: looking at results

Photorealistic photograph of a physician in her 40s in a quiet consulting office, looking thoughtfully at a desktop monitor.

- **Monitor:** turned away, or its screen is soft and unreadable, with no patient details.
- **Styling:** a white coat over a muted blouse, a stethoscope worn naturally, reading glasses in hand.
- **Light and setting:** warm wood desk, soft side light, books and a plant in the background.
- **Mood:** realistic and unposed.
- **Avoid:** name badges, logos, a hospital-drama look and a perfect smile.

Disclosure to keep: the default line. This is not a FollowThrough reviewer.

### 5. Everyday wellness

Photorealistic lifestyle photograph of a man in his late 60s laughing gently while carrying a bag of groceries along a leafy residential street in late-afternoon light.

- **Clothes:** ordinary muted colours.
- **Feel:** candid, mid-step, natural skin and hands.
- **Avoid:** fitness clichés, exaggerated vitality and any implied health outcome.
- **Grade:** warm and muted.

### 6. Follow-up reminders

Photorealistic photograph of a woman in her 30s at a small desk by a window, adding an appointment on her phone, with a paper wall calendar softly out of focus behind her.

- **Phone screen:** angled away, or showing only blocks.
- **Hands:** natural and accurate.
- **Feel:** neutral home office, soft daylight, calm and practical.
- **Avoid:** legible text and logos.

### 7. Family health organisation

Photorealistic photograph of an adult daughter in her 40s and her father in his 70s at a dining table, looking together at a folder of papers. She points at a page, and they are talking calmly.

- **Papers:** blurred, with no legible text.
- **Feel:** warm daylight, lived-in home, natural affection without staged smiles.
- **Avoid:** hospital props and anything that implies a diagnosis.

## Quality checklist

Reject the image if any answer is no.

- Every hand has five fingers that bend the right way, and nothing is fused or melted.
- Eyes look in the same direction, teeth look natural, and ears and glasses sit right.
- The skin has texture, not plastic smoothness.
- Any medical equipment is plausible and used correctly: gloves, tourniquet, tubes, stethoscope.
- No legible text, values, names, logos, badges or brand marks appear anywhere.
- The light and colour match the rest of the set.
- No face repeats across the set.
- The crop works at 16:7 or 4:5 and at the phone crop, with the face clear of the headline and the disclosure line.
- The file size is within budget.
