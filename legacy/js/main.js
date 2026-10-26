/* ==========================================================================
   Invitación Lucero Jeamileth: render desde config, regalo de entrada,
   música, confeti, globos, cuenta regresiva, tarjeta 3D y RSVP.
   ========================================================================== */
(function () {
  const C = window.INVITACION;
  const $ = (s, el = document) => el.querySelector(s);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fecha = new Date(C.fecha);
  const nombreCompleto = C.nombre.join(" ");
  const COLORS = ["#e8352b", "#1675d1", "#ffd93b", "#ff8a00", "#ffffff", "#ff6fa5"];

  const fechaLarga = (() => {
    const t = fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return t.charAt(0).toUpperCase() + t.slice(1);
  })();
  const fechaCorta = fecha.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  /* ---------------- Render ---------------- */
  function render() {
    $("#logo").src = C.imagenes.logo;
    $("#foto").src = C.imagenes.foto;
    $("#tarjetaImg").src = C.imagenes.tarjeta;
    $("#grupoImg").src = C.imagenes.grupo;

    $("#edadTexto").textContent = C.edadTexto;
    $("#edad").textContent = C.edad;
    $("#heroFecha").textContent = `${fechaCorta} · ${C.horaTexto}`;

    // Título: cada letra con giro y altura distintos, como el logo de Bely y Beto
    const title = $("#title");
    title.setAttribute("aria-label", nombreCompleto);
    const rot = [-7, 5, -4, 6, -5, 3, -6, 4, -3];
    const lift = [0, -0.05, 0.03, -0.04, 0.02, -0.06, 0.03, -0.02, 0.04];
    let n = 0;
    C.nombre.forEach((palabra) => {
      const w = document.createElement("span");
      w.className = "word";
      w.setAttribute("aria-hidden", "true");
      [...palabra].forEach((letra) => {
        const ch = document.createElement("span");
        ch.className = "ch";
        ch.style.setProperty("--d", `${0.7 + n * 0.07}s`);
        const inner = document.createElement("span");
        inner.className = "ch__in";
        inner.dataset.ch = letra;
        inner.textContent = letra;
        inner.style.setProperty("--r", `${rot[n % rot.length]}deg`);
        inner.style.setProperty("--y", `${lift[n % lift.length]}em`);
        inner.style.setProperty("--i", n);
        ch.appendChild(inner);
        w.appendChild(ch);
        n++;
      });
      title.appendChild(w);
    });
    title.addEventListener("click", (e) => Confetti.burst(e.clientX, e.clientY, 60));

    $("#cardName").textContent = C.nombre[0];
    $("#cardDate").textContent = fechaLarga;
    $("#cardTime").textContent = `A partir de las ${C.horaTexto}`;

    $("#infoFecha").textContent = fechaLarga;
    $("#infoHora").textContent = `A partir de las ${C.horaTexto}`;
    $("#infoDir").textContent = C.lugar.direccion;
    $("#infoCol").textContent = C.lugar.colonia;
    $("#mapFrame").src = C.lugar.mapaEmbed;
    $("#btnMapa").href = C.lugar.mapa;

    $("#mensajeTxt").textContent = C.mensaje;
    $("#footerName").textContent = nombreCompleto;

    // Personajes recortados de la hoja de 4 × 2
    const friends = $("#friends");
    const url = `url("${encodeURI(C.imagenes.personajes)}")`;
    for (let i = 0; i < 8; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "friend";
      b.setAttribute("aria-label", "Saludar a un amigo");
      b.style.backgroundImage = url;
      b.style.backgroundPosition = `${((i % 4) / 3) * 100}% ${Math.floor(i / 4) * 100}%`;
      b.style.setProperty("--i", i);
      b.dataset.reveal = "zoom";
      b.style.setProperty("--rd", `${i * 0.07}s`);
      b.addEventListener("click", () => {
        b.classList.remove("is-jumping");
        void b.offsetWidth;
        b.classList.add("is-jumping");
        const r = b.getBoundingClientRect();
        Confetti.burst(r.left + r.width / 2, r.top + r.height / 3, 24);
        toast(["¡Hola!", "¡Nos vemos en la fiesta!", "¡Qué divertido!", "¡Feliz cumple, Lucero!"][i % 4]);
      });
      friends.appendChild(b);
    }

    // Estrellas del hero
    const stars = $("#stars");
    for (let i = 0; i < 16; i++) {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("viewBox", "0 0 24 24");
      s.classList.add("star");
      s.innerHTML = '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z"/>';
      const size = 12 + Math.random() * 22;
      Object.assign(s.style, {
        width: `${size}px`, left: `${Math.random() * 96}%`, top: `${Math.random() * 85}%`,
        animationDelay: `${Math.random() * 2.4}s`, animationDuration: `${1.8 + Math.random() * 1.6}s`,
      });
      stars.appendChild(s);
    }
  }

  /* ---------------- Música (empieza en el segundo indicado) ---------------- */
  const Music = (() => {
    const START = C.musica.inicio || 0;
    const audio = new Audio(`${C.musica.archivo}#t=${START}`);
    audio.preload = "auto";
    let playing = false;
    let fadeId;

    const toStart = () => { if (audio.currentTime < START) audio.currentTime = START; };
    audio.addEventListener("loadedmetadata", toStart);
    audio.addEventListener("playing", toStart);
    // Al terminar vuelve a empezar, saltando otra vez el inicio
    audio.addEventListener("ended", () => { audio.currentTime = START; audio.play(); });

    function fadeIn() {
      clearInterval(fadeId);
      audio.volume = 0;
      fadeId = setInterval(() => {
        audio.volume = Math.min(0.85, audio.volume + 0.05);
        if (audio.volume >= 0.85) clearInterval(fadeId);
      }, 80);
    }

    return {
      get playing() { return playing; },
      play() {
        playing = true;
        if (audio.readyState >= 1) toStart();
        return audio.play().then(fadeIn).catch(() => { playing = false; });
      },
      pause() { playing = false; audio.pause(); },
    };
  })();

  const musicBtn = $("#musicBtn");
  function syncMusicBtn() {
    musicBtn.classList.toggle("is-playing", Music.playing);
    musicBtn.setAttribute("aria-pressed", String(Music.playing));
    musicBtn.setAttribute("aria-label", Music.playing ? "Pausar música" : "Reproducir música");
  }
  musicBtn.addEventListener("click", () => {
    if (Music.playing) { Music.pause(); syncMusicBtn(); }
    else Music.play().then(syncMusicBtn);
  });

  let resumeOnShow = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { resumeOnShow = Music.playing; if (resumeOnShow) Music.pause(); }
    else if (resumeOnShow) Music.play().then(syncMusicBtn);
  });

  /* ---------------- Intro: abrir el regalo ---------------- */
  $("#gift").addEventListener("click", function () {
    if (this.classList.contains("is-open")) return;
    this.classList.add("is-open");
    Music.play().then(syncMusicBtn);
    const r = this.getBoundingClientRect();
    Confetti.burst(r.left + r.width / 2, r.top + r.height / 3, 160);
    setTimeout(() => {
      $("#intro").classList.add("is-gone");
      document.body.classList.remove("is-locked");
      document.body.classList.add("is-started");
      musicBtn.hidden = false;
      scrollCue();
      Balloons.start();
      setTimeout(() => Confetti.rain(90), 900);
    }, 1100);
  });

  /* ---------------- Botón para bajar: visible solo arriba ---------------- */
  function scrollCue() {
    const cue = $("#scrollCue");
    cue.hidden = false;
    const update = () => cue.classList.toggle("is-away", scrollY > 60);
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------------- Confeti (canvas) ---------------- */
  const Confetti = (() => {
    const cv = $("#confetti");
    const ctx = cv.getContext("2d");
    let parts = [], running = false, W = 0, H = 0;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener("resize", resize);

    function make(x, y, vx, vy) {
      return {
        x, y, vx, vy,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        round: Math.random() < 0.3, life: 0,
      };
    }
    function loop() {
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter((p) => p.y < H + 30 && p.life < 600);
      parts.forEach((p) => {
        p.vy += 0.18; p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 2);
        ctx.restore();
      });
      if (parts.length) requestAnimationFrame(loop);
      else { running = false; ctx.clearRect(0, 0, W, H); }
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

    return {
      burst(x, y, count = 80) {
        if (reduceMotion) return;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 4 + Math.random() * 9;
          parts.push(make(x, y, Math.cos(a) * s, Math.sin(a) * s - 6));
        }
        kick();
      },
      rain(count = 80) {
        if (reduceMotion) return;
        for (let i = 0; i < count; i++) {
          parts.push(make(Math.random() * W, -20 - Math.random() * H * 0.5, (Math.random() - 0.5) * 2, Math.random() * 2));
        }
        kick();
      },
    };
  })();

  /* ---------------- Globos que suben ---------------- */
  const Balloons = (() => {
    const box = $("#balloons");
    const palette = ["#e8352b", "#1675d1", "#ffd93b", "#ff8a00", "#ff6fa5"];
    function spawn() {
      const c = palette[(Math.random() * palette.length) | 0];
      const b = document.createElement("div");
      b.className = "balloon";
      const dur = 13 + Math.random() * 7;
      Object.assign(b.style, {
        left: `${Math.random() * 90}%`,
        width: `${40 + Math.random() * 26}px`,
        animationDuration: `${dur}s`,
      });
      b.innerHTML = `<svg viewBox="0 0 60 110">
        <path d="M30 62 C30 80 22 88 30 108" stroke="#8a6a4a" stroke-width="1.5" fill="none"/>
        <ellipse cx="30" cy="30" rx="24" ry="29" fill="${c}"/>
        <path d="M26 58 L34 58 L30 64 Z" fill="${c}"/>
        <ellipse cx="21" cy="19" rx="5" ry="9" fill="#fff" opacity=".45" transform="rotate(-20 21 19)"/>
      </svg>`;
      box.appendChild(b);
      setTimeout(() => b.remove(), dur * 1000);
    }
    return {
      start() {
        if (reduceMotion) return;
        for (let i = 0; i < 4; i++) setTimeout(spawn, i * 500);
        setInterval(() => { if (!document.hidden && scrollY < innerHeight) spawn(); }, 3000);
      },
    };
  })();

  /* ---------------- Cuenta regresiva ---------------- */
  function countdown() {
    const nums = {};
    document.querySelectorAll(".cd__num").forEach((el) => (nums[el.dataset.unit] = el));
    const pad = (v) => String(v).padStart(2, "0");
    let id;
    function update() {
      const diff = fecha - Date.now();
      if (diff <= 0) {
        clearInterval(id);
        $("#countdown").hidden = true;
        $("#countdownDone").hidden = false;
        return;
      }
      const vals = {
        d: Math.floor(diff / 864e5),
        h: Math.floor((diff / 36e5) % 24),
        m: Math.floor((diff / 6e4) % 60),
        s: Math.floor((diff / 1e3) % 60),
      };
      for (const k in vals) {
        const txt = pad(vals[k]);
        if (nums[k].textContent !== txt) {
          nums[k].textContent = txt;
          nums[k].classList.remove("tick");
          void nums[k].offsetWidth;
          nums[k].classList.add("tick");
        }
      }
    }
    update();
    id = setInterval(update, 1000);
  }

  /* ---------------- Tarjeta con inclinación 3D ---------------- */
  function tilt() {
    const card = $("#card3d");
    if (reduceMotion) return;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
      card.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
    });
    card.addEventListener("pointerleave", () => {
      ["--rx", "--ry"].forEach((p) => card.style.setProperty(p, "0deg"));
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "30%");
    });
  }

  /* ---------------- Agendar ---------------- */
  function calendar() {
    const fin = new Date(fecha.getTime() + 5 * 36e5);
    const p = (v) => String(v).padStart(2, "0");
    const fmt = (d) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
    const titulo = `Cumpleaños de ${nombreCompleto}`;
    const lugar = `${C.lugar.direccion}, ${C.lugar.colonia}`;
    const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

    $("#btnCal").addEventListener("click", () => {
      if (!apple) {
        window.open(
          "https://calendar.google.com/calendar/render?action=TEMPLATE" +
            `&text=${encodeURIComponent(titulo)}&dates=${fmt(fecha)}/${fmt(fin)}` +
            `&location=${encodeURIComponent(lugar)}`,
          "_blank"
        );
        return;
      }
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invitacion//ES", "BEGIN:VEVENT",
        `UID:${Date.now()}@invitacion`, `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(fecha)}`, `DTEND:${fmt(fin)}`,
        `SUMMARY:${titulo}`, `LOCATION:${lugar.replace(/,/g, "\\,")}`,
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${titulo}`, "END:VALARM",
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = "cumple-lucero.ics";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }

  /* ---------------- Animaciones al hacer scroll ---------------- */
  function reveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -30px 0px" });
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
  }

  /* ---------------- RSVP por WhatsApp ---------------- */
  function rsvp() {
    const form = $("#rsvpForm");
    const personas = form.elements.personas;
    form.querySelectorAll("[data-step]").forEach((b) =>
      b.addEventListener("click", () => {
        const v = (parseInt(personas.value, 10) || 1) + Number(b.dataset.step);
        personas.value = Math.min(+personas.max, Math.max(+personas.min, v));
      })
    );
    form.addEventListener("change", () => {
      $("#fieldPersonas").hidden = form.elements.asiste.value === "no";
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = form.elements.nombre.value.trim();
      const msg = form.elements.asiste.value === "si"
        ? `¡Hola! Soy ${nombre} y confirmo mi asistencia al cumpleaños de ${nombreCompleto} el ${fechaCorta}. Asistiremos ${personas.value} ${personas.value === "1" ? "persona" : "personas"}.`
        : `¡Hola! Soy ${nombre}. Lamentablemente no podré asistir al cumpleaños de ${nombreCompleto}. ¡Muchas felicidades!`;
      const r = form.querySelector("[type=submit]").getBoundingClientRect();
      Confetti.burst(r.left + r.width / 2, r.top, 90);
      window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  }

  /* ---------------- Toast ---------------- */
  let toastId;
  function toast(txt) {
    const t = $("#toast");
    t.textContent = txt;
    t.classList.add("is-on");
    clearTimeout(toastId);
    toastId = setTimeout(() => t.classList.remove("is-on"), 1800);
  }

  /* ---------------- Init ---------------- */
  render();
  countdown();
  tilt();
  calendar();
  reveal();
  rsvp();
})();
