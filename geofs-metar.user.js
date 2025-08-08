// ==UserScript==
// @name         GeoFS METAR system
// @version      4.2.5
// @description  METAR widget: API KEY via settings, English toast, input no autocomplete, input disables GeoFS hotkeys
// @author       seabus + Copilot
// @updateURL    https://raw.githubusercontent.com/seabus0316/GeoFS-METAR-system/main/geofs-metar.user.js
// @downloadURL  https://raw.githubusercontent.com/seabus0316/GeoFS-METAR-system/main/geofs-metar.user.js
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
  // ===== Toast (top right) =====
  function showToast(msg, duration = 2500) {
    let toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 99999;
      background: #333; color: #fff; padding: 12px 24px; border-radius: 6px;
      font-size: 14px; box-shadow: 0 2px 12px #0004;
      opacity: 0; transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = "1", 10);
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 350); }, duration);
  }

  // ======= Update check (English) =======
  const CURRENT_VERSION = '4.2.5';
  const VERSION_JSON_URL = 'https://raw.githubusercontent.com/seabus0316/GeoFS-METAR-system/main/version.json';

  (function checkUpdate() {
    const last = +localStorage.getItem("geofs_metar_last_update_check") || 0;
    const now = Date.now();
    if (now - last < 86400 * 1000) return;
    localStorage.setItem("geofs_metar_last_update_check", now);
    fetch(VERSION_JSON_URL)
      .then(r => r.json())
      .then(data => {
        if (data.version && data.version !== CURRENT_VERSION) {
          showToast(`🚩 GeoFS METAR System new version available (${data.version})! Please reinstall the latest user.js from GitHub.`);
        }
      })
      .catch(() => {});
  })();

  if (window.geofsMetarAlreadyLoaded) return;
  window.geofsMetarAlreadyLoaded = true;

  window.geofsMetarWidgetLastPos = null;
  window.geofsMetarWidgetLastDisplay = null;

  const defaultICAO = "RCTP";
  const airportDataURL = "https://raw.githubusercontent.com/seabus0316/GeoFS-METAR-system/main/airports_with_tz.json";

  let AIRPORTS = {};
  let ICAO_TIMEZONES = {};

  const ICON_MAP = {
    "cloud-ovc": "https://i.ibb.co/KnY57pG/cloud-ovc.png",
    "cloud-bkn": "https://i.ibb.co/Tx4r0N48/cloud-bkn.png",
    "cloud-sct": "https://i.ibb.co/S4znY40y/cloud-sct.png",
    "cloud-few": "https://i.ibb.co/VYfNTq34/cloud-few.png",
    "visibility": "https://i.ibb.co/3mPWNyw7/visibility.png",
    "pressure": "https://i.ibb.co/1tMJ2svB/pressure.png",
    "temperature": "https://i.ibb.co/N0TX606/temperature.png",
    "fog": "https://i.ibb.co/B2605gZ8/fog.png",
    "wind": "https://i.ibb.co/rfFL0X8v/wind.png"
  };

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
    let nearest = null, minDist = Infinity;
    for (const icao in AIRPORTS) {
      const ap = AIRPORTS[icao];
      const dist = getDistanceKm(lat, lon, ap.lat, ap.lon);
      if (dist < minDist) {
        minDist = dist;
        nearest = icao;
      }
    }
    return nearest || defaultICAO;
  }

  async function fetchAirportData() {
    try {
      const res = await fetch(airportDataURL);
      const json = await res.json();
      for (const icao in json) {
        AIRPORTS[icao] = {
          name: json[icao].name,
          lat: json[icao].lat,
          lon: json[icao].lon
        };
        ICAO_TIMEZONES[icao] = json[icao].tz || "UTC";
      }
      startMETAR();
    } catch (e) {
      console.error("❌ Failed to load airport data:", e);
      showToast("⚠️ Failed to load airport database. METAR system disabled.");
    }
  }

  async function fetchMETAR(icao) {
    let apiKey = localStorage.getItem("avwx_key");
    if (!apiKey) {
      return null;
    }
    try {
      const res = await fetch(`https://avwx.rest/api/metar/${icao}?format=json`, {
        headers: { Authorization: apiKey }
      });
      if (!res.ok) {
        showToast("❌ Failed to fetch METAR. Please check your API KEY.");
        return null;
      }
      const data = await res.json();
      return data.raw || null;
    } catch (e) {
      console.error("❌ METAR Fetch Error:", e);
      showToast("❌ Failed to fetch METAR.");
      return null;
    }
  }

  function getTimeInTimeZone(tz) {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz
    });
    const [h, m, s] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, s, 0);
    return d;
  }

  function rotateClock(svg, now) {
    const hour = svg.querySelector("line[id$='-hour']");
    const minute = svg.querySelector("line[id$='-minute']");
    if (!hour || !minute) return;
    const h = now.getHours() % 12, m = now.getMinutes();
    hour.setAttribute("transform", `rotate(${h * 30 + m * 0.5} 20 20)`);
    minute.setAttribute("transform", `rotate(${m * 6} 20 20)`);
  }

  function createClockSVG(id, label, timeZone) {
    const container = document.createElement("div");
    container.style.textAlign = "center";
    container.style.fontSize = "10px";
    container.innerHTML = `<div>${label}</div>`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "40");
    svg.setAttribute("height", "40");
    svg.setAttribute("viewBox", "0 0 40 40");
    let hourNow = 12;
    try {
      const tStr = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", timeZone });
      hourNow = parseInt(tStr, 10);
    } catch {}
    const isDay = hourNow >= 6 && hourNow < 18;
    const clockFaceURL = isDay
      ? "https://clock-day.short.gy/0Fxzwe"
      : "https://clock-day.short.gy/2ZpDoNight";
    const pointerColor = isDay ? "black" : "white";

    svg.innerHTML = `
      <defs>
        <clipPath id="clockClip">
          <circle cx="20" cy="20" r="18"/>
        </clipPath>
        <g id="clockHands-${id}">
          <line id="${id}-hour" x1="20" y1="20" x2="20" y2="11" stroke="${pointerColor}" stroke-width="2"/>
          <line id="${id}-minute" x1="20" y1="20" x2="20" y2="7" stroke="${pointerColor}" stroke-width="1"/>
        </g>
      </defs>
      <image href="${clockFaceURL}" x="0" y="0" width="40" height="40" clip-path="url(#clockClip)"/>
      <use href="#clockHands-${id}"/>
    `;
    container.appendChild(svg);
    return container;
  }

  function makeDraggable(el) {
    let isDragging = false, offsetX = 0, offsetY = 0;
    el.style.cursor = "move";
    el.addEventListener("mousedown", e => {
      isDragging = true;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
      document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", e => {
      if (isDragging) {
        el.style.left = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - el.offsetWidth)) + "px";
        el.style.top = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - el.offsetHeight)) + "px";
        el.style.right = "auto";
        el.style.position = "fixed";
        window.geofsMetarWidgetLastPos = {
          left: el.style.left,
          top: el.style.top
        };
      }
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "";
    });
  }

  function showApiKeyInputDialog() {
    // Custom input dialog
    let overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100000;
      background:rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;
    `;
    let box = document.createElement("div");
    box.style.cssText = `
      background:#222;padding:24px 20px;border-radius:8px;box-shadow:0 4px 24px #0007;
      min-width:320px;display:flex;flex-direction:column;gap:10px;align-items:stretch;
    `;
    let title = document.createElement("div");
    title.textContent = "Enter your AVWX API Key";
    title.style.cssText = "color:#fff;font-size:16px;margin-bottom:6px;";
    let input = document.createElement("input");
    input.type = "text";
    input.style.cssText = "padding:8px;font-size:15px;border-radius:4px;border:1px solid #888;background:#181818;color:#fff;";
    input.value = localStorage.getItem("avwx_key") || "";
    input.placeholder = "Input key, or type clear to remove";
    input.setAttribute("autocomplete", "off");
    input.addEventListener("keydown", function(e) {
      e.stopPropagation(); // Prevent GeoFS hotkeys
    });
    let row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;margin-top:12px;justify-content:flex-end";
    let okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.cssText = "padding:6px 18px;border-radius:4px;border:none;background:#5bcfff;color:#222;font-weight:bold;";
    let cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = "padding:6px 18px;border-radius:4px;border:none;background:#888;color:#fff;";
    row.appendChild(okBtn); row.appendChild(cancelBtn);
    box.appendChild(title);
    box.appendChild(input);
    box.appendChild(row);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    input.focus();
    okBtn.onclick = () => {
      let val = input.value.trim();
      if (!val) {
        showToast("⚠️ Content cannot be empty");
        return;
      }
      if (val.toLowerCase() === "clear") {
        localStorage.removeItem("avwx_key");
        showToast("🗑️ API key removed.");
      } else {
        localStorage.setItem("avwx_key", val);
        showToast("✅ API key saved.");
      }
      document.body.removeChild(overlay);
    };
    cancelBtn.onclick = () => document.body.removeChild(overlay);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { okBtn.onclick(); e.preventDefault(); }
      if (e.key === "Escape") { cancelBtn.onclick(); e.preventDefault(); }
    });
    overlay.addEventListener("click", e => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }

  function showWidget(metar, icao, mode = "auto") {
    if (window.geofsMetarWidget) window.geofsMetarWidget.remove();
    const widget = document.createElement("div");
    window.geofsMetarWidget = widget;
    widget.style.cssText = `
      position: fixed; top: 10px; right: 10px;
      background: rgba(0,0,0,0.8); color: white;
      padding: 10px; border-radius: 8px;
      font: 12px monospace; z-index: 9999;
      min-width: 220px;
    `;

    // Restore last state
    if (window.geofsMetarWidgetLastPos) {
      widget.style.left = window.geofsMetarWidgetLastPos.left;
      widget.style.top = window.geofsMetarWidgetLastPos.top;
      widget.style.right = "auto";
      widget.style.position = "fixed";
    }
    if (window.geofsMetarWidgetLastDisplay) {
      widget.style.display = window.geofsMetarWidgetLastDisplay;
    }

    // Title & settings
    const title = document.createElement("div");
    let apiKey = localStorage.getItem("avwx_key");
    if (!apiKey) {
      title.textContent = "⚠️ Please click the settings button to enter your AVWX API Key.";
      title.style.marginBottom = "8px";
    } else {
      title.textContent = `METAR @ ${icao}`;
    }
    widget.appendChild(title);

    const settingsBtn = document.createElement("button");
    settingsBtn.textContent = "⚙";
    settingsBtn.title = "Set AVWX API Key";
    settingsBtn.style.marginLeft = "8px";
    settingsBtn.style.fontSize = "15px";
    settingsBtn.onclick = showApiKeyInputDialog;
    title.appendChild(settingsBtn);

    // Manual search UI
    const searchDiv = document.createElement("div");
    searchDiv.style.margin = "6px 0 4px 0";
    searchDiv.style.display = "flex";
    searchDiv.style.gap = "4px";
    searchDiv.style.alignItems = "center";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Enter ICAO manually (ex: RCTP)";
    searchInput.style.fontSize = "12px";
    searchInput.style.padding = "2px 4px";
    searchInput.style.width = "115px";
    searchInput.style.borderRadius = "3px";
    searchInput.style.border = "1px solid #888";
    searchInput.style.background = "#232323";
    searchInput.style.color = "white";
    searchInput.maxLength = 4;
    searchInput.id = "geofs-metar-search-input";
    searchInput.setAttribute("autocomplete", "off");
    searchInput.addEventListener("input", function() {
      this.value = this.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    });
    searchInput.addEventListener("keydown", function(e) {
      e.stopPropagation(); // Prevent GeoFS hotkeys
      if (e.key === "Enter") { manualSearch(); e.preventDefault(); }
    });
    searchInput.addEventListener("focus", function() {
      this.setAttribute("autocomplete", "off");
    });

    if (mode === "auto") searchInput.value = "";

    const searchBtn = document.createElement("button");
    searchBtn.textContent = "Search";
    searchBtn.title = "Manual search for airport METAR (Enter key also works)";
    searchBtn.style.fontSize = "12px";
    searchBtn.style.padding = "2px 6px";

    async function manualSearch() {
      let inputVal = searchInput.value.trim().toUpperCase();
      if (!inputVal) return;
      if (!AIRPORTS[inputVal]) {
        showToast(`❌ ICAO airport not found (${inputVal})`);
        return;
      }
      if (!localStorage.getItem("avwx_key")) {
        showToast("⚠️ Please set your API Key first.");
        return;
      }
      const metar = await fetchMETAR(inputVal);
      if (metar) showWidget(metar, inputVal, "manual");
      else showToast("❌ Failed to fetch METAR. Please check your API KEY.");
    }
    searchBtn.onclick = manualSearch;

    searchDiv.appendChild(searchInput);
    searchDiv.appendChild(searchBtn);
    widget.appendChild(searchDiv);

    const refreshBtn = document.createElement("button");
    refreshBtn.textContent = "⟳";
    refreshBtn.title = "Refresh METAR for nearest airport";
    refreshBtn.onclick = async () => {
      const pos = geofs?.aircraft?.instance?.llaLocation;
      if (pos?.length >= 2) {
        const [lat, lon] = pos;
        const nearest = findNearestAirport(lat, lon);
        const newMetar = await fetchMETAR(nearest);
        if (newMetar) showWidget(newMetar, nearest, "auto");
        else showToast("❌ Failed to fetch METAR.");
      }
    };
    widget.appendChild(refreshBtn);

    // --- If no API KEY, don't show METAR info
    if (!apiKey) {
      document.body.appendChild(widget);
      makeDraggable(widget);
      return;
    }

    // --- METAR info icons
    const iconRow = document.createElement("div");
    iconRow.style.marginTop = "6px";

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

    const w = metar.match(/((\d{3}|VRB))(\d{2})KT/);
    const vis = metar.match(/ (\d{4}) /);
    const cloudMatches = [...metar.matchAll(/(FEW|SCT|BKN|OVC)(\d{3})/g)];
    const temp = metar.match(/ (M?\d{2})\/(M?\d{2}) /);
    const qnh = metar.match(/Q(\d{4})/);
    const fog = /FG|BR/.test(metar);

    if (w) {
      const dir = w[1] === "VRB" ? 0 : parseInt(w[1]);
      const spd = w[3];
      const d = document.createElement("div");
      d.style.display = "flex";
      d.style.alignItems = "center";
      d.style.marginBottom = "3px";

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "20");
      svg.setAttribute("height", "20");
      svg.style.background = "white";
      svg.style.borderRadius = "50%";
      svg.style.marginRight = "6px";
      svg.innerHTML = `<polygon points="10,2 8,10 10,8 12,10" fill="red"/>`;
      svg.style.transform = `rotate(${dir}deg)`;

      const t = document.createElement("span");
      t.textContent = `${w[1]}° ${spd}kt`;
      d.appendChild(svg);
      d.appendChild(t);
      iconRow.appendChild(d);
    }
    if (vis) addIcon("visibility", `${parseInt(vis[1]) / 1000} km`);
    if (cloudMatches.length) {
      cloudMatches.forEach(cloud => {
        addIcon(`cloud-${cloud[1].toLowerCase()}`, `${cloud[1]} @ ${parseInt(cloud[2]) * 100}ft`);
      });
    }
    if (temp) {
      const t1 = temp[1].replace("M", "-");
      const t2 = temp[2].replace("M", "-");
      addIcon("temperature", `${t1}°C / ${t2}°C`);
    }
    if (qnh) addIcon("pressure", `Q${qnh[1]}`);
    if (fog) addIcon("fog", "Fog/Mist");

    const locClock = createClockSVG("loc", "UTC", "UTC");
    const icaoClock = createClockSVG("icao", ICAO_TIMEZONES[icao] || "Local", ICAO_TIMEZONES[icao] || Intl.DateTimeFormat().resolvedOptions().timeZone);
    rotateClock(locClock, getTimeInTimeZone("UTC"));
    rotateClock(icaoClock, getTimeInTimeZone(ICAO_TIMEZONES[icao] || Intl.DateTimeFormat().resolvedOptions().timeZone));
    const clockBox = document.createElement("div");
    clockBox.style.display = "flex";
    clockBox.style.justifyContent = "space-around";
    clockBox.appendChild(locClock);
    clockBox.appendChild(icaoClock);
    widget.appendChild(clockBox);

    setInterval(() => {
      rotateClock(locClock, getTimeInTimeZone("UTC"));
      rotateClock(icaoClock, getTimeInTimeZone(ICAO_TIMEZONES[icao] || Intl.DateTimeFormat().resolvedOptions().timeZone));
    }, 1000);

    widget.appendChild(iconRow);

    document.body.appendChild(widget);
    makeDraggable(widget);

    // No auto-focus on search input
  }

  function startMETAR() {
    setInterval(async () => {
      const pos = geofs?.aircraft?.instance?.llaLocation;
      if (pos?.length >= 2) {
        const [lat, lon] = pos;
        const nearest = findNearestAirport(lat, lon);
        const metar = await fetchMETAR(nearest);
        if (metar) showWidget(metar, nearest, "auto");
      }
    }, 60000);

    document.addEventListener("keydown", function (e) {
      // Only trigger W hotkey if not focusing an input
      if (e.key.toLowerCase() === "w" && !document.activeElement.matches("input")) {
        const w = window.geofsMetarWidget;
        if (w) {
          w.style.display = (w.style.display === "none") ? "block" : "none";
          window.geofsMetarWidgetLastDisplay = w.style.display;
        }
      }
    });

    // On init: if no API key, only show settings prompt
    let apiKey = localStorage.getItem("avwx_key");
    if (!apiKey) {
      showWidget("", defaultICAO, "auto");
      return;
    }
    fetchMETAR(defaultICAO).then(metar => {
      if (metar) showWidget(metar, defaultICAO, "auto");
    });
  }

  fetchAirportData();
})();
