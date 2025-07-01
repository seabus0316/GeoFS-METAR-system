// ==UserScript==
// @name         GeoFS METAR system
// @version      2.5
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
};

  const ICON_MAP = {
    "cloud-ovc": "https://i.ibb.co/yFRh3vnr/cloud-ovc",
    "cloud-bkn": "https://i.ibb.co/zTP5nNMz/cloud-bkn.png",
    "cloud-sct": "https://i.ibb.co/8n08wSXb/cloud-sct.png",
    "cloud-few": "https://i.ibb.co/VYfNTq34/cloud-few.png",
    "visibility": "https://i.ibb.co/3mPWNyw7/visibility.png",
    "pressure": "https://i.ibb.co/1tMJ2svB/pressure.png",
    "temperature": "https://i.ibb.co/N0TX606/temperature.png",
    "fog": "https://i.ibb.co/B2605gZ8/fog.png",
    "wind": "https://i.ibb.co/rfFL0X8v/wind.png"
  };

  const ICAO_TIMEZONES = {
    "RCTP": "Asia/Taipei", "RJTT": "Asia/Tokyo", "RJAA": "Asia/Tokyo",
    "VHHH": "Asia/Hong_Kong", "ZBAA": "Asia/Shanghai", "WSSS": "Asia/Singapore",
    "KLAX": "America/Los_Angeles", "KSFO": "America/Los_Angeles", "KJFK": "America/New_York",
    "EGLL": "Europe/London", "LFPG": "Europe/Paris", "EDDF": "Europe/Berlin"
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
    return minDist <= 150 ? nearest : null;
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

    const tz = getTimezoneByICAO(icao);
    const tzLabel = tz === "arrival" ? "Arrival" : tz.split("/").pop().replace("_", " ");
    const locClock = createClockSVG("loc", "Local");
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
      rotateClock(locClock, new Date());
      rotateClock(icaoClock, getTimeInTimeZone(tz));
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
})();
