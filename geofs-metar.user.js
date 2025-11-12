// ==UserScript==
// @name         GeoFS METAR system
// @version      4.3.4
// @description  METAR widget using VATSIM METAR API (no API key required). Includes version check, manual/auto search, icons, draggable UI, fallback system.
// @author       seabus + Copilot (VATSIM source by ChatGPT)
// @updateURL    https://raw.githubusercontent.com/seabus0316/GeoFS-METAR-system/main/geofs-metar.user.js
// @downloadURL  https://raw.githubusercontent.com/seabus0316/GeoFS-METAR-system/main/geofs-metar.user.js
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
  // ===== Custom Modal (centered) =====
  function showModal(msg, duration = null, updateBtnUrl = null) {
    if (document.getElementById("geofs-metar-modal")) return;
    let overlay = document.createElement("div");
    overlay.id = "geofs-metar-modal";
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;
      background:rgba(24,32,48,0.45);display:flex;align-items:center;justify-content:center;
    `;
    let box = document.createElement("div");
    box.style.cssText = `
      background:linear-gradient(135deg,#232942 80%,#151a25 100%);
      color:#dbeaff;padding:30px 34px;border-radius:18px;box-shadow:0 6px 32px #000b;
      min-width:280px;max-width:90vw;display:flex;flex-direction:column;align-items:center;gap:14px;
      border:2.5px solid #3d6aff;font-size:1.15rem;letter-spacing:0.3px;
      text-align:center;animation:popIn .21s;
    `;
    let content = document.createElement("div");
    content.innerHTML = msg;
    box.appendChild(content);

    // --- Update button support ---
    if (updateBtnUrl) {
      let updateBtn = document.createElement("a");
      updateBtn.textContent = "Update";
      updateBtn.href = updateBtnUrl;
      updateBtn.target = "_blank";
      updateBtn.style.cssText = `
        margin-top:6px;padding:8px 38px;font-size:1.05rem;background:#1e3f6e;
        color:#fff;border:1.5px solid #4eaaff;border-radius:7px;font-weight:bold;cursor:pointer;
        box-shadow:0 1px 8px #4eaaff30;transition:background .18s;display:inline-block;text-decoration:none;
      `;
      updateBtn.onmouseover = function(){this.style.background="#1552a1";}
      updateBtn.onmouseout = function(){this.style.background="#1e3f6e";}
      box.appendChild(updateBtn);
    }

    let okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.cssText = `
      margin-top:16px;padding:8px 38px;font-size:1.05rem;background:#222b3c;
      color:#b2cfff;border:1.5px solid #4eaaff;border-radius:7px;font-weight:bold;cursor:pointer;
      box-shadow:0 1px 8px #3d6aff30;transition:background .18s;
    `;
    okBtn.onclick = () => { document.body.removeChild(overlay); };
    box.appendChild(okBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Optional auto-close
    if (duration) setTimeout(() => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
    }, duration);

    // Enter/Escape key to close
    overlay.tabIndex = -1; overlay.focus();
    overlay.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
      }
    };

    // Animation
    if (!document.getElementById("geofs-metar-modal-anim")) {
      const style = document.createElement('style');
      style.id = "geofs-metar-modal-anim";
      style.textContent = `
        @keyframes popIn { from { transform:scale(0.85);opacity:0; } to { transform:scale(1);opacity:1; } }
      `;
      document.head.appendChild(style);
    }
  }

  // ======= Update check (English) =======
  const CURRENT_VERSION = '4.3.4';
  const VERSION_JSON_URL = 'https://raw.githubusercontent.com/seabus0316/GeoFS-METAR-system/main/version.json';
  const UPDATE_URL = 'https://raw.githubusercontent.com/seabus0316/GeoFS-METAR-system/main/geofs-metar.user.js';

(function checkUpdate() {
  fetch(VERSION_JSON_URL)
    .then(r => r.json())
    .then(data => {
      if (data.version && data.version !== CURRENT_VERSION) {
        showModal(
          `🚩 GeoFS METAR System new version available (${data.version})!<br>Please reinstall the latest user.js from GitHub.`,
          null,
          UPDATE_URL
        );
      }
    })
    .catch(() => {});
})();


  if (window.geofsMetarAlreadyLoaded) return;
  window.geofsMetarAlreadyLoaded = true;

  window.geofsMetarWidgetLastPos = null;
  window.geofsMetarWidgetLastDisplay = null;

  const defaultICAO = "RCTP";
  const airportDataURL = "https://raw.githubusercontent.com/mwgg/Airports/refs/heads/master/airports.json";

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

  // 新增：找到多個最近的機場 (用於 fallback)
  function findNearestAirports(lat, lon, maxCount = 10) {
    const distances = [];
    for (const icao in AIRPORTS) {
      const ap = AIRPORTS[icao];
      const dist = getDistanceKm(lat, lon, ap.lat, ap.lon);
      distances.push({ icao, distance: dist });
    }

    // 按距離排序並返回最近的 maxCount 個
    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, maxCount).map(item => item.icao);
  }

  function findNearestAirport(lat, lon) {
    const nearest = findNearestAirports(lat, lon, 1);
    return nearest.length > 0 ? nearest[0] : defaultICAO;
  }

  async function fetchAirportData() {
  try {
    const res = await fetch(airportDataURL);
    const json = await res.json();

    for (const icao in json) {
      const ap = json[icao];
      AIRPORTS[icao] = {
        name: ap.name,
        lat: ap.lat,
        lon: ap.lon
      };
      // 正確處理 tz
      ICAO_TIMEZONES[icao] = ap.tz || "UTC";
    }

    startMETAR();
  } catch (e) {
    console.error("❌ Failed to load airport data:", e);
    showModal("⚠️ Failed to load airport database. METAR system disabled.");
  }
}

// ======= 檢查 METAR 回應是否有效 =======
function isValidMetarResponse(text) {
  if (!text || !text.trim()) return false;

  // 檢查是否是空的 FeatureCollection
  try {
    const parsed = JSON.parse(text);
    if (parsed.type === "FeatureCollection" &&
        parsed.features &&
        Array.isArray(parsed.features) &&
        parsed.features.length === 0) {
      return false;
    }
  } catch (e) {
    // 不是 JSON，可能是正常的 METAR 文字資料
  }

  return true;
}

// ======= VATSIM METAR fetch with fallback (no API key) =======
async function fetchMETAR(icao) {
  // 先試 VATSIM (改成 Render 代理)
  try {
    const vatsimRes = await fetch(`https://weather.geo-fs.com/?icao=${icao}`);
    if (vatsimRes.ok) {
      const text = await vatsimRes.text();
      if (isValidMetarResponse(text)) {
        return text.trim();
      }
    }
  } catch (e) {
    console.warn("⚠️ VATSIM METAR fetch failed, will try AVWX:", e);
  }

  // 如果 VATSIM 沒資料，改試 AVWX
  try {
    const avwxRes = await fetch(
      `https://geofs-metar-cors-8pch.onrender.com/metar?icao=${icao}`
    );
    if (avwxRes.ok) {
      const json = await avwxRes.json();
      if (json && json.raw && json.raw.trim()) {
        return json.raw.trim();
      }
    }
  } catch (e) {
    console.error("❌ AVWX METAR fetch failed:", e);
  }

  // 兩邊都失敗
  return null;
}

