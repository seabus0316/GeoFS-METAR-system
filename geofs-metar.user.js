// ==UserScript==
// @name         GeoFS METAR system
// @version      2.5.8
// @description  METAR widget with built-in airport detection, no input box, auto refresh, dual clocks and icons
// @author       seabus
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://i.ibb.co/wZ2SB149/Chat-GPT-Image-2025-6-30-08-31-37.png
// @grant        none
// ==/UserScript==

(function () {
  if (window.geofsMetarAlreadyLoaded) return;
  window.geofsMetarAlreadyLoaded = true;

  const AIRPORTS = {
  "KSFO": { name: "San Francisco Intl", lat: 37.6188056, lon: -122.3754167 },
  "KLAX": { name: "Los Angeles Intl", lat: 33.942536, lon: -118.408075 },
  "RJTT": { name: "Tokyo Haneda", lat: 35.552258, lon: 139.779694 },
  "RCTP": { name: "Taipei Taoyuan", lat: 25.0777, lon: 121.233 },
  "EGLL": { name: "London Heathrow", lat: 51.4706, lon: -0.461941 },
  "LFPG": { name: "Paris Charles de Gaulle", lat: 49.0097, lon: 2.5479 },
  "EDDF": { name: "Frankfurt am Main", lat: 50.0379, lon: 8.5622 },
  "ZBAA": { name: "Beijing Capital Intl", lat: 40.0801, lon: 116.5846 },
  "OMDB": { name: "Dubai Intl", lat: 25.2532, lon: 55.3657 },
  "YSSY": { name: "Sydney Kingsford Smith", lat: -33.9399, lon: 151.1753 },
  "RJAA": { name: "Narita Intl", lat: 35.7719, lon: 140.3929 },
  "WSSS": { name: "Singapore Changi", lat: 1.3644, lon: 103.9915 },
  "EHAM": { name: "Amsterdam Schiphol", lat: 52.3086, lon: 4.7639 },
  "CYYZ": { name: "Toronto Pearson Intl", lat: 43.6777, lon: -79.6248 },
  "CYVR": { name: "Vancouver Intl", lat: 49.1951, lon: -123.1779 },
  "VHHH": { name: "Hong Kong Intl", lat: 22.3089, lon: 113.9146 },
  "VIDP": { name: "Indira Gandhi Intl", lat: 28.5562, lon: 77.1000 },
  "RKSI": { name: "Incheon Intl", lat: 37.4602, lon: 126.4407 },
  "NZAA": { name: "Auckland Intl", lat: -37.0081, lon: 174.7917 },
  "FAOR": { name: "OR Tambo Intl", lat: -26.1337, lon: 28.2420 },
  "SAEZ": { name: "Ministro Pistarini Intl", lat: -34.8222, lon: -58.5358 },
  "SCEL": { name: "Arturo Merino Benítez Intl", lat: -33.3929, lon: -70.7858 },
  "SBGR": { name: "Guarulhos Intl", lat: -23.4356, lon: -46.4731 },
  "SEQM": { name: "Mariscal Sucre Intl", lat: -0.1225, lon: -78.3544 },
  "SKBO": { name: "El Dorado Intl", lat: 4.7016, lon: -74.1469 },
  "TJSJ": { name: "Luis Muñoz Marín Intl", lat: 18.4394, lon: -66.0018 },
  "MMMX": { name: "Benito Juárez Intl", lat: 19.4361, lon: -99.0719 },
  "LEMD": { name: "Madrid Barajas", lat: 40.4936, lon: -3.5668 },
  "LIRF": { name: "Leonardo da Vinci–Fiumicino", lat: 41.8003, lon: 12.2389 },
  "EDDM": { name: "Franz Josef Strauss Intl", lat: 48.3538, lon: 11.7861 },
  "LOWW": { name: "Vienna Intl", lat: 48.1103, lon: 16.5697 },
  "LFMN": { name: "Nice Côte d'Azur", lat: 43.6584, lon: 7.2159 },
  "EBBR": { name: "Brussels Airport", lat: 50.9014, lon: 4.4844 },
  "EKCH": { name: "Copenhagen Kastrup", lat: 55.6181, lon: 12.6561 },
  "ESSA": { name: "Stockholm Arlanda", lat: 59.6519, lon: 17.9186 },
  "ENGM": { name: "Oslo Gardermoen", lat: 60.1939, lon: 11.1004 },
  "EFHK": { name: "Helsinki Vantaa", lat: 60.3172, lon: 24.9633 },
  "ULLI": { name: "Pulkovo Airport", lat: 59.8003, lon: 30.2625 },
  "LCLK": { name: "Larnaca Intl", lat: 34.8751, lon: 33.6249 },
  "LTBA": { name: "Istanbul Atatürk (Closed)", lat: 40.9769, lon: 28.8146 },
  "LTFM": { name: "Istanbul Airport", lat: 41.2753, lon: 28.7525 },
  "UUWW": { name: "Vnukovo Intl", lat: 55.5915, lon: 37.2615 },
  "UUEE": { name: "Sheremetyevo Intl", lat: 55.9726, lon: 37.4146 },
  "OMAA": { name: "Abu Dhabi Intl", lat: 24.4330, lon: 54.6511 },
  "OERK": { name: "King Khalid Intl", lat: 24.9576, lon: 46.6988 },
  "OEJN": { name: "King Abdulaziz Intl", lat: 21.6796, lon: 39.1565 },
  "OTHH": { name: "Hamad Intl", lat: 25.2731, lon: 51.6081 },
  "OKBK": { name: "Kuwait Intl", lat: 29.2266, lon: 47.9689 },
  "OJAI": { name: "Queen Alia Intl", lat: 31.7226, lon: 35.9932 },
  "DAAG": { name: "Algiers Houari Boumediene", lat: 36.6910, lon: 3.2154 },
  "DTTA": { name: "Tunis–Carthage Intl", lat: 36.8510, lon: 10.2272 },
  "HECA": { name: "Cairo Intl", lat: 30.1219, lon: 31.4056 },
  "HKJK": { name: "Jomo Kenyatta Intl", lat: -1.3192, lon: 36.9278 },
  "DNMM": { name: "Murtala Muhammed Intl", lat: 6.5774, lon: 3.3212 },
  "GVAC": { name: "Amílcar Cabral Intl", lat: 16.7414, lon: -22.9494 },
  "GMMN": { name: "Mohammed V Intl", lat: 33.3675, lon: -7.5899 },
  "FMEE": { name: "Roland Garros Airport", lat: -20.8871, lon: 55.5103 },
  "FACT": { name: "Cape Town Intl", lat: -33.9648, lon: 18.6017 },
  "FIMP": { name: "SSR Intl (Mauritius)", lat: -20.4302, lon: 57.6836 },
  "AYPY": { name: "Port Moresby Jacksons Intl", lat: -9.4434, lon: 147.2200 },
  "NZCH": { name: "Christchurch Intl", lat: -43.4894, lon: 172.5322 },
  "YMML": { name: "Melbourne Intl", lat: -37.6733, lon: 144.8433 },
  "YPAD": { name: "Adelaide Intl", lat: -34.9450, lon: 138.5306 },
  "YBBN": { name: "Brisbane Intl", lat: -27.3842, lon: 153.1175 },
  "PANC": { name: "Ted Stevens Anchorage Intl", lat: 61.1743, lon: -149.9962 },
  "KSEA": { name: "Seattle-Tacoma Intl", lat: 47.4502, lon: -122.3088 },
  "KDEN": { name: "Denver Intl", lat: 39.8561, lon: -104.6737 },
  "KORD": { name: "Chicago O'Hare Intl", lat: 41.9742, lon: -87.9073 },
  "KATL": { name: "Hartsfield–Jackson Atlanta Intl", lat: 33.6407, lon: -84.4277 },
  "KDFW": { name: "Dallas/Fort Worth Intl", lat: 32.8998, lon: -97.0403 },
  "KMIA": { name: "Miami Intl", lat: 25.7959, lon: -80.2870 },
  "KPHX": { name: "Phoenix Sky Harbor Intl", lat: 33.4373, lon: -112.0078 },
  "KCLT": { name: "Charlotte Douglas Intl", lat: 35.2140, lon: -80.9431 },
  "KBOS": { name: "Boston Logan Intl", lat: 42.3656, lon: -71.0096 },
  "KLGA": { name: "LaGuardia Airport", lat: 40.7769, lon: -73.8740 },
  "KJFK": { name: "John F. Kennedy Intl", lat: 40.6413, lon: -73.7781 },
  "KEWR": { name: "Newark Liberty Intl", lat: 40.6895, lon: -74.1745 },
  "KMSP": { name: "Minneapolis–Saint Paul Intl", lat: 44.8820, lon: -93.2218 },
  "KDTW": { name: "Detroit Metro Wayne County", lat: 42.2121, lon: -83.3488 },
  "KIAD": { name: "Washington Dulles Intl", lat: 38.9531, lon: -77.4565 },
  "KDCA": { name: "Ronald Reagan Washington National", lat: 38.8512, lon: -77.0402 },
  "KTPA": { name: "Tampa Intl", lat: 27.9755, lon: -82.5332 },
  "KSLC": { name: "Salt Lake City Intl", lat: 40.7899, lon: -111.9791 },
  "KPDX": { name: "Portland Intl", lat: 45.5887, lon: -122.5975 },
  "KSAN": { name: "San Diego Intl", lat: 32.7338, lon: -117.1933 },
  "KLAS": { name: "Harry Reid Intl", lat: 36.0801, lon: -115.1522 },
  "KMDW": { name: "Chicago Midway Intl", lat: 41.7868, lon: -87.7522 },
  "KBWI": { name: "Baltimore/Washington Intl", lat: 39.1754, lon: -76.6684 },
  "PHNL": { name: "Honolulu Intl", lat: 21.3187, lon: -157.9224 },
  "PHTO": { name: "Hilo Intl", lat: 19.7214, lon: -155.0485 },
  "PAFA": { name: "Fairbanks Intl", lat: 64.8151, lon: -147.8562 },
  "PANC": { name: "Ted Stevens Anchorage Intl", lat: 61.1743, lon: -149.9962 },
  "PGUM": { name: "Antonio B. Won Pat Intl", lat: 13.4834, lon: 144.7962 },
  "UHPP": { name: "Petropavlovsk-Kamchatsky", lat: 52.0263, lon: 158.6310 },
  "UAAA": { name: "Almaty Intl", lat: 43.3521, lon: 77.0405 },
  "UTTT": { name: "Tashkent Intl", lat: 41.2579, lon: 69.2812 },
  "UBBB": { name: "Heydar Aliyev Intl", lat: 40.4675, lon: 50.0467 },
  "UKBB": { name: "Kyiv Boryspil Intl", lat: 50.3450, lon: 30.8947 },
  "LBSF": { name: "Sofia Airport", lat: 42.6967, lon: 23.4114 },
  "LROP": { name: "Henri Coandă Intl", lat: 44.5711, lon: 26.0850 },
  "LDZA": { name: "Zagreb Airport", lat: 45.7429, lon: 16.0688 },
  "LJLJ": { name: "Jože Pučnik Airport", lat: 46.2237, lon: 14.4576 },
  "ROAH": { name: "Naha Airport", lat: 26.1958, lon: 127.6460 },
  "ZGSZ": { name: "Shenzhen Bao'an Intl", lat: 22.6393, lon: 113.8105 },
  "RJGG": { name: "Chubu Centrair Intl", lat: 34.8584, lon: 136.8044 },
  "VTBS": { name: "Suvarnabhumi Intl", lat: 13.6900, lon: 100.7501 },
  "WMKK": { name: "Kuala Lumpur Intl", lat: 2.7456, lon: 101.7072 },
  "WIII": { name: "Soekarno–Hatta Intl", lat: -6.1256, lon: 106.6558 },
  "YPAD": { name: "Adelaide Intl", lat: -34.9450, lon: 138.5306 },
  "NZWN": { name: "Wellington Intl", lat: -41.3272, lon: 174.8053 },
  "YPPH": { name: "Perth Intl", lat: -31.9403, lon: 115.9672 },
  "NTAA": { name: "Faa'a Intl", lat: -17.5537, lon: -149.6063 },
  "PHNL": { name: "Honolulu Intl", lat: 21.3187, lon: -157.9224 },
  "PANC": { name: "Ted Stevens Anchorage Intl", lat: 61.1743, lon: -149.9962 },
  "CYUL": { name: "Montréal-Trudeau Intl", lat: 45.4706, lon: -73.7408 },
  "CYYC": { name: "Calgary Intl", lat: 51.1139, lon: -114.0203 },
  "SEGU": { name: "José Joaquín de Olmedo Intl", lat: -2.1574, lon: -79.8836 },
  "SLLP": { name: "El Alto Intl", lat: -16.5133, lon: -68.1923 },
  "SPZO": { name: "Velasco Astete Intl", lat: -13.5357, lon: -71.9388 },
  "SUMU": { name: "Carrasco Intl", lat: -34.8384, lon: -56.0308 },
  "SAME": { name: "El Plumerillo Airport", lat: -32.8317, lon: -68.7929 },
  "SBSP": { name: "Congonhas Airport", lat: -23.6261, lon: -46.6564 },
  "FQMA": { name: "Maputo Intl", lat: -25.9208, lon: 32.5726 },
  "HBBA": { name: "Bujumbura Intl", lat: -3.3240, lon: 29.3185 },
  "HSSS": { name: "Khartoum Intl", lat: 15.5895, lon: 32.5532 },
  "HEGN": { name: "Hurghada Intl", lat: 27.1783, lon: 33.7994 },
  "DAAG": { name: "Algiers Houari Boumediene", lat: 36.6910, lon: 3.2154 },
  "GMMX": { name: "Marrakesh Menara", lat: 31.6069, lon: -8.0363 },
  "GQNN": { name: "Nouakchott Intl", lat: 18.0979, lon: -15.9474 },
  "DTMB": { name: "Monastir Habib Bourguiba", lat: 35.7581, lon: 10.7547 },
  "LATI": { name: "Tirana Intl", lat: 41.4147, lon: 19.7206 },
  "LCLK": { name: "Larnaca Intl", lat: 34.8751, lon: 33.6249 },
  "LYBE": { name: "Belgrade Nikola Tesla", lat: 44.8184, lon: 20.3094 },
  "LBSF": { name: "Sofia Airport", lat: 42.6967, lon: 23.4114 },
  "LHBP": { name: "Budapest Ferenc Liszt Intl", lat: 47.4298, lon: 19.2611 },
  "LROP": { name: "Henri Coandă Intl", lat: 44.5711, lon: 26.0850 },
  "EVRA": { name: "Riga Intl", lat: 56.9236, lon: 23.9711 },
  "EFHK": { name: "Helsinki Vantaa", lat: 60.3172, lon: 24.9633 },
  "LOWW": { name: "Vienna Intl", lat: 48.1103, lon: 16.5697 },
  "LWSK": { name: "Skopje Intl", lat: 41.9616, lon: 21.6214 },
  "LPPT": { name: "Lisbon Humberto Delgado", lat: 38.7742, lon: -9.1342 },
  "LEBL": { name: "Barcelona El Prat", lat: 41.2974, lon: 2.0833 },
  "EIDW": { name: "Dublin Intl", lat: 53.4213, lon: -6.2701 },
  "LTFM": { name: "Istanbul Airport", lat: 41.2753, lon: 28.7525 },
  "UBBB": { name: "Heydar Aliyev Intl", lat: 40.4675, lon: 50.0467 },
  "UTTT": { name: "Tashkent Intl", lat: 41.2579, lon: 69.2812 },
  "UUEE": { name: "Sheremetyevo Intl", lat: 55.9726, lon: 37.4146 },
  "UKBB": { name: "Kyiv Boryspil Intl", lat: 50.3450, lon: 30.8947 },
  "LZIB": { name: "Bratislava Airport", lat: 48.1702, lon: 17.2127 },
  "BIKF": { name: "Keflavik Intl", lat: 63.9850, lon: -22.6056 },
  "BGSF": { name: "Kangerlussuaq Airport", lat: 67.0122, lon: -50.7116 },
  "BGGH": { name: "Nuuk Airport", lat: 64.1909, lon: -51.6781 },
  "EGLC": { name: "London City Airport", lat: 51.5053, lon: 0.0553 },
  "EGLL": { name: "London Heathrow", lat: 51.4706, lon: -0.4619 },
  "EGKK": { name: "London Gatwick", lat: 51.1481, lon: -0.1903 },
  "EGSS": { name: "London Stansted", lat: 51.8850, lon: 0.2350 },
  "EGGW": { name: "London Luton", lat: 51.8747, lon: -0.3683 },
  "EGCC": { name: "Manchester Airport", lat: 53.3659, lon: -2.2727 },
  "EGNX": { name: "East Midlands Airport", lat: 52.8311, lon: -1.3281 },
  "EGGD": { name: "Bristol Airport", lat: 51.3827, lon: -2.7191 },
  "EGHI": { name: "Southampton Airport", lat: 50.9503, lon: -1.3568 },
  "EGPD": { name: "Aberdeen Airport", lat: 57.2019, lon: -2.1978 },
  "EGPH": { name: "Edinburgh Airport", lat: 55.9500, lon: -3.3725 },
  "EGAA": { name: "Belfast Intl", lat: 54.6575, lon: -6.2158 },
  "LFPG": { name: "Paris Charles de Gaulle", lat: 49.0097, lon: 2.5479 },
  "LFPO": { name: "Paris Orly", lat: 48.7233, lon: 2.3794 },
  "LFML": { name: "Marseille Provence", lat: 43.4367, lon: 5.2150 },
  "LFMN": { name: "Nice Côte d'Azur", lat: 43.6584, lon: 7.2159 },
  "LFBD": { name: "Bordeaux Mérignac", lat: 44.8283, lon: -0.7156 },
  "LFBO": { name: "Toulouse Blagnac", lat: 43.6291, lon: 1.3638 },
  "EDDF": { name: "Frankfurt am Main", lat: 50.0379, lon: 8.5622 },
  "EDDB": { name: "Berlin Brandenburg", lat: 52.3667, lon: 13.5033 },
  "EDDH": { name: "Hamburg Airport", lat: 53.6304, lon: 10.0064 },
  "EDDM": { name: "Munich Intl", lat: 48.3538, lon: 11.7861 },
  "EDDL": { name: "Düsseldorf Intl", lat: 51.2895, lon: 6.7668 },
  "EDDV": { name: "Hannover Airport", lat: 52.4611, lon: 9.6851 },
  "LOWW": { name: "Vienna Intl", lat: 48.1103, lon: 16.5697 },
  "LZIB": { name: "Bratislava Airport", lat: 48.1702, lon: 17.2127 },
  "LKPR": { name: "Prague Vaclav Havel", lat: 50.1008, lon: 14.26 },
  "LHBP": { name: "Budapest Ferenc Liszt Intl", lat: 47.4298, lon: 19.2611 },
  "LROP": { name: "Henri Coandă Intl", lat: 44.5711, lon: 26.0850 },
  "LBSF": { name: "Sofia Airport", lat: 42.6967, lon: 23.4114 },
  "LDZA": { name: "Zagreb Airport", lat: 45.7429, lon: 16.0688 },
  "LJLJ": { name: "Ljubljana Jože Pučnik Airport", lat: 46.2237, lon: 14.4576 },
  "LYBE": { name: "Belgrade Nikola Tesla", lat: 44.8184, lon: 20.3094 },
  "LWSK": { name: "Skopje Intl", lat: 41.9616, lon: 21.6214 },
  "LATI": { name: "Tirana Intl", lat: 41.4147, lon: 19.7206 },
  "LIEE": { name: "Cagliari Elmas Airport", lat: 39.2515, lon: 9.0543 },
  "LICC": { name: "Catania Fontanarossa", lat: 37.4668, lon: 15.0664 },
  "LIMC": { name: "Milan Malpensa", lat: 45.6306, lon: 8.7281 },
  "LIRF": { name: "Rome Fiumicino", lat: 41.8003, lon: 12.2389 },
  "LIPZ": { name: "Venice Marco Polo", lat: 45.5053, lon: 12.3519 },
  "LPPT": { name: "Lisbon Humberto Delgado", lat: 38.7742, lon: -9.1342 },
  "LPFR": { name: "Faro Airport", lat: 37.0144, lon: -7.9659 },
  "LEMD": { name: "Madrid Barajas", lat: 40.4936, lon: -3.5668 },
  "LEBL": { name: "Barcelona El Prat", lat: 41.2974, lon: 2.0833 },
  "LEMG": { name: "Málaga Airport", lat: 36.6749, lon: -4.4991 },
  "EIDW": { name: "Dublin Airport", lat: 53.4213, lon: -6.2701 },
  "EKCH": { name: "Copenhagen Kastrup", lat: 55.6181, lon: 12.6561 },
  "ENGM": { name: "Oslo Gardermoen", lat: 60.1939, lon: 11.1004 },
  "ESSA": { name: "Stockholm Arlanda", lat: 59.6519, lon: 17.9186 },
  "EFHK": { name: "Helsinki Vantaa", lat: 60.3172, lon: 24.9633 },
  "VTBS": { name: "Suvarnabhumi Intl", lat: 13.6900, lon: 100.7501 },
  "VTBD": { name: "Don Mueang Intl", lat: 13.9126, lon: 100.6070 },
  "VTSP": { name: "Phuket Intl", lat: 8.1132, lon: 98.3169 },
  "VTSM": { name: "Samui Airport", lat: 9.5478, lon: 100.0620 },
  "VTCC": { name: "Chiang Mai Intl", lat: 18.7668, lon: 98.9626 },
  "VTPH": { name: "Hua Hin Airport", lat: 12.6362, lon: 99.9515 },
  "VVTS": { name: "Tan Son Nhat Intl (Ho Chi Minh)", lat: 10.8188, lon: 106.6520 },
  "VVNB": { name: "Noi Bai Intl (Hanoi)", lat: 21.2212, lon: 105.8069 },
  "VVCR": { name: "Cam Ranh Intl", lat: 11.9982, lon: 109.2190 },
  "VVPK": { name: "Phu Quoc Intl", lat: 10.2270, lon: 103.9631 },
  "VVVH": { name: "Vinh Airport", lat: 18.7376, lon: 105.6708 },
  "WMKK": { name: "Kuala Lumpur Intl", lat: 2.7456, lon: 101.7072 },
  "WMSA": { name: "Sultan Abdul Aziz Shah (Subang)", lat: 3.1306, lon: 101.5494 },
  "WMKP": { name: "Penang Intl", lat: 5.2971, lon: 100.2760 },
  "WMKD": { name: "Kuantan Airport", lat: 3.7754, lon: 103.2090 },
  "WBKK": { name: "Kota Kinabalu Intl", lat: 5.9372, lon: 116.0511 },
  "WBGR": { name: "Miri Airport", lat: 4.3220, lon: 113.9868 },
  "WBKL": { name: "Limbang Airport", lat: 4.8083, lon: 115.0100 },
  "WSSS": { name: "Singapore Changi", lat: 1.3644, lon: 103.9915 },
  "WSAP": { name: "Paya Lebar Air Base", lat: 1.3604, lon: 103.9101 },
  "WIDD": { name: "Hang Nadim Intl (Batam)", lat: 1.1210, lon: 104.1197 },
  "WIMM": { name: "Kualanamu Intl (Medan)", lat: 3.5592, lon: 98.6717 },
  "WIII": { name: "Soekarno–Hatta Intl (Jakarta)", lat: -6.1256, lon: 106.6558 },
  "WICB": { name: "Halim Perdanakusuma Intl (Jakarta)", lat: -6.2666, lon: 106.8904 },
  "WARR": { name: "Juanda Intl (Surabaya)", lat: -7.3798, lon: 112.7870 },
  "WADD": { name: "Ngurah Rai Intl (Denpasar)", lat: -8.7482, lon: 115.1675 },
  "WAMM": { name: "Sam Ratulangi Intl (Manado)", lat: 1.5492, lon: 124.9258 },
  "WAAA": { name: "Sultan Hasanuddin Intl (Makassar)", lat: -5.0616, lon: 119.5540 },
  "WIOO": { name: "Supadio Intl (Pontianak)", lat: -0.1507, lon: 109.4039 },
  "RPMD": { name: "Francisco Bangoy Intl (Davao)", lat: 7.1255, lon: 125.6458 },
  "RPLL": { name: "Ninoy Aquino Intl (Manila)", lat: 14.5086, lon: 121.0196 },
  "RPVM": { name: "Mactan–Cebu Intl", lat: 10.3075, lon: 123.9794 },
  "RPMZ": { name: "Zamboanga Intl", lat: 6.9224, lon: 122.0596 },
  "RPVP": { name: "Iloilo Intl", lat: 10.8330, lon: 122.4930 },
  "RPWE": { name: "Basco Airport", lat: 20.4513, lon: 121.9790 },
  "RPNS": { name: "Sibulan Airport (Dumaguete)", lat: 9.3337, lon: 123.3000 },
  "VDSR": { name: "Siem Reap Intl", lat: 13.4107, lon: 103.8130 },
  "VDPP": { name: "Phnom Penh Intl", lat: 11.5466, lon: 104.8440 },
  "VDBG": { name: "Battambang Airport", lat: 13.0956, lon: 103.2247 },
  "VLVT": { name: "Wattay Intl (Vientiane)", lat: 17.9883, lon: 102.5631 },
  "VLLB": { name: "Luang Prabang Intl", lat: 19.8979, lon: 102.1600 },
  "VLOS": { name: "Sam Neua Airport", lat: 20.4184, lon: 104.0679 },
  "VYYY": { name: "Yangon Intl", lat: 16.9073, lon: 96.1332 },
  "VYMD": { name: "Mandalay Intl", lat: 21.7022, lon: 95.9779 },
  "VYEL": { name: "Heho Airport", lat: 20.7470, lon: 96.7920 },
  "WPDL": { name: "Presidente Nicolau Lobato Intl (Dili)", lat: -8.5464, lon: 125.5260 },
  "WBSB": { name: "Brunei Intl", lat: 4.9442, lon: 114.9283 },
  "WBGB": { name: "Bintulu Airport", lat: 3.1239, lon: 113.0206 },
  "WBKD": { name: "Lahad Datu Airport", lat: 5.0323, lon: 118.3230 },
  "KRNO": { name: "Reno/Tahoe International Airport", lat: 39.4991, lon: -119.7681 },
  "RCQC": { name: "Magong Airport (Penghu)", lat: 23.5687, lon: 119.6276 },
  "KSEA": { name: "Seattle-Tacoma International Airport", lat: 47.4489, lon: -122.3094 },
  "KPDX": { name: "Portland International Airport", lat: 45.5887, lon: -122.5975 },
  "KPHX": { name: "Phoenix Sky Harbor Intl", lat: 33.4342, lon: -112.0116 },
  "KLAS": { name: "Harry Reid International Airport", lat: 36.0839, lon: -115.1523 },
  "KDEN": { name: "Denver International Airport", lat: 39.8617, lon: -104.6731 },
  "KMCI": { name: "Kansas City International Airport", lat: 39.2976, lon: -94.7139 },
  "KMSP": { name: "Minneapolis–St. Paul Intl", lat: 44.8819, lon: -93.2218 },
  "KMEM": { name: "Memphis International Airport", lat: 35.0424, lon: -89.9767 },
  "KBOS": { name: "Logan International Airport (Boston)", lat: 42.3656, lon: -71.0096 },
  "KBWI": { name: "Baltimore/Washington Intl", lat: 39.1754, lon: -76.6684 },
  "KIND": { name: "Indianapolis Intl Airport", lat: 39.7173, lon: -86.2944 },
  "KPIT": { name: "Pittsburgh Intl Airport", lat: 40.4915, lon: -80.2329 },
  "KCVG": { name: "Cincinnati/Northern Kentucky Intl", lat: 39.0488, lon: -84.6678 },
  "KRDU": { name: "Raleigh–Durham Intl Airport", lat: 35.8776, lon: -78.7875 },
  "KSLC": { name: "Salt Lake City Intl", lat: 40.7884, lon: -111.9778 },
  "KBOI": { name: "Boise Air Terminal", lat: 43.5644, lon: -116.2228 },
  "KTUS": { name: "Tucson International Airport", lat: 32.1161, lon: -110.9410 },
  "KEUG": { name: "Eugene Airport (Mahlon Sweet Field)", lat: 44.1246, lon: -123.2119 },
  "KABQ": { name: "Albuquerque Intl Sunport", lat: 35.0402, lon: -106.6090 },
  "KOAK": { name: "Oakland Intl", lat: 37.7213, lon: -122.2207 },
  "KSJC": { name: "San Jose Intl", lat: 37.3626, lon: -121.9290 },
  "KBUR": { name: "Bob Hope Airport (Burbank)", lat: 34.2007, lon: -118.3587 },
  "KLGB": { name: "Long Beach Airport", lat: 33.8177, lon: -118.1516 },
  "KONT": { name: "Ontario Intl Airport", lat: 34.0559, lon: -117.6005 },
  "VTBS": { name: "Suvarnabhumi Intl (Bangkok)", lat: 13.6900, lon: 100.7501 },
  "VTBD": { name: "Don Mueang Intl (Bangkok)", lat: 13.9126, lon: 100.6070 },
  "VTCC": { name: "Chiang Mai Intl", lat: 18.7668, lon: 98.9626 },
  "VTSP": { name: "Phuket Intl", lat: 8.1132, lon: 98.3169 },
  "VVTS": { name: "Tan Son Nhat Intl (Ho Chi Minh)", lat: 10.8188, lon: 106.6520 },
  "VVNB": { name: "Noi Bai Intl (Hanoi)", lat: 21.2212, lon: 105.8069 },
  "VVCR": { name: "Cam Ranh Intl", lat: 11.9982, lon: 109.2190 },
  "VVPK": { name: "Phu Quoc Intl", lat: 10.2270, lon: 103.9631 },
  "WMKK": { name: "Kuala Lumpur Intl", lat: 2.7456, lon: 101.7072 },
  "WMSA": { name: "Sultan Abdul Aziz Shah (Subang)", lat: 3.1306, lon: 101.5494 },
  "WMKP": { name: "Penang Intl", lat: 5.2971, lon: 100.2760 },
  "WBKK": { name: "Kota Kinabalu Intl", lat: 5.9372, lon: 116.0511 },
  "WBGR": { name: "Miri Airport", lat: 4.3220, lon: 113.9868 },
  "WBGG": { name: "Kuching Intl", lat: 1.4847, lon: 110.3469 },
  "WIII": { name: "Soekarno–Hatta Intl (Jakarta)", lat: -6.1256, lon: 106.6558 },
  "WADD": { name: "Ngurah Rai Intl (Bali)", lat: -8.7482, lon: 115.1675 },
  "WARR": { name: "Juanda Intl (Surabaya)", lat: -7.3798, lon: 112.7870 },
  "WAMM": { name: "Sam Ratulangi Intl (Manado)", lat: 1.5492, lon: 124.9258 },
  "RPVM": { name: "Mactan–Cebu Intl", lat: 10.3075, lon: 123.9794 },
  "RPLL": { name: "Ninoy Aquino Intl (Manila)", lat: 14.5086, lon: 121.0196 },
  "RPMD": { name: "Francisco Bangoy Intl (Davao)", lat: 7.1255, lon: 125.6458 },
  "RPVP": { name: "Iloilo Intl", lat: 10.8330, lon: 122.4930 },
  "RPLB": { name: "Subic Bay Intl", lat: 14.7944, lon: 120.2710 },
  "WSSS": { name: "Singapore Changi", lat: 1.3644, lon: 103.9915 },
  "VDPP": { name: "Phnom Penh Intl", lat: 11.5466, lon: 104.8440 },
  "VDSR": { name: "Siem Reap Intl", lat: 13.4107, lon: 103.8130 },
  "VLVT": { name: "Wattay Intl (Vientiane)", lat: 17.9883, lon: 102.5631 },
  "VLLB": { name: "Luang Prabang Intl", lat: 19.8979, lon: 102.1600 },
  "VYYY": { name: "Yangon Intl", lat: 16.9073, lon: 96.1332 },
  "WBSB": { name: "Brunei Intl", lat: 4.9442, lon: 114.9283 },
  "WPDL": { name: "Presidente Nicolau Lobato Intl (Dili)", lat: -8.5464, lon: 125.5260 },
};

  const ICON_MAP = {
    "cloud-ovc": "https://i.ibb.co/yFRh3vnr/cloud-ovc",
    "cloud-bkn": "https://i.ibb.co/Tx4r0N48/cloud-bkn.png",
    "cloud-sct": "https://i.ibb.co/S4znY40y/cloud-sct.png",
    "cloud-few": "https://i.ibb.co/VYfNTq34/cloud-few.png",
    "visibility": "https://i.ibb.co/3mPWNyw7/visibility.png",
    "pressure": "https://i.ibb.co/1tMJ2svB/pressure.png",
    "temperature": "https://i.ibb.co/N0TX606/temperature.png",
    "fog": "https://i.ibb.co/B2605gZ8/fog.png",
    "wind": "https://i.ibb.co/rfFL0X8v/wind.png"
  };

  const ICAO_TIMEZONES = {
  "KSFO": "America/Los_Angeles",
  "KLAX": "America/Los_Angeles",
  "RJTT": "Asia/Tokyo",
  "RCTP": "Asia/Taipei",
  "EGLL": "Europe/London",
  "LFPG": "Europe/Paris",
  "EDDF": "Europe/Berlin",
  "ZBAA": "Asia/Shanghai",
  "OMDB": "Asia/Dubai",
  "YSSY": "Australia/Sydney",
  "RJAA": "Asia/Tokyo",
  "WSSS": "Asia/Singapore",
  "EHAM": "Europe/Amsterdam",
  "CYYZ": "America/Toronto",
  "CYVR": "America/Vancouver",
  "VHHH": "Asia/Hong_Kong",
  "VIDP": "Asia/Kolkata",
  "RKSI": "Asia/Seoul",
  "NZAA": "Pacific/Auckland",
  "FAOR": "Africa/Johannesburg",
  "SAEZ": "America/Argentina/Buenos_Aires",
  "SCEL": "America/Santiago",
  "SBGR": "America/Sao_Paulo",
  "SEQM": "America/Guayaquil",
  "SKBO": "America/Bogota",
  "TJSJ": "America/Puerto_Rico",
  "MMMX": "America/Mexico_City",
  "LEMD": "Europe/Madrid",
  "LIRF": "Europe/Rome",
  "EDDM": "Europe/Berlin",
  "LOWW": "Europe/Vienna",
  "LFMN": "Europe/Paris",
  "EBBR": "Europe/Brussels",
  "EKCH": "Europe/Copenhagen",
  "ESSA": "Europe/Stockholm",
  "ENGM": "Europe/Oslo",
  "EFHK": "Europe/Helsinki",
  "ULLI": "Europe/Moscow",
  "LCLK": "Asia/Nicosia",
  "LTBA": "Europe/Istanbul",
  "LTFM": "Europe/Istanbul",
  "UUWW": "Europe/Moscow",
  "UUEE": "Europe/Moscow",
  "OMAA": "Asia/Dubai",
  "OERK": "Asia/Riyadh",
  "OEJN": "Asia/Riyadh",
  "OTHH": "Asia/Qatar",
  "OKBK": "Asia/Kuwait",
  "OJAI": "Asia/Amman",
  "DAAG": "Africa/Algiers",
  "DTTA": "Africa/Tunis",
  "HECA": "Africa/Cairo",
  "HKJK": "Africa/Nairobi",
  "DNMM": "Africa/Lagos",
  "GVAC": "Atlantic/Cape_Verde",
  "GMMN": "Africa/Casablanca",
  "FMEE": "Indian/Reunion",
  "FACT": "Africa/Johannesburg",
  "FIMP": "Indian/Mauritius",
  "AYPY": "Pacific/Port_Moresby",
  "NZCH": "Pacific/Auckland",
  "YMML": "Australia/Melbourne",
  "YPAD": "Australia/Adelaide",
  "YBBN": "Australia/Brisbane",
  "PANC": "America/Anchorage",
  "KSEA": "America/Los_Angeles",
  "KDEN": "America/Denver",
  "KORD": "America/Chicago",
  "KATL": "America/New_York",
  "KDFW": "America/Chicago",
  "KMIA": "America/New_York",
  "KPHX": "America/Phoenix",
  "KCLT": "America/New_York",
  "KBOS": "America/New_York",
  "KLGA": "America/New_York",
  "KJFK": "America/New_York",
  "KEWR": "America/New_York",
  "KMSP": "America/Chicago",
  "KDTW": "America/Detroit",
  "KIAD": "America/New_York",
  "KDCA": "America/New_York",
  "KTPA": "America/New_York",
  "KSLC": "America/Denver",
  "KPDX": "America/Los_Angeles",
  "KSAN": "America/Los_Angeles",
  "KLAS": "America/Los_Angeles",
  "KMDW": "America/Chicago",
  "KBWI": "America/New_York",
  "PHNL": "Pacific/Honolulu",
  "PHTO": "Pacific/Honolulu",
  "PAFA": "America/Anchorage",
  "PANC": "America/Anchorage",
  "PGUM": "Pacific/Guam",
  "UHPP": "Asia/Kamchatka",
  "UAAA": "Asia/Almaty",
  "UTTT": "Asia/Tashkent",
  "UBBB": "Asia/Baku",
  "UKBB": "Europe/Kiev",
  "LBSF": "Europe/Sofia",
  "LROP": "Europe/Bucharest",
  "LDZA": "Europe/Zagreb",
  "LJLJ": "Europe/Ljubljana",
  "ROAH": "Asia/Tokyo",
  "ZGSZ": "Asia/Shanghai",
  "RJGG": "Asia/Tokyo",
  "VTBS": "Asia/Bangkok",
  "WMKK": "Asia/Kuala_Lumpur",
  "WIII": "Asia/Jakarta",
  "YPAD": "Australia/Adelaide",
  "NZWN": "Pacific/Auckland",
  "YPPH": "Australia/Perth",
  "NTAA": "Pacific/Tahiti",
  "PHNL": "Pacific/Honolulu",
  "PANC": "America/Anchorage",
  "CYUL": "America/Toronto",
  "CYYC": "America/Edmonton",
  "SEGU": "America/Guayaquil",
  "SLLP": "America/La_Paz",
  "SPZO": "America/Lima",
  "SUMU": "America/Montevideo",
  "SAME": "America/Argentina/Mendoza",
  "SBSP": "America/Sao_Paulo",
  "FQMA": "Africa/Maputo",
  "HBBA": "Africa/Bujumbura",
  "HSSS": "Africa/Khartoum",
  "HEGN": "Africa/Cairo",
  "DAAG": "Africa/Algiers",
  "GMMX": "Africa/Casablanca",
  "GQNN": "Africa/Nouakchott",
  "DTMB": "Africa/Tunis",
  "LATI": "Europe/Tirane",
  "LCLK": "Asia/Nicosia",
  "LYBE": "Europe/Belgrade",
  "LBSF": "Europe/Sofia",
  "LHBP": "Europe/Budapest",
  "LROP": "Europe/Bucharest",
  "EVRA": "Europe/Riga",
  "EFHK": "Europe/Helsinki",
  "LOWW": "Europe/Vienna",
  "LWSK": "Europe/Skopje",
  "LPPT": "Europe/Lisbon",
  "LEBL": "Europe/Madrid",
  "EIDW": "Europe/Dublin",
  "LTFM": "Europe/Istanbul",
  "UBBB": "Asia/Baku",
  "UTTT": "Asia/Tashkent",
  "UUEE": "Europe/Moscow",
  "UKBB": "Europe/Kiev",
  "LZIB": "Europe/Bratislava",
  "BIKF": "Atlantic/Reykjavik",
  "BGSF": "America/Godthab",
  "BGGH": "America/Godthab",
  "EGLC": "Europe/London",
  "EGLL": "Europe/London",
  "EGKK": "Europe/London",
  "EGSS": "Europe/London",
  "EGGW": "Europe/London",
  "EGCC": "Europe/London",
  "EGNX": "Europe/London",
  "EGGD": "Europe/London",
  "EGHI": "Europe/London",
  "EGPD": "Europe/London",
  "EGPH": "Europe/London",
  "EGAA": "Europe/London",
  "LFPG": "Europe/Paris",
  "LFPO": "Europe/Paris",
  "LFML": "Europe/Paris",
  "LFMN": "Europe/Paris",
  "LFBD": "Europe/Paris",
  "LFBO": "Europe/Paris",
  "EDDF": "Europe/Berlin",
  "EDDB": "Europe/Berlin",
  "EDDH": "Europe/Berlin",
  "EDDM": "Europe/Berlin",
  "EDDL": "Europe/Berlin",
  "EDDV": "Europe/Berlin",
  "LOWW": "Europe/Vienna",
  "LZIB": "Europe/Bratislava",
  "LKPR": "Europe/Prague",
  "LHBP": "Europe/Budapest",
  "LROP": "Europe/Bucharest",
  "LBSF": "Europe/Sofia",
  "LDZA": "Europe/Zagreb",
  "LJLJ": "Europe/Ljubljana",
  "LYBE": "Europe/Belgrade",
  "LWSK": "Europe/Skopje",
  "LATI": "Europe/Tirane",
  "LIEE": "Europe/Rome",
  "LICC": "Europe/Rome",
  "LIMC": "Europe/Rome",
  "LIRF": "Europe/Rome",
  "LIPZ": "Europe/Rome",
  "LPPT": "Europe/Lisbon",
  "LPFR": "Europe/Lisbon",
  "LEMD": "Europe/Madrid",
  "LEBL": "Europe/Madrid",
  "LEMG": "Europe/Madrid",
  "EIDW": "Europe/Dublin",
  "EKCH": "Europe/Copenhagen",
  "ENGM": "Europe/Oslo",
  "ESSA": "Europe/Stockholm",
  "EFHK": "Europe/Helsinki",
  "VTBS": "Asia/Bangkok",
  "VTBD": "Asia/Bangkok",
  "VTSP": "Asia/Bangkok",
  "VTSM": "Asia/Bangkok",
  "VTCC": "Asia/Bangkok",
  "VTPH": "Asia/Bangkok",
  "VVTS": "Asia/Ho_Chi_Minh",
  "VVNB": "Asia/Bangkok",
  "VVCR": "Asia/Ho_Chi_Minh",
  "VVPK": "Asia/Phnom_Penh",
  "VVVH": "Asia/Bangkok",
  "WMKK": "Asia/Kuala_Lumpur",
  "WMSA": "Asia/Kuala_Lumpur",
  "WMKP": "Asia/Kuala_Lumpur",
  "WMKD": "Asia/Kuala_Lumpur",
  "WBKK": "Asia/Kuching",
  "WBGR": "Asia/Kuching",
  "WBKL": "Asia/Kuching",
  "WSSS": "Asia/Singapore",
  "WSAP": "Asia/Singapore",
  "WIDD": "Asia/Jakarta",
  "WIMM": "Asia/Jakarta",
  "WIII": "Asia/Jakarta",
  "WICB": "Asia/Jakarta",
  "WARR": "Asia/Jakarta",
  "WADD": "Asia/Makassar",
  "WAMM": "Asia/Makassar",
  "WAAA": "Asia/Makassar",
  "WIOO": "Asia/Pontianak",
  "RPMD": "Asia/Manila",
  "RPLL": "Asia/Manila",
  "RPVM": "Asia/Manila",
  "RPMZ": "Asia/Manila",
  "RPVP": "Asia/Manila",
  "RPWE": "Asia/Manila",
  "RPNS": "Asia/Manila",
  "VDSR": "Asia/Phnom_Penh",
  "VDPP": "Asia/Phnom_Penh",
  "VDBG": "Asia/Phnom_Penh",
  "VLVT": "Asia/Vientiane",
  "VLLB": "Asia/Vientiane",
  "VLOS": "Asia/Vientiane",
  "VYYY": "Asia/Yangon",
  "VYMD": "Asia/Yangon",
  "VYEL": "Asia/Yangon",
  "WPDL": "Asia/Makassar",
  "WBSB": "Asia/Brunei",
  "WBGB": "Asia/Kuching",
  "WBKD": "Asia/Kuching",
  "KRNO": "America/Los_Angeles",
  "RCQC": "Asia/Taipei",
  "KSEA": "America/Los_Angeles",
  "KPDX": "America/Los_Angeles",
  "KPHX": "America/Phoenix",
  "KLAS": "America/Los_Angeles",
  "KDEN": "America/Denver",
  "KMCI": "America/Chicago",
  "KMSP": "America/Chicago",
  "KMEM": "America/Chicago",
  "KBOS": "America/New_York",
  "KBWI": "America/New_York",
  "KIND": "America/Indiana/Indianapolis",
  "KPIT": "America/New_York",
  "KCVG": "America/New_York",
  "KRDU": "America/New_York",
  "KSLC": "America/Denver",
  "KBOI": "America/Boise",
  "KTUS": "America/Phoenix",
  "KEUG": "America/Los_Angeles",
  "KABQ": "America/Denver",
  "KOAK": "America/Los_Angeles",
  "KSJC": "America/Los_Angeles",
  "KBUR": "America/Los_Angeles",
  "KLGB": "America/Los_Angeles",
  "KONT": "America/Los_Angeles",
  "VTBS": "Asia/Bangkok",
  "VTBD": "Asia/Bangkok",
  "VTCC": "Asia/Bangkok",
  "VTSP": "Asia/Bangkok",
  "VVTS": "Asia/Ho_Chi_Minh",
  "VVNB": "Asia/Bangkok",
  "VVCR": "Asia/Ho_Chi_Minh",
  "VVPK": "Asia/Phnom_Penh",
  "WMKK": "Asia/Kuala_Lumpur",
  "WMSA": "Asia/Kuala_Lumpur",
  "WMKP": "Asia/Kuala_Lumpur",
  "WBKK": "Asia/Kuching",
  "WBGR": "Asia/Kuching",
  "WBGG": "Asia/Kuching",
  "WIII": "Asia/Jakarta",
  "WADD": "Asia/Makassar",
  "WARR": "Asia/Jakarta",
  "WAMM": "Asia/Makassar",
  "RPVM": "Asia/Manila",
  "RPLL": "Asia/Manila",
  "RPMD": "Asia/Manila",
  "RPVP": "Asia/Manila",
  "RPLB": "Asia/Manila",
  "WSSS": "Asia/Singapore",
  "VDPP": "Asia/Phnom_Penh",
  "VDSR": "Asia/Phnom_Penh",
  "VLVT": "Asia/Vientiane",
  "VLLB": "Asia/Vientiane",
  "VYYY": "Asia/Yangon",
  "WBSB": "Asia/Brunei",
  "WPDL": "Asia/Makassar",
};

  async function fetchMETAR(icao) {
    try {
      const res = await fetch(`https://metar.vatsim.net/metar.php?id=${icao}`);
      return await res.text();
    } catch (e) {
      console.error("❌ METAR Fetch Error:", e);
      return null;
    }
  }

  function getTimeInTimeZone(tz) {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz === "arrival" ? "UTC" : tz
    });
    const [h, m, s] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, s, 0);
    return d;
  }

  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function findNearestAirport(lat, lon) {
    let nearest = null;
    let minDist = Infinity;
    for (const icao in AIRPORTS) {
      const ap = AIRPORTS[icao];
      const d = getDistanceKm(lat, lon, ap.lat, ap.lon);
      if (d < minDist) {
        minDist = d;
        nearest = icao;
      }
    }
    return nearest;
  }

  function rotateClock(svg, now) {
    const hour = svg.querySelector("line[id$='-hour']");
    const minute = svg.querySelector("line[id$='-minute']");
    const second = svg.querySelector("line[id$='-second']");
    const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
    hour.setAttribute("transform", `rotate(${h * 30 + m * 0.5 + s * (0.5 / 60)} 20 20)`);
    minute.setAttribute("transform", `rotate(${m * 6 + s * 0.1} 20 20)`);
    second.setAttribute("transform", `rotate(${s * 6} 20 20)`);
  }

  function createClockSVG(id, label) {
    const container = document.createElement("div");
    container.style.textAlign = "center";
    container.style.fontSize = "10px";
    container.innerHTML = `<div>${label}</div>`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "40");
    svg.setAttribute("height", "40");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.innerHTML = `
      <circle cx="20" cy="20" r="18" fill="white" stroke="black" stroke-width="1"/>
      <line id="${id}-hour" x1="20" y1="20" x2="20" y2="11" stroke="black" stroke-width="2"/>
      <line id="${id}-minute" x1="20" y1="20" x2="20" y2="7" stroke="black" stroke-width="1"/>
      <line id="${id}-second" x1="20" y1="20" x2="20" y2="5" stroke="red" stroke-width="0.5"/>
    `;
    container.appendChild(svg);
    return container;
  }

  function getTimezoneByICAO(icao) {
    return ICAO_TIMEZONES[icao] || "arrival";
  }

  function makeDraggable(el) {
    let isDragging = false, offsetX = 0, offsetY = 0;
    el.style.cursor = "move";
    el.addEventListener("mousedown", function (e) {
      isDragging = true;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
      document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", function (e) {
      if (isDragging) {
        el.style.left = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - el.offsetWidth)) + "px";
        el.style.top = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - el.offsetHeight)) + "px";
        el.style.right = "auto";
      }
    });
    document.addEventListener("mouseup", function () {
      isDragging = false;
      document.body.style.userSelect = "";
    });
  }

  function showWidget(metar, icao) {
    if (window.geofsMetarWidget) window.geofsMetarWidget.remove();
    if (window.geofsMetarScheduledTimeout) clearTimeout(window.geofsMetarScheduledTimeout);

    const widget = document.createElement("div");
    window.geofsMetarWidget = widget;
    widget.style.cssText = `
      position: fixed; top: 10px; right: 10px;
      background: rgba(0, 0, 0, 0.7); color: white;
      padding: 10px; border-radius: 10px;
      font: 12px monospace; z-index: 9999;
    `;

    const city = AIRPORTS[icao]?.name || icao;
    const title = document.createElement("div");
    title.textContent = `METAR @ ${city}`;
    title.style.marginBottom = "6px";
    widget.appendChild(title);

    const refreshBtn = document.createElement("button");
    refreshBtn.textContent = "⟳";
    refreshBtn.style.cssText = "margin-bottom: 6px; cursor:pointer;";
    refreshBtn.onclick = async () => {
      const pos = geofs?.aircraft?.instance?.llaLocation;
      if (pos?.length >= 2) {
        const [lat, lon] = pos;
        const nearest = findNearestAirport(lat, lon);
        if (nearest) {
          const newMetar = await fetchMETAR(nearest);
          if (newMetar) showWidget(newMetar, nearest);
        }
      }
    };
    widget.appendChild(refreshBtn);

    const tz = ICAO_TIMEZONES[icao] || null;
    const name = AIRPORTS[icao]?.name || icao;
    const tzLabel = tz ? name.split(" ")[0] : "Local Time";


    const locClock = createClockSVG("loc", "UTC");
    const icaoClock = createClockSVG("icao", tzLabel);


    const clockBox = document.createElement("div");
    clockBox.style.display = "flex";
    clockBox.style.justifyContent = "space-around";
    clockBox.appendChild(locClock);
    clockBox.appendChild(icaoClock);
    widget.appendChild(clockBox);

    const iconRow = document.createElement("div");
    iconRow.style.marginTop = "8px";

    function updateClocks() {
      rotateClock(locClock, getTimeInTimeZone("UTC"));
      rotateClock(icaoClock, getTimeInTimeZone(tz || Intl.DateTimeFormat().resolvedOptions().timeZone));

    }

    updateClocks();
    setInterval(updateClocks, 1000);

    function scheduleNextMetarUpdate() {
      const now = new Date();
      const min = now.getMinutes();
      const sec = now.getSeconds();
      const delay = ((min < 30 ? 30 : 60) * 60 - min * 60 - sec) * 1000;
      window.geofsMetarScheduledTimeout = setTimeout(async () => {
        const newMetar = await fetchMETAR(icao);
        if (newMetar) showWidget(newMetar, icao);
      }, delay);
    }

    scheduleNextMetarUpdate();

    const w = metar.match(/((\d{3}|VRB))(\d{2})KT/);
    const vis = metar.match(/ (\d{4}) /);
    const cloud = metar.match(/(FEW|SCT|BKN|OVC)(\d{3})/);
    const temp = metar.match(/ (M?\d{2})\/(M?\d{2}) /);
    const qnh = metar.match(/Q(\d{4})/);
    const fog = /FG|BR/.test(metar);

    function addIcon(name, text) {
      const d = document.createElement("div");
      d.style.display = "flex";
      d.style.alignItems = "center";
      d.style.marginBottom = "3px";
      const i = document.createElement("img");
      i.src = ICON_MAP[name];
      i.style.width = "20px";
      i.style.marginRight = "6px";
      const t = document.createElement("span");
      t.textContent = text;
      d.appendChild(i);
      d.appendChild(t);
      iconRow.appendChild(d);
    }

    if (w) addIcon("wind", `${w[1]}° ${w[3]}kt`);
    if (vis) addIcon("visibility", `${parseInt(vis[1]) / 1000} km`);
    if (cloud) addIcon(`cloud-${cloud[1].toLowerCase()}`, `${cloud[1]} @ ${parseInt(cloud[2]) * 100}ft`);
    if (temp) {
      const t1 = temp[1].replace("M", "-");
      const t2 = temp[2].replace("M", "-");
      addIcon("temperature", `${t1}°C / ${t2}°C`);
    }
    if (qnh) addIcon("pressure", `Q${qnh[1]}`);
    if (fog) addIcon("fog", "Fog/Mist");

    widget.appendChild(iconRow);
    document.body.appendChild(widget);
    makeDraggable(widget);
  }

  const defaultICAO = "RCTP";
  fetchMETAR(defaultICAO).then(metar => {
    if (metar) showWidget(metar, defaultICAO);
  });

  // Keyboard toggle for widget visibility (press W)
  document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() === "w") {
      const w = window.geofsMetarWidget;
      if (w) {
        w.style.display = (w.style.display === "none") ? "block" : "none";
      }
    }
  });

})();
