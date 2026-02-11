import{a}from"./chunk-BCE34AQ5.js";import{a as l,b as c,d}from"./chunk-TI4L7M5E.js";import"./chunk-CFTXCTKY.js";var p={excellent:"#22c55e",good:"#3b82f6",fair:"#eab308",poor:"#ef4444"};function b({streams:f,apiUrl:u}){let s=c(null),n=c(null),g=d({}),r=d(!1);return l(()=>((async()=>{if(typeof L>"u"&&await new Promise(i=>{let e=document.createElement("script");e.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",e.onload=()=>i(),document.head.appendChild(e)}),!s.current||n.current)return;let t=L.map(s.current).setView([41.8,-74.5],8);n.current=t,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"\xA9 OpenStreetMap contributors"}).addTo(t),r.value=!0})(),()=>{n.current&&(n.current.remove(),n.current=null)}),[]),l(()=>{if(!r.value||!n.current)return;let m=n.current;f.forEach(t=>{if(!t.coordinates)return;let i=L.circleMarker([t.coordinates.latitude,t.coordinates.longitude],{radius:10,fillColor:"#64748b",color:"#475569",weight:2,opacity:1,fillOpacity:.8}).addTo(m);i.bindPopup(`
        <div style="min-width: 150px">
          <strong>${t.name}</strong><br>
          <span style="color: #64748b; font-size: 12px">${t.region} \u2022 ${t.state}</span><br>
          <span style="color: #94a3b8; font-size: 11px">Loading conditions...</span>
        </div>
      `),fetch(`${u}/api/streams/${t.id}/conditions`).then(e=>e.json()).then(e=>{if(!e.success||!e.data)return;let o=e.data;g.value={...g.value,[t.id]:o},i.setStyle({fillColor:p[o.fishingQuality],color:p[o.fishingQuality]});let h=o.stationData[0]?.waterTempF,y=o.stationData[0]?.dischargeCfs,v=o.predictedHatches[0]?.hatch.commonName;i.setPopupContent(`
            <div style="min-width: 180px">
              <strong>${t.name}</strong><br>
              <span style="color: #64748b; font-size: 12px">${t.region} \u2022 ${t.state}</span>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0">
              <div style="font-size: 13px">
                ${h?`\u{1F4A7} Water: <strong>${h}\xB0F</strong><br>`:""}
                ${y?`\u{1F30A} Flow: <strong>${y} cfs</strong><br>`:""}
                ${v?`\u{1FAB0} ${v}<br>`:""}
              </div>
              <div style="margin-top: 8px">
                <span style="
                  background: ${p[o.fishingQuality]};
                  color: white;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  text-transform: uppercase;
                ">${o.fishingQuality}</span>
              </div>
              <a href="/streams/${t.id}" style="
                display: block;
                margin-top: 8px;
                color: #0ea5e9;
                font-size: 12px;
              ">View details \u2192</a>
            </div>
          `)}).catch(console.error)})},[r.value,f,u]),a("div",{ref:s,style:{width:"100%",height:"100%"},children:!r.value&&a("div",{class:"flex items-center justify-center h-full bg-slate-100",children:a("div",{class:"text-slate-500",children:"Loading map..."})})})}export{b as default};
