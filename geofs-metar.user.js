// ==UserScript==
// @name         GeoFS METAR system
// @version      2.6
// @description  METAR widget with built-in airport detection, no input box, auto refresh, dual clocks, W-key toggle & initial refresh
// @author       seabus
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://i.ibb.co/wZ2SB149/Chat-GPT-Image-2025-6-30-08-31-37.png
// @grant        none
// ==/UserScript==

(function () {
  if (window.geofsMetarAlreadyLoaded) return;
  window.geofsMetarAlreadyLoaded = true;

  // --- 機場資料 ---
  const AIRPORTS = {
    "RCTP": { name: "Taipei Taoyuan", lat: 25.0777, lon: 121.233 },
    "RJTT": { name: "Tokyo Haneda", lat: 35.552258, lon: 139.779694 },
    "RJAA": { name: "Tokyo Narita", lat: 35.764722, lon: 140.386389 },
    "VHHH": { name: "Hong Kong Intl", lat: 22.308919, lon: 113.914603 },
    "ZBAA": { name: "Beijing Capital", lat: 40.080111, lon: 116.584556 },
    "WSSS": { name: "Singapore Changi", lat: 1.35019, lon: 103.994003 },
    "KLAX": { name: "Los Angeles Intl", lat: 33.942536, lon: -118.408075 },
    "KSFO": { name: "San Francisco Intl", lat: 37.6188056, lon: -122.3754167 },
    "KJFK": { name: "New York JFK", lat: 40.639751, lon: -73.778925 },
    "EGLL": { name: "London Heathrow", lat: 51.4775, lon: -0.461389 },
    "LFPG": { name: "Paris CDG", lat: 49.012779, lon: 2.55 },
    "EDDF": { name: "Frankfurt Main", lat: 50.033333, lon: 8.570556 }
  };

  // --- 圖示對照表 ---
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

  // --- 時區對照表 ---
  const ICAO_TIMEZONES = {
    "RCTP": "Asia/Taipei","RJTT": "Asia/Tokyo","RJAA": "Asia/Tokyo",
    "VHHH": "Asia/Hong_Kong","ZBAA": "Asia/Shanghai","WSSS": "Asia/Singapore",
    "KLAX": "America/Los_Angeles","KSFO": "America/Los_Angeles","KJFK": "America/New_York",
    "EGLL": "Europe/London","LFPG": "Europe/Paris","EDDF": "Europe/Berlin"
  };

  // --- 取 METAR ---
  async function fetchMETAR(icao) {
    try {
      const res = await fetch(`https://metar.vatsim.net/metar.php?id=${icao}`);
      return await res.text();
    } catch (e) {
      console.error("❌ METAR Fetch Error:", e);
      return null;
    }
  }

  // --- 時間轉時區 ---
  function getTimeInTimeZone(tz) {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: tz === "arrival" ? "UTC" : tz
    });
    const [h, m, s] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, s, 0);
    return d;
  }

  // --- 距離計算 (Haversine) ---
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = x => x * Math.PI/180;
    const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // --- 找最近機場 (<150km) ---
  function findNearestAirport(lat, lon) {
    let nearest = null, minDist = Infinity;
    for (const icao in AIRPORTS) {
      const ap = AIRPORTS[icao], d = getDistanceKm(lat, lon, ap.lat, ap.lon);
      if (d < minDist) { minDist = d; nearest = icao; }
    }
    return minDist <= 150 ? nearest : null;
  }

  // --- SVG 時鐘產生 ---
  function createClockSVG(id, label) {
    const c = document.createElement("div");
    c.style.textAlign="center"; c.style.fontSize="10px";
    c.innerHTML = `<div>${label}</div>`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("width","40"); svg.setAttribute("height","40");
    svg.setAttribute("viewBox","0 0 40 40");
    svg.innerHTML = `
      <circle cx="20" cy="20" r="18" fill="white" stroke="black" stroke-width="1"/>
      <line id="${id}-hour" x1="20" y1="20" x2="20" y2="11" stroke="black" stroke-width="2"/>
      <line id="${id}-minute" x1="20" y1="20" x2="20" y2="7" stroke="black" stroke-width="1"/>
      <line id="${id}-second" x1="20" y1="20" x2="20" y2="5" stroke="red" stroke-width="0.5"/>
    `;
    c.appendChild(svg);
    return c;
  }

  // --- 讓時鐘轉動 ---
  function rotateClock(svg, now) {
    const hr=now.getHours()%12, mn=now.getMinutes(), sc=now.getSeconds();
    svg.querySelector("line[id$='-hour']").setAttribute("transform",`rotate(${hr*30+mn*0.5+sc*(0.5/60)} 20 20)`);
    svg.querySelector("line[id$='-minute']").setAttribute("transform",`rotate(${mn*6+sc*0.1} 20 20)`);
    svg.querySelector("line[id$='-second']").setAttribute("transform",`rotate(${sc*6} 20 20)`);
  }

  // --- 拖曳功能 ---
  function makeDraggable(el) {
    let drag=false, offX=0, offY=0;
    el.style.cursor="move";
    el.addEventListener("mousedown",e=>{
      drag=true; offX=e.clientX-el.getBoundingClientRect().left;
      offY=e.clientY-el.getBoundingClientRect().top;
      document.body.style.userSelect="none";
    });
    document.addEventListener("mousemove",e=>{
      if(drag){
        el.style.left=Math.max(0,Math.min(e.clientX-offX,window.innerWidth-el.offsetWidth))+"px";
        el.style.top=Math.max(0,Math.min(e.clientY-offY,window.innerHeight-el.offsetHeight))+"px";
      }
    });
    document.addEventListener("mouseup",()=>{
      drag=false; document.body.style.userSelect="";
    });
  }

  // --- 顯示 Widget ---
  function showWidget(metar, icao) {
    // 移除舊面板 + 取消排程
    if(window.geofsMetarWidget) window.geofsMetarWidget.remove();
    if(window.geofsMetarScheduledTimeout) clearTimeout(window.geofsMetarScheduledTimeout);

    const widget = document.createElement("div");
    window.geofsMetarWidget = widget;
    widget.style.cssText=`
      position:fixed; top:10px; right:10px;
      background:rgba(0,0,0,0.7); color:white;
      padding:10px; border-radius:10px;
      font:12px monospace; z-index:9999;
    `;

    // 標題
    const city = AIRPORTS[icao]?.name||icao;
    const title = document.createElement("div");
    title.textContent = `METAR @ ${city}`;
    title.style.marginBottom="6px";
    widget.appendChild(title);

    // 刷新鍵 (W-key 切換另加在鍵盤監聽)
    const refreshBtn = document.createElement("button");
    refreshBtn.textContent="⟳"; refreshBtn.style.cssText="margin-bottom:6px;cursor:pointer;";
    refreshBtn.onclick=async()=>{
      const pos=geofs?.aircraft?.instance?.llaLocation;
      if(pos?.length>=2){
        const [lat,lon]=pos;
        const nearest=findNearestAirport(lat,lon);
        if(nearest){
          const m=await fetchMETAR(nearest);
          if(m) showWidget(m, nearest);
        }
      }
    };
    widget.appendChild(refreshBtn);

    // 雙時鐘
    const tz = ICAO_TIMEZONES[icao]||"arrival";
    const tzLabel = tz==="arrival"?"Arrival":tz.split("/").pop().replace("_"," ");
    const locClock = createClockSVG("loc","Local");
    const icaoClock = createClockSVG("icao", tzLabel);
    const clockBox = document.createElement("div");
    clockBox.style.display="flex"; clockBox.style.justifyContent="space-around";
    clockBox.appendChild(locClock); clockBox.appendChild(icaoClock);
    widget.appendChild(clockBox);

    // 圖示
    const iconRow = document.createElement("div"); iconRow.style.marginTop="8px";
    function addIcon(n,t){
      const d=document.createElement("div"); d.style.display="flex"; d.style.alignItems="center"; d.style.marginBottom="3px";
      const i=document.createElement("img"); i.src=ICON_MAP[n]; i.style.width="20px"; i.style.marginRight="6px";
      const s=document.createElement("span"); s.textContent=t;
      d.appendChild(i); d.appendChild(s); iconRow.appendChild(d);
    }
    const w=metar.match(/((\d{3}|VRB))(\d{2})KT/);
    const vis=metar.match(/ (\d{4}) /);
    const cloud=metar.match(/(FEW|SCT|BKN|OVC)(\d{3})/);
    const temp=metar.match(/ (M?\d{2})\/(M?\d{2}) /);
    const qnh=metar.match(/Q(\d{4})/); const fog=/FG|BR/.test(metar);
    if(w) addIcon("wind",`${w[1]}° ${w[3]}kt`);
    if(vis) addIcon("visibility",`${parseInt(vis[1])/1000} km`);
    if(cloud) addIcon(`cloud-${cloud[1].toLowerCase()}`,`${cloud[1]} @ ${parseInt(cloud[2])*100}ft`);
    if(temp){ const t1=temp[1].replace("M","-"),t2=temp[2].replace("M","-"); addIcon("temperature",`${t1}°C / ${t2}°C`); }
    if(qnh) addIcon("pressure",`Q${qnh[1]}`); if(fog) addIcon("fog","Fog/Mist");
    widget.appendChild(iconRow);

    document.body.appendChild(widget);
    makeDraggable(widget);

    // 每秒更新時鐘
    setInterval(()=>{ rotateClock(locClock,new Date()); rotateClock(icaoClock,getTimeInTimeZone(tz)); },1000);

    // :00/:30 智慧排程
    (function schedule(){
      const now=new Date(), m=now.getMinutes(), s=now.getSeconds();
      const delay=((m<30?30:60)*60 - m*60 - s)*1000;
      window.geofsMetarScheduledTimeout=setTimeout(async()=>{
        const m2=await fetchMETAR(icao);
        if(m2) showWidget(m2,icao);
      },delay);
    })();
  }

  // --- W 鍵切換顯示 ---
  document.addEventListener("keydown", e=>{
    if(e.key.toLowerCase()==="w" && window.geofsMetarWidget){
      const w = window.geofsMetarWidget;
      w.style.display = (w.style.display==="none"?"block":"none");
    }
  });

  // --- 首次進入立即刷新最近機場 METAR ---
  async function initialRefresh(){
    const pos = geofs?.aircraft?.instance?.llaLocation;
    let icao="RCTP";
    if(pos?.length>=2){
      const [lat,lon]=pos;
      const nearest=findNearestAirport(lat,lon);
      if(nearest) icao=nearest;
    }
    const m=await fetchMETAR(icao);
    if(m) showWidget(m,icao);
  }
  // 等 GeoFS iframe 載入後跑
  window.addEventListener("load", () => {
  setTimeout(initialRefresh, 1500); // 延遲 1.5 秒後執行第一次刷新
  });

})();
