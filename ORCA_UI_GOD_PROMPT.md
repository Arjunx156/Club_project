# ORCA Club Portal — UI Overhaul God Prompt

**Project:** Odyssey Research & Club of AI — Student Club Member Portal  
**Stack:** Flask + Supabase, single-page app — `index.html`, `style.css`, `app.js`  
**Scope:** Complete visual and typographic overhaul. No logic changes. No structural changes to JS functionality. Pure UI transformation.

---

## THE BRIEF

This is a complete visual identity reset. The current interface is loud, over-decorated, and aesthetically inconsistent — animated blobs floating in the background, particle effects, rainbow-colored badges, gradient glow shadows on every card, three accent colors fighting for attention, and emoji icons embedded in navigation. It looks like a hackathon demo, not an official club portal.

The goal is to transform it into something that feels **institutional and precise** — the kind of interface a serious AI research organization would be proud to put their name on. The reference point is a cross between **Linear's obsessive restraint** and the quiet authority of an **MIT Media Lab project page**. Dark, considered, typographically rigorous, and visually disciplined.

One rule above all others: **every decorative element must earn its place**. If it doesn't communicate something, it doesn't exist.

---

## AESTHETIC DIRECTION

### The Feeling

Quiet confidence. The interface should feel like it was designed by people who didn't need to show off. No flashiness. No "look how techy we are." The sophistication should come from precision — from the exact right amount of spacing, from type that's been chosen with intent, from a color palette so restrained it makes everything feel considered.

If the current design is shouting, the new one should be speaking at a normal volume in a very good room.

### The Visual Language

Think: a high-end research portal. Think: dark paper with razor-thin ink lines. Think: the kind of tool a senior ML engineer would actually keep open all day without it draining them. Functional luxury through restraint, not ornamentation.

---

## TYPOGRAPHY — COMPLETE REPLACEMENT

**Remove entirely:** Space Grotesk and Outfit. Both fonts. Every instance across all files.

**Replace with:**
- **Syne** — for all headings, page titles, display text, modal headers, section titles, and the sidebar logo wordmark. Syne is geometric, confident, and has a quiet institutional authority. Use weights 700 and 800 for impact.
- **DM Sans** — for all body text, form labels, navigation items, card descriptions, button labels, metadata, and subtitles. DM Sans is warm but precise. It reads cleanly at small sizes without feeling clinical.

Both fonts are available on Google Fonts. The combination should feel like a well-designed academic publication — serious at a glance, readable on inspection.

**Typographic rules:**
- Page titles: Syne, large, tight letter-spacing (negative tracking), heavy weight
- Section headings: Syne, medium-large, no all-caps
- Body and UI text: DM Sans, regular or medium weight
- Labels above form fields: DM Sans, very small, uppercase, wide letter-spacing — the only place all-caps is appropriate
- Navigation labels: DM Sans, regular weight, no uppercase
- No italic anywhere in the interface chrome

---

## COLOR — RADICAL SIMPLIFICATION

### Current Problem

The current palette has five competing colors: an indigo accent, a cyan accent, a rose accent, an emerald accent, and a warning amber — all used simultaneously on cards, badges, buttons, and highlights. This creates visual noise that makes the interface feel chaotic and untrustworthy.

### The New System

**One background.** Near-absolute black — deep enough to feel premium, not so dark it feels aggressive. Think the deepest part of a late-night terminal.

**One surface color.** A single step above the background — used for cards, sidebars, and raised elements. The distinction should be barely perceptible but clearly felt.

**One border color.** A whisper of white at very low opacity. Consistent everywhere. Never changes color based on context (except on active/focus states).

**One accent color.** A single indigo — the color already used as the primary accent in the current design. Everything that previously used cyan, rose, or emerald as an accent color must be converted to either this indigo or to a neutral muted tone. No exceptions.

The accent color is used for: active navigation state, focused input borders, primary buttons, active filter chips, and the single gradient text instance in the hero headline. That is the complete list. It is not used for decorative purposes anywhere else.

**Text hierarchy — three tiers only:**
1. Primary text — near-white, for headings and active content
2. Secondary text — medium gray, for descriptions, subtitles, and metadata
3. Muted text — dark gray, for placeholders, timestamps, and disabled states

**Status colors** (success green, warning amber, danger red) are kept but used only for functional status indicators — seat availability badges, approval status chips, error messages. Never for decoration.

---

## WHAT TO REMOVE — NO EXCEPTIONS

These elements must be completely eliminated from the HTML, CSS, and any JavaScript that initializes them:

**Particle system:** The `particles.js` script and its container element must be removed entirely. The animated particle field in the background is the single biggest source of visual noise and performance drag in the current design.

