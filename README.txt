Garden Detective — Focused Workspaces
====================================

Upload all six files to the repository root:
- index.html
- styles.css
- app.js
- weather-data.js
- tomatoes-on-vine-cc0.jpg
- README.txt

Design:
- Start screen plus four focused workspaces and a conclusion.
- Each question appears beside the evidence needed to answer it.
- Daily weather graph is paired with the weather question.
- Climate summaries are paired with the comparison question.
- A precipitation-only graph is paired with the rainfall-distribution question.
- The final screen combines the key evidence.

Photo:
“Tomatoes on the Vine” by Dan Gold, published under CC0.
Source: Wikimedia Commons.
https://commons.wikimedia.org/wiki/File:Tomatoes_on_the_Vine_(Unsplash).jpg

Accessibility:
- Semantic headings, fieldsets, legends, tables, and captions
- Keyboard-operable navigation and controls
- Visible focus indicators
- Live answer feedback
- Text equivalents for graph information
- Does not rely on color alone
- Reduced-motion support
- Responsive layout


CANVAS-OPTIMIZED UPDATE
-----------------------
This version changes to a stacked layout at 1180 pixels rather than waiting
until 900 pixels. Canvas commonly displays embedded pages in a narrower
content area, so this prevents the evidence and question panels from becoming
compressed.

The bottom navigation is now sticky rather than fixed, which prevents it from
covering content inside an iframe.

Recommended Canvas iframe:
<iframe
  src="YOUR_GITHUB_PAGES_URL"
  title="Garden Detective: Investigating a Growing Season"
  width="100%"
  height="1100"
  style="border:0; width:100%;"
  loading="eager">
</iframe>
