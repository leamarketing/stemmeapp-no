/* Språkmenyen på stemmeapp.no. Legges der siden har <span id="sprakmeny-plass"></span>,
   ellers øverst til høyre. Viser bare språk som har ordliste (se STOTTE i lib/sprak.js).
   Ingen løkker, bare én lytter på menyen. Lastes med defer, etter lib/sprak.js. */
(function(){
  "use strict";
  var S = window.StemmeSprak;
  if(!S || S.sprak.length < 2 || document.getElementById("sprakmeny-valg")){ return; }
  var plass = document.getElementById("sprakmeny-plass");
  var sel = document.createElement("select");
  sel.id = "sprakmeny-valg";
  sel.setAttribute("data-ikke-oversett", "");
  sel.setAttribute("aria-label", "Språk / Language");
  sel.title = "Språk / Language";
  sel.setAttribute("style", "font:inherit;font-size:14px;font-weight:600;padding:6px 8px;border-radius:10px;border:1px solid rgba(127,127,127,.45);background:transparent;color:inherit;max-width:9.5rem;min-height:36px;cursor:pointer");
  S.sprak.forEach(function(s){
    var o = document.createElement("option");
    o.value = s[0]; o.textContent = "🌐 " + s[1]; o.lang = s[0]; o.style.color = "#111";
    if(s[0] === S.lang){ o.selected = true; }
    sel.appendChild(o);
  });
  sel.addEventListener("change", function(){ S.velg(sel.value); });
  if(plass){ plass.appendChild(sel); }
  else { sel.style.cssText += ";position:absolute;top:8px;right:16px;z-index:5"; document.body.appendChild(sel); }
})();
