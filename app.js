const ENGINE_REPLACEMENT_KM=170000;const VEHICLE_GOAL_KM=400000;const ENGINE_GOAL_KM=300000;
const currentKmInput=document.getElementById("currentKm");const saveKmBtn=document.getElementById("saveKmBtn");
const vehicleKmElement=document.getElementById("vehicleKm");const engineKmElement=document.getElementById("engineKm");
const vehicleProgress=document.getElementById("vehicleProgress");const engineProgress=document.getElementById("engineProgress");
const vehicleProgressText=document.getElementById("vehicleProgressText");const engineProgressText=document.getElementById("engineProgressText");
const lastUpdateElement=document.getElementById("lastUpdate");const historyList=document.getElementById("historyList");
document.addEventListener("DOMContentLoaded",()=>{initializeData();refreshDashboard();});
function initializeData(){if(!localStorage.getItem("t5_vehicle_km")) localStorage.setItem("t5_vehicle_km","170000"); if(!localStorage.getItem("t5_history")) localStorage.setItem("t5_history",JSON.stringify([]));}
saveKmBtn.addEventListener("click",saveCurrentKm);
function saveCurrentKm(){const km=parseInt(currentKmInput.value); if(isNaN(km)||km<=0){alert("Veuillez saisir un kilométrage valide.");return;}
localStorage.setItem("t5_vehicle_km",km); const h=JSON.parse(localStorage.getItem("t5_history")); h.unshift({date:new Date().toLocaleString("fr-FR"),km}); localStorage.setItem("t5_history",JSON.stringify(h)); refreshDashboard(); currentKmInput.value="";}
function refreshDashboard(){const vehicleKm=parseInt(localStorage.getItem("t5_vehicle_km")); const engineKm=Math.max(0,vehicleKm-ENGINE_REPLACEMENT_KM);
vehicleKmElement.innerText=formatKm(vehicleKm); engineKmElement.innerText=formatKm(engineKm); updateProgressBars(vehicleKm,engineKm); updateHistory();}
function updateProgressBars(vehicleKm,engineKm){vehicleProgress.style.width=Math.min(vehicleKm/VEHICLE_GOAL_KM*100,100)+"%"; vehicleProgressText.innerText=`${formatKm(vehicleKm)} / ${formatKm(VEHICLE_GOAL_KM)}`; engineProgress.style.width=Math.min(engineKm/ENGINE_GOAL_KM*100,100)+"%"; engineProgressText.innerText=`${formatKm(engineKm)} / ${formatKm(ENGINE_GOAL_KM)}`;}
function updateHistory(){const h=JSON.parse(localStorage.getItem("t5_history")); if(h.length===0){historyList.innerHTML="<p>Aucun historique enregistré.</p>"; return;} historyList.innerHTML=h.map(i=>`<div class="history-item"><strong>${formatKm(i.km)}</strong><br><small>${i.date}</small></div>`).join(""); lastUpdateElement.innerText="Dernière mise à jour : "+h[0].date;}
function formatKm(v){return v.toLocaleString("fr-FR")+" km";}