// ======= 新增：帶 fallback 的 METAR 搜尋 =======
async function fetchMETARWithFallback(lat, lon, maxTries = 5) {
  if (typeof lat === 'string') {
    // 如果傳入的是 ICAO 代碼，直接查詢
    const metar = await fetchMETAR(lat);
    return metar ? { metar, icao: lat } : null;
  }

  // 找到最近的多個機場
  const nearestAirports = findNearestAirports(lat, lon, maxTries);

  for (let i = 0; i < nearestAirports.length; i++) {
    const icao = nearestAirports[i];
    console.log(`🔍 Trying airport ${i + 1}/${nearestAirports.length}: ${icao}`);

    const metar = await fetchMETAR(icao);
    if (metar) {
      if (i > 0) {
        console.log(`✅ Found METAR data at ${icao} (${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} nearest airport)`);
      }
      return { metar, icao };
    }

    console.log(`❌ No valid METAR data for ${icao}, trying next nearest...`);
  }

  console.log(`❌ No METAR data found for any of the ${maxTries} nearest airports`);
  return null;
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

  // 新增：跟隨遊戲 UI 顯示狀態的更新函數
  function updateMetarVisibility() {
    if (window.geofsMetarWidget && window.instruments && typeof window.instruments.visible !== 'undefined') {
      const shouldShow = window.instruments.visible;
      window.geofsMetarWidget.style.display = shouldShow ? "block" : "none";
    }
  }

  function showWidget(metar, icao, mode = "auto") {
    if (window.geofsMetarWidget) window.geofsMetarWidget.remove();
    const widget = document.createElement("div");
    window.geofsMetarWidget = widget;

    // 新增：添加 metar-widget 類名，以便跟 minimap 一樣管理
    widget.className = "metar-widget";

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

    // Title
    const title = document.createElement("div");
    title.textContent = `METAR @ ${icao}`;
    widget.appendChild(title);

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
        showModal(`❌ ICAO airport not found (${inputVal})`);
        return;
      }

      // 使用 fallback 系統進行手動搜尋
      const result = await fetchMETARWithFallback(inputVal);
      if (result) {
        showWidget(result.metar, result.icao, "manual");
      } else {
        showModal(`❌ No METAR available for ${inputVal}`);
      }
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
        const result = await fetchMETARWithFallback(lat, lon);
        if (result) {
          showWidget(result.metar, result.icao, "auto");
        } else {
          showModal("❌ No METAR data available for nearby airports");
        }
      }
    };
    widget.appendChild(refreshBtn);

    // If no METAR yet, still show UI (search/refresh)
    if (!metar) {
      document.body.appendChild(widget);
      makeDraggable(widget);
      // 新增：設置初始顯示狀態
      updateMetarVisibility();
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

    // 新增：設置初始顯示狀態
    updateMetarVisibility();
  }

  function startMETAR() {
    // 新增：定期檢查遊戲 UI 顯示狀態並同步 METAR widget
    setInterval(() => {
      updateMetarVisibility();
    }, 50); // 每 50ms 檢查一次，跟 minimap 的更新頻率差不多

    // periodic auto-refresh for nearest airport with fallback
    setInterval(async () => {
      const pos = geofs?.aircraft?.instance?.llaLocation;
      if (pos?.length >= 2) {
        const [lat, lon] = pos;
        const result = await fetchMETARWithFallback(lat, lon);
        if (result) {
          showWidget(result.metar, result.icao, "auto");
        }
      }
    }, 60000);

    // On init: fetch default airport with fallback
    fetchMETARWithFallback(defaultICAO).then(result => {
      if (result) {
        showWidget(result.metar, result.icao, "auto");
      } else {
        // 如果連默認機場都沒有資料，顯示空的 widget
        showWidget(null, defaultICAO, "auto");
      }
    });
  }

  fetchAirportData();
})();
