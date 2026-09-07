/* =====================================================================
   sound.js — tiny opt-in Web Audio sfx for games running in the iframe.
   NOT loaded by default. To enable, add <script src="sound.js"></script>
   before <script src="app.js"></script> in index.html.
   ===================================================================== */
(function(){
  if (window.__PFSOUND__) return;
  window.__PFSOUND__ = true;

  let ctx = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
    return ctx;
  }

  function blip({ freq = 440, dur = 0.08, type = 'sine', vol = 0.05, slide = 0 } = {}) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(vol, a.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur + 0.02);
  }

  function noise({ dur = 0.1, vol = 0.04 } = {}) {
    const a = ac(); if (!a) return;
    const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(); s.buffer = buf;
    const g = a.createGain(); g.gain.value = vol;
    s.connect(g).connect(a.destination);
    s.start();
  }

  const PFSound = {
    ping()    { blip({ freq: 880, dur: 0.06, type: 'triangle' }); },
    collect() { blip({ freq: 660, dur: 0.10, type: 'sine', slide: 400 }); },
    hit()     { noise({ dur: 0.12, vol: 0.06 }); blip({ freq: 120, dur: 0.10, type: 'sawtooth', vol: 0.04, slide: -40 }); },
    win()     { [523, 659, 784, 1046].forEach((f,i)=>setTimeout(()=>blip({freq:f,dur:0.15,type:'triangle'}), i*90)); },
    lose()    { [400, 300, 200].forEach((f,i)=>setTimeout(()=>blip({freq:f,dur:0.20,type:'sawtooth',vol:0.04,slide:-30}), i*120)); },
    tick()    { blip({ freq: 1200, dur: 0.03, type: 'square', vol: 0.02 }); },
  };
  window.PFSound = PFSound;
})();