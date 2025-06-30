// ==UserScript==
// @name         GeoFS METAR system
// @version      2.1
// @description  METAR widget with smart timing refresh, city name, dual clocks and icons for GeoFS flight sim
// @author       seabus
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// @icon         https://i.ibb.co/wZ2SB149/Chat-GPT-Image-2025-6-30-08-31-37.png
// ==/UserScript==

(function () {
  if (window.geofsMetarAlreadyLoaded) return;
  window.geofsMetarAlreadyLoaded = true;

  const ICAO_LOCATION_NAMES = {
    "CYVR": "Vancouver, Canada", "CYYZ": "Toronto Pearson, Canada",
    "EDDF": "Frankfurt, Germany", "EGLL": "London Heathrow, UK", "EHAM": "Amsterdam Schiphol, Netherlands",
    "FAOR": "Johannesburg OR Tambo, South Africa",
    "KATL": "Atlanta, USA", "KDEN": "Denver, USA", "KDFW": "Dallas-Fort Worth, USA",
    "KJFK": "New York JFK, USA", "KLAX": "Los Angeles, USA", "KORD": "Chicago O'Hare, USA",
    "KSEA": "Seattle, USA", "KSFO": "San Francisco, USA",
    "LEMD": "Madrid Barajas, Spain", "LFPG": "Paris Charles de Gaulle, France", "LIRF": "Rome Fiumicino, Italy",
    "NZAA": "Auckland, New Zealand",
    "OERK": "Riyadh, Saudi Arabia", "OMDB": "Dubai International, UAE",
    "RCTP": "Taipei Taoyuan, Taiwan",
    "RJAA": "Tokyo Narita, Japan", "RJTT": "Tokyo Haneda, Japan", "RKSI": "Seoul Incheon, Korea",
    "UUEE": "Moscow Sheremetyevo, Russia",
    "VABB": "Mumbai Chhatrapati Shivaji, India", "VIDP": "Delhi Indira Gandhi, India",
    "VHHH": "Hong Kong", "VTBS": "Bangkok Suvarnabhumi, Thailand",
    "WIII": "Jakarta Soekarno–Hatta, Indonesia", "WMKK": "Kuala Lumpur, Malaysia",
    "WSSS": "Singapore Changi",
    "YPPH": "Perth, Australia", "YPAD": "Adelaide, Australia", "YSSY": "Sydney Kingsford Smith, Australia"
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
    "RCTP": "Asia/Taipei", "RJTT": "Asia/Tokyo", "RJAA": "Asia/Tokyo", "RKSI": "Asia/Seoul",
    "VHHH": "Asia/Hong_Kong", "WSSS": "Asia/Singapore", "VTBS": "Asia/Bangkok", "WIII": "Asia/Jakarta",
    "WMKK": "Asia/Kuala_Lumpur", "VIDP": "Asia/Kolkata", "VABB": "Asia/Kolkata",
    "ZBAA": "Asia/Shanghai", "ZSPD": "Asia/Shanghai", "RC": "Asia/Taipei", "ZB": "Asia/Shanghai",
    "YSSY": "Australia/Sydney", "YPAD": "Australia/Adelaide", "YPPH": "Australia/Perth",
    "NZAA": "Pacific/Auckland",
    "OMDB": "Asia/Dubai", "OERK": "Asia/Riyadh",
    "EGLL": "Europe/London", "LFPG": "Europe/Paris", "EDDF": "Europe/Berlin", "EHAM": "Europe/Amsterdam",
    "LEMD": "Europe/Madrid", "LIRF": "Europe/Rome", "UUEE": "Europe/Moscow",
    "K": "America/New_York", "KATL": "America/New_York", "KJFK": "America/New_York",
    "KLAX": "America/Los_Angeles", "KSFO": "America/Los_Angeles", "KORD": "America/Chicago",
    "KSEA": "America/Los_Angeles", "KDFW": "America/Chicago", "KDEN": "America/Denver",
    "CYYZ": "America/Toronto", "CYVR": "America/Vancouver",
    "FAOR": "Africa/Johannesburg"
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

  function rotateClock(svg, now) {
    const hour = svg.querySelector("line[id$='-hour']");
    const minute = svg.querySelector("line[id$='-minute']");
    const second = svg.querySelector("line[id$='-second']");
    const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
    hour.setAttribute("transform", `rotate(${h * 30 + m * 0.5 + s * (0.5 / 60)} 20 20)`);
    minute.setAttribute("transform", `rotate(${m * 6 + s * 0.1} 20 20)`);
    second.setAttribute("transform", `rotate(${s * 6} 20 20)`);
  }

  function getTimezoneByICAO(icao) {
    const prefix4 = icao.substring(0, 4);
    const prefix2 = icao.substring(0, 2);
    return ICAO_TIMEZONES[prefix4] || ICAO_TIMEZONES[prefix2] || "arrival";
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

    const city = ICAO_LOCATION_NAMES[icao] || icao;
    const title = document.createElement("div");
    title.textContent = `METAR @ ${city}`;
    title.style.marginBottom = "6px";
    widget.appendChild(title);

    let currentICAO = icao;

    const input = document.createElement("input");
    input.placeholder = "Enter ICAO";
    input.maxLength = 4;
    input.style = "width: 80px; margin-bottom: 6px; text-transform: uppercase;";
    input.value = icao;

    ["keydown", "keyup", "keypress"].forEach(eventName => {
      input.addEventListener(eventName, (e) => {
        if (e.key !== "Enter") {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      });
    });

    const refreshBtn = document.createElement("button");
    refreshBtn.textContent = "⟳";
    refreshBtn.style.cssText = "margin-left: 6px; cursor:pointer;";
    refreshBtn.onclick = async () => {
      const newMetar = await fetchMETAR(currentICAO);
      if (newMetar) showWidget(newMetar, currentICAO);
    };

    widget.appendChild(input);
    widget.appendChild(refreshBtn);

    const clockBox = document.createElement("div");
    clockBox.style.display = "flex";
    clockBox.style.justifyContent = "space-around";

    const tz = getTimezoneByICAO(icao);
    const tzLabel = tz === "arrival" ? "Arrival" : tz.split("/").pop().replace("_", " ");
    const locClock = createClockSVG("loc", "Local");
    const icaoClock = createClockSVG("icao", tzLabel);

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

    // 🔁 Smart schedule: next refresh at :00 or :30
    function scheduleNextMetarUpdate() {
      const now = new Date();
      const min = now.getMinutes();
      const sec = now.getSeconds();
      const delay = ((min < 30 ? 30 : 60) * 60 - min * 60 - sec) * 1000;

      window.geofsMetarScheduledTimeout = setTimeout(async () => {
        const newMetar = await fetchMETAR(currentICAO);
        if (newMetar) showWidget(newMetar, currentICAO); // Recursive call
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

  const defaultICAO = "RCTP";
  fetchMETAR(defaultICAO).then(metar => {
    if (metar) showWidget(metar, defaultICAO);
  });

})();
