# Design System Document: Technical Precision & Thermal Clarity

## 1. Overview & Creative North Star: "The Arctic Editorial"
This design system moves away from the generic "blue-collar" aesthetic of maintenance services. Instead, it adopts a **Creative North Star** of **"The Arctic Editorial."** 

We are treating a refrigeration estimate not as a form, but as a premium document of technical authority. The design breaks the traditional "box-and-line" template by using intentional asymmetry, generous white space (breathing room), and a sophisticated layering of cool-toned surfaces. The goal is to convey "Precision Cooling" through a layout that feels as crisp and structured as a high-end architectural magazine.

---

## 2. Colors: The Tonal Atmosphere
The palette is rooted in deep structural blues and varying "temperatures" of grey. 

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section off content. Boundaries must be defined through background color shifts.
*   **Example:** A list of parts should sit on a `surface-container-low` (#f2f4f6) background against the main `surface` (#f8f9fb) page, creating a soft edge rather than a hard line.

### Surface Hierarchy & Nesting
Treat the PDF as a series of physical layers. 
*   **Level 0 (Base):** `surface` (#f8f9fb).
*   **Level 1 (Sections):** `surface-container-low` (#f2f4f6) for major content groupings.
*   **Level 2 (Active Cards):** `surface-container-lowest` (#ffffff) for high-priority items like "Total Due" or "Service Summary."

### Signature Textures
*   **The Frost Gradient:** For primary headers or the "Accept Estimate" CTA, use a linear gradient transitioning from `primary` (#003f87) to `primary-container` (#0056b3) at a 135-degree angle. This adds "soul" and depth that flat color cannot provide.

---

## 3. Typography: Editorial Authority
We use a pairing of **Manrope** (Display/Headline) for a modern, geometric feel and **Work Sans** (Body/Labels) for high-legibility technical data.

*   **Display-LG (Manrope, 3.5rem):** Use for the estimate total or the company name 'Fixar'. High-contrast sizing creates an immediate focal point.
*   **Headline-SM (Manrope, 1.5rem):** Used for section headers (e.g., "Service Breakdown").
*   **Body-MD (Work Sans, 0.875rem):** The workhorse for part descriptions and labor notes.
*   **Label-SM (Work Sans, 0.6875rem):** Used for "fine print," serial numbers, and metadata. All labels should use `on-surface-variant` (#424752) to create a clear hierarchy against body text.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are replaced by **Tonal Layering** to maintain a "clean" refrigeration aesthetic.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-highest` (#e0e3e5) header provides a "heavy" base, while `surface-container-lowest` (#ffffff) elements float on top to represent the most current or interactive information.
*   **Ambient Shadows:** If a "floating" effect is needed for a signature block or mobile modal, use a shadow with a 24px blur, 4% opacity, using the `on-surface` (#191c1e) color. It should feel like a soft glow, not a drop shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` (#c2c6d4) at 15% opacity.

---

## 5. Components: The Service Toolkit

### Buttons & CTAs
*   **Primary:** Rounded `xl` (1.5rem), using the Frost Gradient. Text is `on-primary` (#ffffff) in `title-sm`.
*   **Secondary:** Ghost style. No background, `outline` (#727784) at 20% opacity, with `primary` (#003f87) text.

### Estimate Cards & Lists
*   **Forbid Dividers:** Do not use horizontal lines between service items. Instead, use a `1.5` (0.375rem) spacing gap and alternating subtle background tints (`surface-container-low` vs `surface-container-high`).
*   **Service Item Layout:** Use an asymmetrical grid. The part name (Title-MD) on the left, with the price (Headline-SM) anchored to the far right, leaving a wide "void" in the center to emphasize the premium nature of the service.

### Photo Elements (Client/Equipment)
*   **The Circular Crop:** All equipment or client photos must use the `full` (9999px) roundedness scale. 
*   **The Frost Frame:** Wrap photos in a 4px `surface-container-lowest` (#ffffff) frame to make them "pop" against the `surface-container` tiers.

### Input Fields
*   **Technical Entry:** Fields use `surface-container-highest` (#e0e3e5) with no bottom border. When active, the background shifts to `primary-fixed` (#d7e2ff).

---

## 6. Do's and Don'ts

### Do:
*   **Embrace the Void:** Use the `16` (4rem) spacing token for margins. Luxury is defined by the space you *don't* fill.
*   **Use Asymmetry:** Place the Fixar logo on the top left, but anchor the "Estimate Total" on the bottom right to create a diagonal visual flow.
*   **Prioritize Typography:** Let the font sizes do the heavy lifting for hierarchy, not bold colors.

### Don't:
*   **No 100% Black:** Never use #000000. Use `on-surface` (#191c1e) for all "black" text to maintain the cool, professional air.
*   **No Sharp Corners:** Avoid the `none` roundedness setting. Refrigeration is about flow; use at least `sm` (0.25rem) for technical bits and `xl` (1.5rem) for containers.
*   **No "Safety Orange":** Even for errors, use the calibrated `error` (#ba1a1a) and `error_container` (#ffdad6) to ensure the palette remains sophisticated.