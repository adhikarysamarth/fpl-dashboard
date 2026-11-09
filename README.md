# Sagarmatha League cleaned frontend

## Included
- index.html / app.js
- livegw.html / livegw.js
- managers.html / managers.js
- rules.html
- styles.css

## Main corrections
- One `/live` request on the Dashboard instead of two.
- `/live` is the Dashboard source for current leader and net-point average.
- Correct loading/error colspans.
- Manager-table medal CSS no longer leaks into Live GW.
- Added Awaiting Confirmation badge styling.
- Bench Farmer excludes completed Bench Boost weeks.
- Added table header scope and polite live regions.

## Expected Worker contracts
- `/` returns `{ league, bootstrap, histories }`.
- `/live` returns `{ currentGW, status, standings }`.
- `status` is `live`, `awaiting`, or `final`.
- Each live standing includes `rank`, `team`, `manager`, `chip`, `netPoints`, and `benchPoints`.