**Blob animations:** The three large blurred radial gradient circles that float and pulse behind the content — the purple one top-right, the cyan one bottom-left, the rose one mid-left — must be removed entirely. Their CSS animations, their HTML elements, everything. The background should be a clean, still dark color.

**Gradient glow shadows:** Every colored box-shadow on cards, buttons, and containers that uses a purple, cyan, or indigo color value must be replaced with a simple, dark neutral drop shadow or removed entirely. Cards do not glow.

**Multi-color badge system:** The current category tags — ML in cyan, DL in indigo, WebDB in rose, Data Science in green, Workshop in amber, Talk in green, Hackathon in rose — must be replaced with a single unified badge style. All tags: same muted background, same muted text color. The category name communicates the information — color should not be doing that job.

**Gradient text overuse:** Currently, gradient text is applied to multiple headings, stat numbers, the calendar month label, and various other elements throughout the dashboard. This must stop. Gradient text is reserved for exactly one instance: one word or short phrase in the landing page hero headline. Everywhere else: solid white or primary text color.

**Emoji in interface chrome:** Navigation items like "📅 Events", "📚 Resources", "🏆 Top Contributors", and "📢 Post Announcement" must have the emoji removed. Navigation uses the SVG icons already present in the HTML. Section headers inside the dashboard that prefix emoji to headings must have them removed — the heading text alone is sufficient. Emojis belong only in user-generated content.

**The zoom: 0.8 hack on the layout:** This is currently applied to the entire dashboard layout container. It must be removed and the layout must be correctly sized without artificial browser zoom scaling.

**Colored active borders on nav items:** The current active nav item shows a colored left-border pseudo-element acting as an indicator stripe. Replace with a simple background fill in the accent color at very low opacity — clean, not striped.

---

## LANDING PAGE — REDESIGN DIRECTION

### Navigation Bar

Slim, fixed, transparent with heavy blur backdrop. Left: ORCA logo image and wordmark in Syne. Center: three navigation links in DM Sans — subdued by default, slightly brighter on hover. Right: two buttons. The nav bottom-border should be the same whisper-thin border used everywhere else. No thicker border, no glow.

### Hero Section

Full viewport height, content centered both horizontally and vertically. The headline should be the largest type on the page — Syne 800, very tight letter-spacing, massive scale. The key term gets the single gradient treatment: white fading into the accent indigo. Everything else in the headline is solid white.

The sub-headline beneath it: DM Sans, comfortable reading size, soft gray, modest line length — centered beneath the headline with generous breathing room. Two call-to-action buttons below that: one primary filled, one outline. Both buttons: no shadow, no glow, no transform on hover — just a slight opacity shift.

No stats below the hero. No "eyebrow" text with decorative lines before the headline. No scroll indicator. The hero is clean space, a headline, and two buttons. That is enough.

### Feature Sections

Two sections: About Us and Platform Features. Both sections sit on the same dark background as the hero — no section background change, no dividing colored panels. A thin border-top line separates them. The section title in Syne sits centered, no gradient, no highlight colors. Descriptive paragraph in DM Sans below it, centered, narrow column width for readability.

Feature cards in a three-column grid. Cards have a surface-colored background, thin border, generous internal padding. The feature icon is a small square container with the indigo accent at very low opacity as background, with the SVG icon inside in the accent color. No large circular icon containers. No oversized 80px circles. Small, precise, intentional.

Card title in Syne, small-medium size. Card description in DM Sans, secondary text color, comfortable line-height. No hover lift. No hover glow. The border becomes very slightly brighter on hover — that is the entire hover interaction.

### Footer

One line. Copyright text in DM Sans, muted color. Thin border-top. Nothing else.

---

## DASHBOARD SIDEBAR — REDESIGN DIRECTION

The sidebar is a fixed panel on the left. Its background should be the surface color — one step above the page background. No blur, no backdrop-filter — it is a solid panel, not a floating overlay. A single thin vertical border separates it from the main content.

**Logo area at top:** ORCA logo image and wordmark in Syne. Below it, the club subtitle in very small DM Sans, uppercase, wide letter-spacing, muted color. Separated from the nav by the standard thin border.

**Navigation section labels** (like "Main" and "Admin"): extremely small DM Sans, uppercase, very wide letter-spacing, muted color. These are wayfinding markers, not headings.

**Navigation items:** DM Sans, regular weight. Default state: secondary text color, no background. Hover state: primary text color, very slight white-overlay background fill. Active state: accent color text, very-low-opacity accent background fill. The entire item is the clickable area — generous height for comfortable clicking. No emoji prefixes. SVG icons only.

**User block at the bottom:** Thin border-top. Small circular avatar with the user's initials — plain surface-two background, no gradient. Name in DM Sans medium. Role label in very small DM Sans, muted, uppercase. Clicking the block navigates to the profile page.

---

