Garden Detective Challenge — Local Data Edition
================================================

UPLOAD THESE FIVE FILES TO THE REPOSITORY ROOT
- index.html
- styles.css
- weather-data.js
- app.js
- README.txt

WHAT CHANGED
- The 183 daily Corvallis observations are stored locally in weather-data.js.
- The activity no longer contacts ACIS when a learner opens the page.
- Monthly 2024 summaries are pre-calculated.
- Difference values are bold rather than represented with colored icons.
- The GitHub Pages URL and Canvas iframe URL do not change.

DATA SNAPSHOT
Location: Corvallis State University, Oregon
Station: USC00351862 / ACIS 351862
Period: April 1–September 30, 2024
Variables: daily maximum temperature and daily precipitation
Climate reference: NOAA 1991–2020 station normals

SOURCE NOTE
The fixed daily snapshot was transcribed from the Corvallis State University
station record. The activity retains the source attribution on the page.

GITHUB
Overwrite index.html, styles.css, app.js, and README.txt. Add weather-data.js.
Do not delete the repository. Commit directly to the branch used by GitHub Pages.

PERFORMANCE UPDATE
------------------
This version no longer loads Chart.js or any other chart library from an
external CDN. The weather visualization is rendered locally as accessible SVG.
All activity data and chart code are served from the GitHub Pages repository.


LAYOUT UPDATE
-------------
The climate comparison is now divided into separate temperature and
precipitation tables. This removes the internal horizontal scrolling and
reduces visual crowding while preserving all comparison values.
