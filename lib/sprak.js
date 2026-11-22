/* Språk på stemmeapp.no. Sidene er skrevet på norsk, og hvert språk har sin egen ordliste.
   Bygget på samme motor som Min dag på test.voteapp.eu, men slankere: ingen stjernetegn, ingen navn.
   - Norsk (nb) er standard. Da gjør denne filen ingenting, og siden koster ikke mer strøm enn før.
   - Valget lagres i "stemmeapp-lang" (språkmenyen, eller ?lang=en i adressen). Telefonens språk brukes ikke.
   - Siden sier selv hvilken ordliste den trenger: <script src="/lib/sprak.js" data-del="forside">.
     Fellesordene ligger i lib/sprak/<språk>.js, sideordene i lib/sprak/<del>/<språk>.js.
   - Nøkkelen er den norske teksten slik den står (mellomrom slått sammen), verdien er oversettelsen.
     Tall kan skrives som {n1}, {n2} ... i nøkkelen, så "7 dager" og "30 dager" bruker samme linje.
   - Tekst som ikke finnes i ordlisten, blir stående på norsk. Med ?sprak-sjekk=1 listes den i konsollen.
   - Alt med data-ikke-oversett, og alt inne i .sakstekst, røres ikke. Saksinnhold (spørsmål, svaralternativer,
     kilder, argumenter) skal ikke byttes ut stille: det får egen merking, se SPRAK-PLAN.md.
   - Øverst på siden vises en stripe som sier at teksten er oversatt med hjelp av KI, og som lar deg gå tilbake til norsk. */