## DASHBOARD MAIN CONTENT — REDESIGN DIRECTION

### Home / Dashboard Page

Remove the greeting emoji. The welcome heading in Syne is sufficient. Stats row below it: four stat cards in a row, each showing a number and a label. The number in Syne, large, white. The label in DM Sans, small, muted. No gradient on stat numbers. Each card has the standard surface background and thin border — nothing more.

The two-column layout — calendar left, upcoming events and leaderboard right — stays structurally intact. Section headers inside the dashboard that prefix emoji to headings get those emoji removed. Just the heading text in Syne, and a "see all" link in small DM Sans accent color to the right if needed.

Announcement cards: a thin left border in the accent color is the one permitted colored border in the dashboard — it is functional, marking these as alerts, not decorative. Background matches surface. Title in DM Sans medium, content in DM Sans regular secondary color.

Leaderboard: a clean list. Each row has a rank number in muted text, an avatar, a name, and a point value. No gold/silver/bronze coloring. No podium theatrics. Clean rows with a thin bottom border separator between entries.

### Events Page

Tab bar at the top: All, Workshops, Talks, Hackathons. Standard tab style — no background pill, just an underline on the active tab in the accent color. Event cards in an auto-fill grid.

Each event card: a unified-style type badge, the event title in Syne medium weight, date and location in small DM Sans secondary text, a thin progress bar for seats remaining, and a register button. Card footer aligns the register button right and the seats badge left. The card communicates everything needed without color coding.

### Resources Page

Same filter chip row as before, but chips in the unified style — no color per category. Resource cards: small file-type icon, resource title in Syne, subcommittee tag in the unified badge style, uploader and date in small muted DM Sans text, and a download button.

### Modals and Forms

All modals: surface-colored background, thin border, large border-radius, no glow shadow — only a strong dark drop shadow for elevation. The close button is a small X in the top-right, ghost style, no decorative container around it.

Login modal: compact, centered card. Logo centered at top, heading in Syne, two role-selector tabs styled as a segmented control with a thin border. Standard form fields. Primary login button full-width. Link to sign up in small text below.

Signup modal: the two-column split panel layout is worth keeping — it is a good structural idea. Left panel: pure brand — logo, club name in Syne, one sentence description in DM Sans. Right panel: pure form. Both panels on the same dark palette. The left panel gets a very subtle centered radial highlight at low opacity — nothing more.

Form inputs throughout: a background one level darker than the modal surface, a thin border that turns accent-colored on focus. No glow on focus, no shadow on focus — only border color change. That is the complete focus treatment.

---

## INTERACTION PRINCIPLES

**Hover states:** Border becomes slightly brighter. Text becomes slightly brighter. That is all. No transform lifts, no glow shadows appearing, no scale changes on hover anywhere in the interface.

**Active and selected states:** Background fill at very low accent opacity. Text in accent color. No additional border added.

**Transitions:** Everything transitions at 150 milliseconds, ease. Nothing slower. Nothing bouncy. No spring animation on UI elements. The mobile sidebar slide can use a smooth ease-in-out curve.

**Notifications:** Bottom-right toast. Surface background, thin border. Icon on the left, title and subtitle on the right. Slides up on appear, slides down on dismiss. No colored background — status is communicated by the icon, not by the entire toast turning green or red.

**Detail panel (event drawer):** Slides in from the right. Surface background. Thin left border as the separator. No shadow on the panel itself.

---

## RESPONSIVE AND MOBILE

On mobile — under 900px — the sidebar is hidden by default. The hamburger button that reveals it must be a clean icon button with a standard menu SVG, no emoji, no background decorations beyond a thin border. The main content fills full width with appropriate horizontal padding. The sidebar overlays the content when open, with a dark semi-transparent scrim behind it.

---

## FINAL CHECKLIST

Before considering this done, every one of the following must be true:

- No particle effect anywhere in the page
- No animated blob or floating gradient element anywhere
- Space Grotesk and Outfit are completely absent from all files
- Syne and DM Sans are loaded and applied correctly throughout
- There is exactly one accent color in the entire design system
- Gradient text appears in exactly one location: the hero headline
- All card hover states are border-brightness change only — no glow, no lift, no shadow appearance
- All navigation labels are emoji-free
- All dashboard section headers are emoji-free
- Category and type badges are visually uniform — same muted color for all categories
- The zoom: 0.8 layout hack has been removed and layout is correctly proportioned
- No colored box-shadow glow exists anywhere
- All buttons use the two-style system — primary filled, outline secondary
- Form inputs use border-color-only focus treatment, no glow
- The sidebar has no backdrop-filter blur
- The landing page has no background color changes between sections
- The footer contains exactly one line of content

---

*This is not a redesign that adds things. It is a redesign that removes everything that shouldn't be there, and leaves what remains in perfect condition.*
