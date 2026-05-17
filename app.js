/* ============================================================
   WORKSPACE AV — Main Application Script
   Sound • Vision • Control
   ============================================================ */

/* ── AUDIO SETUP ────────────────────────────────────────────
   Place your ambient audio file at:
   /assets/audio/workspace-ambient.mp3

   Free ambient audio sources:
   - Freesound.org (search "ambient tech" or "office hum")
   - Pixabay.com (search "ambient loop")
   - Zapsplat.com (search "tech ambience")

   The file should be:
   - MP3 format, ~128kbps
   - Seamlessly loopable
   - Soft and calming, not distracting
   - Duration: 30–120 seconds
   ──────────────────────────────────────────────────────────── */

// ============================================================
// STATE
// ============================================================
const state = {
  soundEnabled: false,
  introComplete: false,
  audioReady: false,
};

// ============================================================
// AUDIO SYSTEM
// ============================================================
const audio = document.getElementById('ambient-audio');

/* Read saved preference — default is muted */
state.soundEnabled = localStorage.getItem('wav-sound') === 'on';

function initAudio() {
  if (!audio) return;
  audio.volume = 0.22;
  audio.loop = true;
  state.audioReady = true;
  updateSoundUI();
}

function playSoundIfEnabled() {
  if (!audio || !state.soundEnabled) return;
  const p = audio.play();
  if (p !== undefined) {
    p.catch(() => {
      /* Browser blocked autoplay — user needs another interaction */
    });
  }
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  localStorage.setItem('wav-sound', state.soundEnabled ? 'on' : 'off');
  if (state.soundEnabled) {
    playSoundIfEnabled();
  } else {
    if (audio) audio.pause();
  }
  updateSoundUI();
}

function updateSoundUI() {
  const btn = document.getElementById('sound-btn');
  if (!btn) return;
  if (state.soundEnabled) {
    btn.classList.add('sound-on');
    btn.classList.remove('sound-off');
    btn.setAttribute('title', 'Sound On — click to mute');
  } else {
    btn.classList.remove('sound-on');
    btn.classList.add('sound-off');
    btn.setAttribute('title', 'Sound Off — click to enable');
  }
}