(function(){
  "use strict";
  /* Språk som har ordliste for minst forsiden. Nye språk legges til her når ordlistene er lest gjennom. */
  var STOTTE = {en: "en-GB"};
  var NAVN = {nb: "Norsk", en: "English", pt: "Português", es: "Español", zh: "中文"};
  var DEL = document.currentScript && document.currentScript.getAttribute("data-del");
  var lang = "nb";
  try{
    var q = new URLSearchParams(location.search).get("lang");
    if(q && (STOTTE[q] || q === "nb")){ localStorage.setItem("stemmeapp-lang", q); }
    lang = localStorage.getItem("stemmeapp-lang") || "nb";
  }catch(e){}
  if(!STOTTE[lang]){ lang = "nb"; }
  var MS = window.StemmeSprak = {
    lang: lang, locale: STOTTE[lang] || "nb-NO", mangler: [],
    sprak: ["nb"].concat(Object.keys(STOTTE)).map(function(k){ return [k, NAVN[k]]; }),
    velg: function(l){
      try{ localStorage.setItem("stemmeapp-lang", l); }catch(e){}
      var s = location.search.replace(/([?&])lang=[^&]*&?/, "$1").replace(/[?&]$/, "");
      location.href = location.pathname + s + location.hash;
    },
    t: function(s){ return s; }
  };
  if(lang === "nb"){ return; }

  document.documentElement.lang = lang;
  window.StemmeSprakLegg = function(d){
    var B = window.STEMME_SPRAK = window.STEMME_SPRAK || {ORD: {}};
    Object.keys(d.ORD || {}).forEach(function(k){ B.ORD[k] = d.ORD[k]; });
  };
  /* Ordlistene lastes med en gang, før resten av siden, så teksten ikke blinker på norsk. */
  var V = "?v=2026-11-21";
  document.write('<script src="/lib/sprak/' + lang + '.js' + V + '"><\/script>');
  if(DEL && /^[a-z-]+$/.test(DEL)){ document.write('<script src="/lib/sprak/' + DEL + '/' + lang + '.js' + V + '"><\/script>'); }

  var ORD = {};
  function oversett(s){
    if(Object.prototype.hasOwnProperty.call(ORD, s)){ return ORD[s]; }
    var n = [], k = s.replace(/\d+(?:[.,:]\d+)*/g, function(m){ n.push(m); return "{n" + n.length + "}"; });
    if(k !== s && Object.prototype.hasOwnProperty.call(ORD, k)){
      return ORD[k].replace(/\{n(\d+)\}/g, function(m, i){ return n[i - 1] || ""; });
    }
    return null;
  }
  MS.t = function(s){ var r = oversett(s); return r == null ? s : r; };

  var sjekk = /[?&]sprak-sjekk=1/.test(location.search), sett = new WeakMap(), mangelSett = {};
  function mangel(s){ if(sjekk && /[A-Za-zæøåÆØÅ]{2}/.test(s) && !mangelSett[s]){ mangelSett[s] = 1; MS.mangler.push(s); } }
  var FRI = "script, style, code, [data-ikke-oversett], .sakstekst";
  function tekstnode(node){
    var raw = node.data, fra = sett.get(node);
    if(fra === raw){ return; }
    var m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/), kjerne = m[2].replace(/\s+/g, " ");
    if(!kjerne || !/[A-Za-zÆØÅæøå]/.test(kjerne)){ return; }
    var el = node.parentElement;
    if(el && el.closest(FRI)){ return; }
    var r = oversett(kjerne);
    if(r == null){ mangel(kjerne); sett.set(node, raw); return; }
    var ny = m[1] + r + m[3];
    sett.set(node, ny);
    if(ny !== raw){ node.data = ny; }
  }
  var ATTR = ["placeholder", "aria-label", "title", "alt"];
  function attributter(el){
    if(el.closest && el.closest(FRI)){ return; }
    for(var i = 0; i < ATTR.length; i++){
      var a = ATTR[i]; if(!el.hasAttribute(a)){ continue; }
      var v = el.getAttribute(a), merke = "data-sprak-" + a;
      if(el.getAttribute(merke) === v){ continue; }
      var r = oversett(v.replace(/\s+/g, " ").trim());
      if(r == null){ mangel(v); el.setAttribute(merke, v); continue; }
      el.setAttribute(merke, r); if(r !== v){ el.setAttribute(a, r); }
    }
  }
  function gjennom(rot){
    if(rot.nodeType === 3){ tekstnode(rot); return; }
    if(rot.nodeType !== 1){ return; }
    attributter(rot);
    var w = document.createTreeWalker(rot, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while((n = w.nextNode())){ if(n.nodeType === 3){ tekstnode(n); } else { attributter(n); } }
  }
  function metaInnhold(){
    var ms = document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]');
    for(var i = 0; i < ms.length; i++){ var r = oversett(ms[i].getAttribute("content") || ""); if(r){ ms[i].setAttribute("content", r); } }
  }
  /* Stripen øverst: sier at teksten er oversatt, og at norsk er originalen. Ett trykk tilbake til norsk. */
  function stripe(){
    var b = document.createElement("div");
    b.id = "sprak-stripe"; b.setAttribute("role", "note"); b.setAttribute("data-ikke-oversett", "");
    b.setAttribute("style", "font-size:14px;line-height:1.4;padding:8px 16px;text-align:center;background:#ffd28a;color:#1a1300");
    var t = document.createElement("span");
    t.textContent = ORD["@stripe"] || "Translated from Norwegian with help from AI. The Norwegian text is the original.";
    var k = document.createElement("button");
    k.type = "button"; k.lang = "nb"; k.textContent = "Vis på norsk";
    k.setAttribute("style", "margin-left:10px;font:inherit;font-weight:700;padding:3px 10px;border-radius:8px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;min-height:32px");
    k.addEventListener("click", function(){ MS.velg("nb"); });
    b.appendChild(t); b.appendChild(k);
    document.body.insertBefore(b, document.body.firstChild);
  }
  function start(){
    ORD = (window.STEMME_SPRAK && window.STEMME_SPRAK.ORD) || {};
    var t = oversett(document.title); if(t){ document.title = t; }
    metaInnhold();
    stripe();
    gjennom(document.body);
    /* Tekst som kommer til etterpå (skjema, dialoger, lister fra data/), fanges opp når den dukker opp. Ingen løkker. */
    new MutationObserver(function(liste){
      for(var i = 0; i < liste.length; i++){
        var m = liste[i];
        if(m.type === "characterData"){ tekstnode(m.target); }
        else if(m.type === "attributes"){ attributter(m.target); }
        else { for(var j = 0; j < m.addedNodes.length; j++){ gjennom(m.addedNodes[j]); } }
      }
    }).observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR});
    if(sjekk){ setTimeout(function(){ console.log("Mangler oversettelse (" + MS.mangler.length + "):\n" + MS.mangler.join("\n")); }, 2000); }
  }
  if(document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", start); } else { start(); }
})();
