Garden Detective Challenge — Module 1
=============================================
Updated layout deployment

FILES
-----
index.html
styles.css
app.js

PURPOSE
-------
Learners compare actual daily weather observations from the 2024 Corvallis
growing season with 1991–2020 climate normals, then apply the comparison to
gardening decisions.

DATA
----
Daily data are requested at page load from the Applied Climate Information
System (ACIS) StnData service.

Station:
- ACIS ID: 351862
- GHCN ID: USC00351862
- Corvallis State University, Oregon

Weather period:
- April 1 through September 30, 2024

Variables:
- Daily maximum temperature
- Daily precipitation

Climate reference:
- NOAA 1991–2020 monthly station normals
- Average daily maximum temperature
- Total monthly precipitation

IMPORTANT
---------
The activity needs internet access because it retrieves the daily observations
from ACIS and loads Chart.js from a public CDN. If either service is unavailable,
the page shows an error rather than substituting invented values.

GITHUB PAGES
------------
Upload all three files to the root of one repository:
- index.html
- styles.css
- app.js

In GitHub, open Settings > Pages and publish from the main branch/root folder.

CANVAS
------
After publishing with GitHub Pages, embed the published URL in Canvas using an
iframe or add it as an External URL module item. The iframe must allow scripts.

ACCESSIBILITY
-------------
- Keyboard-operable controls
- Visible focus indicators
- Status and feedback announcements
- Daily observations available as a table
- Climate comparison available as a table
- Charts are supplemental to the tabular data