// ============================================================
// CANVAS PARTICLE NETWORK (Intro Background)
// ============================================================
function initIntroCanvas() {
  const canvas = document.getElementById('intro-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* Node configuration */
  const NODE_COUNT = 55;
  const CONNECT_DIST = 160;
  const nodes = [];

  class Node {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * canvas.width;
      this.y  = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.r  = Math.random() * 2.5 + 1;
      this.alpha = Math.random() * 0.5 + 0.2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14,165,233,${this.alpha})`;
      ctx.fill();
      /* Glow */
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14,165,233,${this.alpha * 0.15})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node());

  let animId;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Draw connecting lines */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < CONNECT_DIST) {
          const a = (1 - dist / CONNECT_DIST) * 0.35;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(6,214,214,${a})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    nodes.forEach(n => { n.update(); n.draw(); });
    animId = requestAnimationFrame(tick);
  }
  tick();

  /* Stop animation after intro dismissed to free resources */
  window._stopIntroCanvas = () => {
    cancelAnimationFrame(animId);
  };
}

// ============================================================
// INTRO SCREEN
// ============================================================
function initIntro() {
  const screen = document.getElementById('intro-screen');
  const mainSite = document.getElementById('main-site');

  function dismissIntro() {
    screen.classList.add('fade-out');
    document.body.classList.remove('no-scroll');
    state.introComplete = true;

    /* Start audio after explicit user interaction (browser policy) */
    playSoundIfEnabled();

    setTimeout(() => {
      screen.style.display = 'none';
      if (window._stopIntroCanvas) window._stopIntroCanvas();
    }, 1300);
  }

  const btnStart = document.getElementById('btn-start-exp');
  const btnSkip  = document.getElementById('btn-skip');

  if (btnStart) btnStart.addEventListener('click', () => {
    /* Allow sound from this click */
    initAudio();
    state.soundEnabled = localStorage.getItem('wav-sound') !== 'off';
    dismissIntro();
  });
  if (btnSkip) btnSkip.addEventListener('click', dismissIntro);

  /* Generate intro wave bars dynamically */
  const waveCont = document.getElementById('intro-waves');
  if (waveCont) {
    for (let i = 0; i < 60; i++) {
      const sp = document.createElement('span');
      const h = Math.random() * 60 + 6;
      sp.style.height = h + 'px';
      sp.style.animationDuration = (Math.random() * 0.8 + 1.2) + 's';
      sp.style.animationDelay    = (Math.random() * 1.5) + 's';
      waveCont.appendChild(sp);
    }
  }
}

// ============================================================
// NAVIGATION SCROLL BEHAVIOUR
// ============================================================
function initNav() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ============================================================
// SCROLL-TRIGGERED REVEAL ANIMATIONS
// ============================================================
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
          .forEach(el => obs.observe(el));
}

// ============================================================
// ANIMATED COUNTERS
// ============================================================
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        runCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => obs.observe(c));
}

function runCounter(el) {
  const target   = parseFloat(el.dataset.counter);
  const suffix   = el.dataset.suffix || '';
  const prefix   = el.dataset.prefix || '';
  const duration = 2200;
  const steps    = 60;
  const inc      = target / steps;
  let   current  = 0;
  let   step     = 0;

  const t = setInterval(() => {
    step++;
    current += inc;
    if (step >= steps) {
      current = target;
      clearInterval(t);
    }
    const display = Number.isInteger(target)
      ? Math.round(current)
      : current.toFixed(1);
    el.textContent = prefix + display + suffix;
  }, duration / steps);
}

// ============================================================
// WORKSPACE MODE SELECTOR
// ============================================================
function initModeSelector() {
  const tabs   = document.querySelectorAll('.mode-tab');
  const panels = document.querySelectorAll('.mode-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.mode;

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const panel = document.getElementById('mode-' + target);
      if (panel) panel.classList.add('active');
    });
  });
}

// ============================================================
// CHATBOT — DEMO (no API key required)
// ============================================================
/*
  TO CONNECT A REAL AI API:
  1. Create a backend endpoint (Node/Express, Python Flask, etc.) at /api/chat
  2. On the backend, call OpenAI / Anthropic / Claude API securely
  3. NEVER expose API keys in frontend JavaScript
  4. Replace the getDemoResponse() call below with:

     async function getAIResponse(message) {
       const res = await fetch('/api/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message })
       });
       const data = await res.json();
       return data.reply;
     }

  Backend example (Express + OpenAI):

     app.post('/api/chat', async (req, res) => {
       const { message } = req.body;
       const completion = await openai.chat.completions.create({
         model: 'gpt-4',
         messages: [
           { role: 'system', content: WORKSPACE_AV_SYSTEM_PROMPT },
           { role: 'user',   content: message }
         ]
       });
       res.json({ reply: completion.choices[0].message.content });
     });
*/

const KNOWLEDGE = {
  greeting: "Hi, I'm the Workspace AV Assistant. Tell me about your space and I'll help you find the right AV solution.",
  meeting_room: [
    "Great choice. For meeting rooms we typically recommend a reliable video conferencing system (Microsoft Teams Rooms or Zoom Rooms), a high-quality ceiling microphone array, a wide-angle 4K camera, a large display or dual screens, wireless presentation, and a room scheduling panel.",
    "Every meeting room is different — for a tailored recommendation, I'd suggest booking a free consultation with our team."
  ],
  boardroom: [
    "Boardrooms deserve premium. We design executive spaces with multi-screen displays, PTZ cameras for wide coverage, distributed speaker arrays, seamless wireless presentation, and elegant one-touch control panels.",
    "We also integrate room scheduling, lighting control, and blind automation for a fully connected boardroom experience. Book a consultation to get a custom design."
  ],
  huddle: [
    "Huddle spaces work best when they're fast and frictionless. We typically use a compact all-in-one video bar (like Logitech Rally Bar Mini or Poly Studio), a single quality display, wireless screen sharing, and a simple booking panel outside the door.",
    "The goal: walk in, connect, collaborate, walk out — zero fuss."
  ],
  training: [
    "Training rooms need versatility. We design multi-use spaces with large displays or projection systems, distributed audio, cameras for recording or streaming, wireless presenting from multiple sources, and AV routing for different room layouts.",
    "We can also integrate webinar and lecture capture systems. Let me know your space dimensions and we'll design the right solution."
  ],
  signage: [
    "Our digital signage solutions cover everything from lobby media walls and reception displays to internal communication screens and wayfinding systems.",
    "We supply, install, and configure content management systems so your team can update screens easily — no technical knowledge required."
  ],
  scheduling: [
    "Room and resource scheduling panels sync directly with Microsoft 365, Google Workspace, or other calendar systems. Staff can see room availability at a glance, book instantly, and the system automatically releases rooms that aren't used.",
    "We install purpose-built panels from brands like Joan, Logitech, and Crestron."
  ],
  video_conferencing: [
    "We design and install complete video conferencing systems certified for Microsoft Teams, Zoom, Cisco Webex, and Google Meet.",
    "Our solutions ensure every remote participant can see and hear clearly — equal experience for everyone in the room and on screen."
  ],
  consultation: [
    "Absolutely — our consultations are free and obligation-free.",
    "You can request a consultation through the form on this page, or email us at sales@workspaceav.com.au. We'll discuss your space, goals, existing technology, and budget.",
    "Our office hours are Monday to Friday, 8:30am–4:30pm."
  ],
  contact: [
    "You can reach Workspace AV at:\n\n📧 sales@workspaceav.com.au\n📍 14/58 Box Road, Taren Point NSW 2229\n🕐 Mon–Fri, 8:30am–4:30pm"
  ],
  pricing: [
    "Pricing depends on room size, number of spaces, technology requirements, and installation complexity. We provide detailed proposals after understanding your specific needs.",
    "I'd recommend booking a free consultation — there's no obligation and it gives us the information to prepare an accurate quote."
  ],
  about: [
    "Workspace AV is an Australian audio-visual solutions company serving corporate, government, and education clients nationwide.",
    "We provide end-to-end service: consultation, design, supply, installation, integration, training, and ongoing support.",
    "Our focus: Sound • Vision • Control — technology that works intuitively for every person in the room."
  ],
  default: [
    "That's a great question. To give you the most accurate answer, could you tell me a little more about your space — what type of room it is, approximate size, and what you're trying to achieve?",
    "Or, if you'd prefer to speak directly with our team, feel free to book a free consultation or email sales@workspaceav.com.au."
  ]
};

function getDemoResponse(message) {
  const m = message.toLowerCase();
  if (m.includes('meeting room') || m.includes('conference room'))
    return KNOWLEDGE.meeting_room[Math.floor(Math.random() * KNOWLEDGE.meeting_room.length)];
  if (m.includes('boardroom') || m.includes('board room') || m.includes('executive'))
    return KNOWLEDGE.boardroom[Math.floor(Math.random() * KNOWLEDGE.boardroom.length)];
  if (m.includes('huddle'))
    return KNOWLEDGE.huddle[Math.floor(Math.random() * KNOWLEDGE.huddle.length)];
  if (m.includes('training') || m.includes('multi-use') || m.includes('multiuse'))
    return KNOWLEDGE.training[Math.floor(Math.random() * KNOWLEDGE.training.length)];
  if (m.includes('signage') || m.includes('sign') || m.includes('display') || m.includes('screen'))
    return KNOWLEDGE.signage[Math.floor(Math.random() * KNOWLEDGE.signage.length)];
  if (m.includes('schedul') || m.includes('booking') || m.includes('room booking'))
    return KNOWLEDGE.scheduling[Math.floor(Math.random() * KNOWLEDGE.scheduling.length)];
  if (m.includes('video') || m.includes('teams') || m.includes('zoom') || m.includes('webex') || m.includes('conferenc'))
    return KNOWLEDGE.video_conferencing[Math.floor(Math.random() * KNOWLEDGE.video_conferencing.length)];
  if (m.includes('consult') || m.includes('book') || m.includes('appointment') || m.includes('meet with'))
    return KNOWLEDGE.consultation[Math.floor(Math.random() * KNOWLEDGE.consultation.length)];
  if (m.includes('contact') || m.includes('email') || m.includes('phone') || m.includes('address') || m.includes('office'))
    return KNOWLEDGE.contact[0];
  if (m.includes('price') || m.includes('pricing') || m.includes('cost') || m.includes('quote') || m.includes('how much'))
    return KNOWLEDGE.pricing[Math.floor(Math.random() * KNOWLEDGE.pricing.length)];
  if (m.includes('about') || m.includes('who are') || m.includes('what do you do'))
    return KNOWLEDGE.about[Math.floor(Math.random() * KNOWLEDGE.about.length)];
  if (m.includes('upgrade') || m.includes('improve') || m.includes('better') || m.includes('help'))
    return "I'd love to help you upgrade your space. Could you tell me what type of room it is and what's currently frustrating you about it?";
  return KNOWLEDGE.default[Math.floor(Math.random() * KNOWLEDGE.default.length)];
}

function initChatbot() {
  const toggleBtn  = document.getElementById('chat-toggle-btn');
  const closeBtn   = document.getElementById('chat-close');
  const chatWindow = document.getElementById('chat-window');
  const messages   = document.getElementById('chat-messages');
  const input      = document.getElementById('chat-input');
  const sendBtn    = document.getElementById('chat-send');
  const quickPrompts = document.querySelectorAll('.quick-prompt');

  function openChat() {
    chatWindow.classList.add('open');
    input.focus();
  }
  function closeChat() {
    chatWindow.classList.remove('open');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', () => {
    chatWindow.classList.contains('open') ? closeChat() : openChat();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeChat);

  function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    /* Preserve newlines */
    div.style.whiteSpace = 'pre-line';
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.id = 'typing-indicator';
    div.innerHTML = '<span style="opacity:0.6;letter-spacing:0.1em;">···</span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function sendMessage(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    input.value = '';

    const typing = showTypingIndicator();
    /* Simulate a short delay for realism */
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      typing.remove();
      const reply = getDemoResponse(text);
      addMessage(reply, 'bot');
    }, delay);
  }

  if (sendBtn) sendBtn.addEventListener('click', () => sendMessage(input.value));
  if (input) input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  quickPrompts.forEach(btn => {
    btn.addEventListener('click', () => {
      openChat();
      sendMessage(btn.textContent);
    });
  });
}

// ============================================================
// CONTACT FORM
// ============================================================
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    const original = btn.textContent;

    btn.textContent = 'Sending…';
    btn.disabled = true;

    /* Simulate async send — replace with real fetch('/api/contact', ...) */
    setTimeout(() => {
      btn.textContent = 'Request Sent ✓';
      btn.style.background = 'linear-gradient(135deg, #10b981, #06d6d6)';

      setTimeout(() => {
        form.reset();
        btn.textContent = original;
        btn.disabled = false;
        btn.style.background = '';
      }, 3500);
    }, 1200);
  });
}

// ============================================================
// PARALLAX (subtle, lightweight)
// ============================================================
function initParallax() {
  const orbs = document.querySelectorAll('.orb');
  if (!orbs.length) return;

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    orbs.forEach((orb, i) => {
      const speed = 0.04 + i * 0.015;
      orb.style.transform = `translateY(${sy * speed}px)`;
    });
  }, { passive: true });
}

// ============================================================
// SMOOTH SCROLL FOR NAV LINKS
// ============================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ============================================================
// SOUND BUTTON CLICK HANDLER
// ============================================================
function initSoundButton() {
  const btn = document.getElementById('sound-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!state.audioReady) initAudio();
      toggleSound();
    });
  }
}

// ============================================================
// INIT — run after DOM ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('no-scroll');

  initIntroCanvas();
  initIntro();
  initAudio();
  initSoundButton();
  initNav();
  initReveal();
  initCounters();
  initModeSelector();
  initChatbot();
  initContactForm();
  initParallax();
  initSmoothScroll();
});
