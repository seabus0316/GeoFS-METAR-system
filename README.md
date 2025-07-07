# GeoFS-METAR-system
A system that shows METAR after you enter the airport ICAO into the widget. Please check for version updates frequently because the version is still unstable.
## How to use?
The widget will display the closest airport's METAR to you. It will auto-refresh every 30 minutes, and you can refresh manually as well.
U can hide the widget by pressing W.
## How to install?
Copy the user.js and paste it into Tampermonkey.

If you want it to support more airports, DM me on Discord (seabus0316)
I will update them often, and you can renew them if you wish to be more airport-enabled.
##How to use the converter?
Find the data in https://ourairports.com/ , and paste the .csv into the converter, press "轉換 (with a rocket emoji)", paste"Airports物件" into const AIRPORTS = {.....}; "icao_timezones" into const ICAO_TIMEZONES = {...};
You can add airports customarily.
