# GeoFS-METAR-system
A system that displays the nearest Airports' METAR data.
Please check for version updates frequently, as the current version is still unstable.
## How to use?
The widget will display the closest airport's METAR to you. It will auto-refresh every 30 minutes, and you can refresh manually as well.
U can hide the widget by pressing W.
For the first time, please paste your API key in a pop-up window. Please get one at https://account.avwx.rest/getting-started first. Type "clear" if you want to remove the API key
If you want it to support more airports, you can add them yourself. Also, you can ask me anything on my Discord (seabus0316).
tutorial: https://upfile.live/zh-tw/files/76f6288f
If you escaped the window accidentally, please refresh the page.
## How to install?
Copy the user.js and paste it into Tampermonkey.
##How to use the converter?
Find the data in https://ourairports.com/, and paste the .csv into the converter (link: https://seabus0316.github.io/GeoFS-METAR-system/airport_csv_converter_v7.html
), press "convert", paste the code into airports.json, and upload to a public github repo, change the link in const airportDataURL = "your raw link here"
You can add airports customarily, but U have to create a repo, U can ask seabus. Also, I will also upload some airport collection packs here, and you don't have to update your userscript.
## About clocks
The clock theme changes with the day and night.
![metar](https://github.com/user-attachments/assets/e3e44bb0-b2c1-4505-a762-5abbb5bbb4d2)
