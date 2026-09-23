/* SkillSwap Campus — app logic (hash router, no build step) */

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let exploreStudents = STUDENTS;

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- theme ---------- */
const savedTheme = localStorage.getItem("ssc-theme") || "light";
document.documentElement.dataset.theme = savedTheme;
$("#theme-toggle").textContent = savedTheme === "dark" ? "☀️" : "🌙";
function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("ssc-theme", next);
  $("#theme-toggle").textContent = next === "dark" ? "☀️" : "🌙";
}
$("#theme-toggle").addEventListener("click", toggleTheme);
$("#menu-btn").addEventListener("click", () => $("#nav").classList.toggle("open"));

/* ---------- shared partials ---------- */
function skillCard(s, showMatch) {
  const swapControl = s.isLive
    ? `<button class="btn btn-primary btn-sm" style="flex:1" data-swap-id="${esc(s.id)}" data-swap-name="${esc(s.name)}">Request swap</button>`
    : `<button class="btn btn-primary btn-sm" style="flex:1" data-demo-swap>Request swap</button>`;
  return `
  <article class="card card-hover">
    <div class="row">
      <img class="avatar" src="${s.avatar}" alt="${esc(s.name)} avatar" loading="lazy" />
      <div style="min-width:0">
        <h3 style="font-size:1rem">${esc(s.name)}</h3>
        <p class="muted" style="font-size:.8rem">${esc(s.college)} • ${esc(s.year)}</p>
      </div>
      ${showMatch && s.match ? `<span class="match-ring">${s.match}%</span>` : ""}
    </div>
    <p class="muted" style="font-size:.86rem;margin-top:.75rem">${esc(s.bio)}</p>
    <div class="divider"></div>
    <p class="mini-label">Teaches</p>
    <div class="chip-list">${s.teaches.map((t) => `<span class="badge">${esc(t.name)}</span>`).join("")}</div>
    <p class="mini-label" style="margin-top:.75rem">Wants to learn</p>
    <div class="chip-list">${s.learns.map((t) => `<span class="badge badge-soft">${esc(t.name)}</span>`).join("")}</div>
    <div class="row between" style="margin-top:1rem">
      <span class="muted" style="font-size:.8rem">⭐ ${s.rating} • ${s.swaps} swaps • ${esc(s.mode)}</span>
    </div>
    <div class="row" style="margin-top:.85rem;flex-wrap:nowrap">
      <a class="btn btn-outline btn-sm" style="flex:1" href="#/student/${s.id}">View profile</a>
      ${swapControl}
    </div>
  </article>`;
}

function statCard(label, value, sub) {
  return `<div class="card"><strong>${value}</strong><p class="muted" style="font-size:.85rem">${label}</p>
    ${sub ? `<p class="badge badge-success" style="margin-top:.5rem">${sub}</p>` : ""}</div>`;
}

function getCommunityPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem('ssc-community-posts') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function appShell(active, inner) {
  const items = [
    ["dashboard", "🏠 Dashboard"], ["explore", "🔍 Explore"], ["matches", "⚡ Matches"],
    ["my-skills", "🎯 My Skills"], ["requests", "📨 Requests"], ["sessions", "📅 Sessions"],
    ["messages", "💬 Messages"], ["courses", "📚 Courses"], ["profile", "👤 Profile"],
  ];
  return `<div class="container app-shell">
    <aside class="sidebar">
      ${items.map(([k, l]) => `<a href="#/${k}" class="${active === k ? "active" : ""}">${l}</a>`).join("")}
    </aside>
    <section style="min-width:0">${inner}</section>
  </div>`;
}

/* ---------- pages ---------- */
const pages = {
  "/": () => `
  <section class="hero">
    <div class="container hero-grid">
      <div>
        <span class="eyebrow">✦ 12,000+ students swapping skills</span>
        <h1 style="margin-top:1rem">Exchange Skills.<br /><span class="gradient-text">Build Connections.</span><br />Grow Together.</h1>
        <p class="lead">Teach what you know, learn what you love — no money involved. SkillSwap Campus matches you with students who want your skills and have the ones you need.</p>
        <div class="row">
          <a class="btn btn-primary" href="#/signup">Start swapping free</a>
          <a class="btn btn-outline" href="#/explore">Explore skills</a>
        </div>
        <div class="stats">
          <div><strong>12k+</strong><span>Active students</span></div>
          <div><strong>340+</strong><span>Skills listed</span></div>
          <div><strong>28k</strong><span>Swaps completed</span></div>
          <div><strong>4.8★</strong><span>Average rating</span></div>
        </div>
      </div>
      <div class="hero-card">
        <p class="mini-label">Live swap match</p>
        <div class="swap-visual" style="margin-top:1rem">
          <div class="pill">🐍<br />You teach<br /><strong>Python</strong></div>
          <div class="swap-arrow">⇄</div>
          <div class="pill">🎨<br />You learn<br /><strong>UI/UX</strong></div>
        </div>
        <div class="divider"></div>
        ${STUDENTS.slice(0, 3).map((s) => `
          <div class="list-item">
            <img class="avatar avatar-sm" src="${s.avatar}" alt="" loading="lazy" />
            <div style="min-width:0;flex:1">
              <strong style="font-size:.88rem">${esc(s.name)}</strong>
              <p class="muted" style="font-size:.78rem">Teaches ${esc(s.teaches[0].name)}</p>
            </div>
            <span class="badge">${s.match}%</span>
          </div>`).join("")}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head"><h2>Popular skills on campus</h2><p>Discover what students are teaching and learning right now.</p></div>
      <div class="grid g4">
        ${POPULAR_SKILLS.map((s) => `<a class="card card-hover" href="#/explore" style="text-align:center">
          <div style="font-size:1.8rem">${s.icon}</div>
          <h3 style="font-size:.95rem;margin-top:.5rem">${esc(s.name)}</h3>
          <p class="muted" style="font-size:.8rem">${s.learners} learners</p>
        </a>`).join("")}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head"><h2>How a swap works</h2><p>Three simple steps from sign-up to your first session.</p></div>
      <div class="grid g2">
        ${[["List your skills", "Add what you can teach and what you want to learn."],
           ["Get matched", "Our match score ranks students by mutual fit."],
           ["Swap & grow", "Schedule a session, teach, learn, and rate each other."]]
          .map(([t, d], i) => `<div class="card step"><span class="step-num">${i + 1}</span><h3 style="font-size:1.05rem">${t}</h3><p class="muted" style="font-size:.9rem;margin-top:.35rem">${d}</p></div>`).join("")}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head"><h2>Top students this week</h2><p>Highly rated peers ready to swap.</p></div>
      <div class="grid g3">${STUDENTS.slice(0, 4).map((s) => skillCard(s, true)).join("")}</div>
      <div style="text-align:center;margin-top:2rem"><a class="btn btn-primary" href="#/explore">Browse all students</a></div>
    </div>
  </section>`,

  "/explore": async () => {
    const signedIn = Boolean(localStorage.getItem('ssc-access-token'));
    const users = signedIn ? await api.request('/users').catch(() => []) : [];
    exploreStudents = users.length ? users.map(toCardStudent) : (signedIn ? [] : STUDENTS);
    return `
  <div class="container" style="padding:2.5rem 0 4rem">
    <h1 style="font-size:2rem">Explore skills</h1>
    <p class="muted">Find students who teach what you want to learn.</p>
    <div class="card" style="margin-top:1.5rem">
      <div class="grid" style="grid-template-columns:2fr 1fr 1fr">
        <div><label for="q">Search</label><input id="q" placeholder="Search name, skill or college..." /></div>
        <div><label for="cat">Category</label><select id="cat"><option>All categories</option>${CATEGORIES.map((c) => `<option>${c}</option>`).join("")}</select></div>
        <div><label for="mode">Mode</label><select id="mode"><option>All modes</option><option>Online</option><option>Offline</option><option>Both</option></select></div>
      </div>
    </div>
    <p class="muted" style="margin:1.25rem 0 .75rem" id="count"></p>
    <div class="grid g3" id="results"></div>
    ${signedIn && !exploreStudents.length ? '<div class="card" style="margin-top:1rem"><p class="muted">No other registered members have joined yet. Invite a classmate to create the first live swap.</p></div>' : ''}
  </div>`;
  },

  "/matches": async () => {
    const matches = await api.getMatches().catch(() => []);
    const cards = matches.map(toCardStudent);
    return appShell("matches", `
    <h1 style="font-size:1.8rem">Your skill matches</h1>
    <p class="muted">Ranked by compatibility with your teach + learn profile.</p>
    ${matches.length ? `<div class="card" style="margin:1.25rem 0;background:var(--grad-hero);color:#fff;border:none">
      <h2 style="font-size:1.4rem">Top match today: ${matches[0].score}%</h2>
      <p style="opacity:.92;font-size:.92rem;margin-top:.4rem">${esc(matches[0].aiExplanation || matches[0].matchReason)}</p>
    </div>
    <div class="grid g3">${cards.map((s) => skillCard(s, true)).join("")}</div>` : '<div class="card" style="margin-top:1.25rem"><h3>No live matches yet</h3><p class="muted">Add skills you teach and want to learn, then return here for personalized matches.</p></div>'}`);
  },

  "/dashboard": async () => {
    const user = JSON.parse(localStorage.getItem("ssc-user") || "{}");
    const me = await api.getMe().catch(() => user);
    const matches = await api.getMatches().catch(() => []);
    
    return appShell("dashboard", `
    <h1 style="font-size:1.8rem">Welcome back, ${esc(me.name || "User")} 👋</h1>
    <p class="muted">Here's what's happening with your swaps today.</p>
    <div class="grid g4" style="margin:1.25rem 0">
      ${statCard("Credits", me.credits || 0, "Current balance")}
      ${statCard("Skills taught", me.skillsTeach?.length || 0, "Active")}
      ${statCard("Skills learning", me.skillsLearn?.length || 0, "On track")}
      ${statCard("Rating", me.rating || "N/A", "Community score")}
    </div>
    <div class="grid g2">
      <div class="card">
        <h3 style="font-size:1.05rem">Recommended Matches</h3>
        ${matches.length ? matches.slice(0, 3).map(m => `<div class="list-item">
          <div style="flex:1;min-width:0"><strong style="font-size:.9rem">${esc(m.name)}</strong>
          <p class="muted" style="font-size:.8rem">${esc(m.collegeName)} • Match: ${m.score}%</p></div>
          <a href="#/matches" class="btn btn-ghost btn-sm">View</a>
        </div>`).join("") : '<p class="muted">No matches found yet.</p>'}
      </div>
      <div class="card">
        <h3 style="font-size:1.05rem">Learning Progress</h3>
        <p class="muted">Your current skill tracks will appear here.</p>
      </div>
    </div>
    <div class="card" style="margin-top:1.25rem">
      <div class="row between"><h3 style="font-size:1.05rem">Top Matches for You</h3><a class="btn btn-ghost btn-sm" href="#/matches">See all</a></div>
      <div class="grid g3" style="margin-top:1rem">
        ${matches.slice(0, 3).map(m => skillCard(toCardStudent(m), true)).join("")}
      </div>
    </div>`);
  },

  "/my-skills": async () => {
    const me = await api.getMe().catch(() => ({}));
    return appShell("my-skills", `
    <div class="row between"><div><h1 style="font-size:1.8rem">My skills</h1><p class="muted">Manage what you teach and what you want to learn.</p></div>
    <button class="btn btn-primary" data-toast="Skill menu opened">Manage Skills</button></div>
    <div class="grid g2" style="margin-top:1.25rem">
      <div class="card">
        <h3 style="font-size:1.05rem">Skills I teach</h3>
        <div style="margin-bottom:1rem">
          ${(me.skillsTeach || []).map(s => `<div class="list-item"><div style="flex:1"><strong style="font-size:.9rem">${esc(s.name)}</strong><p class="muted" style="font-size:.8rem">${s.proficiency}</p></div></div>`).join("") || '<p class="muted">No skills listed.</p>'}
        </div>
        <form data-skill-add data-type="teach" style="background:var(--muted);padding:1rem;border-radius:12px">
          <div class="field"><label>Skill</label><input id="skill-select" required placeholder="e.g. Python" /></div>
          <div class="field">
            <label>Level</label>
            <select id="prof-level"><option>Beginner</option><option selected>Intermediate</option><option>Advanced</option></select>
          </div>
          <button class="btn btn-primary btn-sm btn-block" type="submit">+ Add Teaching Skill</button>
        </form>
      </div>
      <div class="card">
        <h3 style="font-size:1.05rem">Skills I'm learning</h3>
        <div style="margin-bottom:1rem">
          ${(me.skillsLearn || []).map(s => `<div class="list-item"><div style="flex:1"><strong style="font-size:.9rem">${esc(s.name)}</strong><p class="muted" style="font-size:.8rem">${s.proficiency}</p></div></div>`).join("") || '<p class="muted">No skills listed.</p>'}
        </div>
        <form data-skill-add data-type="learn" style="background:var(--muted);padding:1rem;border-radius:12px">
          <div class="field"><label>Skill</label><input id="skill-select" required placeholder="e.g. UI/UX" /></div>
          <div class="field">
            <label>Level</label>
            <select id="prof-level"><option selected>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
          </div>
          <button class="btn btn-primary btn-sm btn-block" type="submit">+ Add Learning Skill</button>
        </form>
      </div>
    </div>`);
  },

  "/requests": async () => {
    const [me, swaps] = await Promise.all([api.getMe(), api.getMySwaps()]);
    return appShell("requests", `
    <h1 style="font-size:1.8rem">Swap requests</h1>
    <p class="muted">Accept a swap to unlock scheduling and chat.</p>
    <div class="card" style="margin-top:1.25rem">
      ${swaps.length ? swaps.map((swap) => {
        const other = swap.requesterId === me.id ? swap.recipient : swap.requester;
        const canRespond = swap.recipientId === me.id && swap.status === 'requested';
        const canCancel = swap.requesterId === me.id && swap.status === 'requested';
        return `<div class="list-item"><div style="flex:1;min-width:0"><strong style="font-size:.9rem">${esc(other.name)}</strong>
          <p class="muted" style="font-size:.82rem">${esc(swap.skill?.name || 'Skill swap')} · ${esc(swap.message || 'No message included')}</p></div>
          ${canRespond ? `<button class="btn btn-primary btn-sm" data-swap-status="accepted" data-swap-id="${swap.id}">Accept</button><button class="btn btn-outline btn-sm" data-swap-status="declined" data-swap-id="${swap.id}">Decline</button>` : canCancel ? `<button class="btn btn-outline btn-sm" data-swap-status="cancelled" data-swap-id="${swap.id}">Cancel request</button>` : `<span class="badge">${esc(swap.status)}</span>`}
        </div>`;
      }).join('') : '<p class="muted">No swap requests yet. Explore matches to start one.</p>'}
    </div>`);
  },

  "/sessions": async () => {
    const [me, sessions] = await Promise.all([api.getMe(), api.getSessions()]);
    return appShell("sessions", `
    <h1 style="font-size:1.8rem">Sessions</h1>
    <p class="muted">Your scheduled teaching and learning sessions.</p>
    <div class="grid g2" style="margin-top:1.25rem">
      ${sessions.length ? sessions.map((session) => {
        const swap = session.swapRequest;
        const other = swap.requesterId === me.id ? swap.recipient : swap.requester;
        return `<div class="card card-hover"><div class="row between"><span class="badge">${esc(session.status)}</span><span class="badge badge-soft">${new Date(session.scheduledAt).toLocaleString()}</span></div>
          <h3 style="font-size:1rem;margin-top:.75rem">${esc(swap.skill?.name || 'Skill swap')}</h3><p class="muted" style="font-size:.85rem">with ${esc(other.name)}</p>
          <div class="row" style="margin-top:1rem">${session.meetingLink ? `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="${esc(session.meetingLink)}">Join session</a>` : ''}${session.status === 'scheduled' ? `<button class="btn btn-outline btn-sm" data-session-complete="${session.id}">Mark completed</button>` : ''}</div>
        </div>`;
      }).join('') : '<div class="card"><p class="muted">No sessions scheduled yet. Accept a swap request first.</p></div>'}
    </div>`);
  },

  "/messages": async () => {
    const [me, swaps] = await Promise.all([api.getMe(), api.getMySwaps()]);
    const available = swaps.filter((swap) => ['accepted', 'scheduled', 'completed'].includes(swap.status));
    if (!available.length) return appShell('messages', '<h1 style="font-size:1.8rem">Messages</h1><div class="card" style="margin-top:1.25rem"><p class="muted">Accept a swap request to start messaging.</p></div>');
    const active = available[0];
    const other = active.requesterId === me.id ? active.recipient : active.requester;
    const history = await api.getMessages(active.id);
    return appShell("messages", `
    <h1 style="font-size:1.8rem">Messages</h1>
    <div class="card" style="margin-top:1.25rem">
        <div class="row"><img class="avatar avatar-sm" src="${esc(other.avatarUrl)}" alt="" /><strong>${esc(other.name)}</strong><span class="badge">${esc(active.status)}</span></div>
        <div class="divider"></div>
        <div>${history.messages.length ? history.messages.map((message) => `<p style="font-size:.9rem;background:${message.senderId === me.id ? 'var(--grad);color:#fff' : 'var(--muted)'};padding:.6rem .8rem;border-radius:12px;max-width:75%;margin:${message.senderId === me.id ? '.6rem 0 .6rem auto' : '.6rem 0'}">${esc(message.content)}</p>`).join('') : '<p class="muted">No messages yet. Say hello!</p>'}</div>
        <form class="row" style="margin-top:1rem;flex-wrap:nowrap" data-message-form data-swap-id="${active.id}">
          <input id="message-content" placeholder="Type a message..." required />
          <button class="btn btn-primary btn-sm" type="submit">Send</button>
        </form>
    </div>`);
  },

  "/courses": async () => {
    const query = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || 'Python';
    const result = await api.getCourses(query);
    return appShell('courses', `
      <h1 style="font-size:1.8rem">Courses & learning resources</h1>
      <p class="muted">Find free video courses to support the skills you are learning.</p>
      <form class="row" data-course-search style="margin:1.25rem 0;flex-wrap:nowrap">
        <input id="course-query" value="${esc(query)}" aria-label="Search courses" placeholder="Search Python, Figma, public speaking..." required />
        <button class="btn btn-primary" type="submit">Search</button>
      </form>
      <p class="muted" style="margin-bottom:1rem">Results for <strong>${esc(result.query)}</strong></p>
      <div class="grid g3">${result.courses.length ? result.courses.map((course) => `<article class="card card-hover">
        ${course.thumbnail ? `<img src="${esc(course.thumbnail)}" alt="" loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px" />` : ''}
        <h3 style="font-size:1rem;margin-top:.75rem">${esc(course.title)}</h3>
        <p class="muted" style="font-size:.82rem;margin-top:.35rem">${esc(course.instructor)}</p>
        <p class="muted" style="font-size:.84rem;margin-top:.6rem">${esc(course.description).slice(0, 140)}${course.description.length > 140 ? '…' : ''}</p>
        <a class="btn btn-outline btn-sm" style="margin-top:1rem" href="${esc(course.url)}" target="_blank" rel="noopener">Watch course</a>
      </article>`).join('') : '<div class="card"><p class="muted">No courses found. Try a different skill.</p></div>'}</div>`);
  },

  "/profile": async () => {
    const user = JSON.parse(localStorage.getItem("ssc-user") || "{}");
    const me = await api.getMe().catch(() => user);
    
    return appShell("profile", `
    <div class="card">
      <div class="row">
        <img class="avatar" style="width:76px;height:76px" src="${me.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}" alt="" />
        <div><h1 style="font-size:1.5rem">${esc(me.name || "User")}</h1>
        <p class="muted" style="font-size:.9rem">${esc(me.collegeName || "College not set")} • Verified: ${me.isVerified ? 'Yes' : 'No'}</p>
        <div class="chip-list"><span class="badge">⭐ ${me.rating || 0}</span><span class="badge badge-soft">Credits: ${me.credits || 0}</span><span class="badge ${me.isVerified ? 'badge-success' : 'badge-soft'}">${me.isVerified ? 'Verified' : 'Unverified'}</span></div></div>
        <button class="btn btn-outline btn-sm" style="margin-left:auto" type="button" data-focus-profile>Edit profile</button>
      </div>
      <div class="divider"></div>
      <p class="muted" style="font-size:.9rem">${esc(me.bio || "No bio added yet.")}</p>
    </div>
    <form class="card" id="profile-editor" data-profile-update style="margin-top:1.25rem">
      <h2 style="font-size:1.1rem">Edit profile</h2>
      <p class="muted" style="font-size:.88rem;margin-top:.25rem">Update the details other students see.</p>
      <div class="grid g2" style="margin-top:1rem">
        <div class="field"><label for="profile-name">Full name</label><input id="profile-name" required maxlength="100" value="${esc(me.name || "")}" /></div>
        <div class="field"><label for="profile-college">College</label><input id="profile-college" maxlength="200" value="${esc(me.collegeName || "")}" /></div>
      </div>
      <div class="field"><label for="profile-bio">About you</label><textarea id="profile-bio" rows="4" maxlength="500" placeholder="Tell students a little about yourself">${esc(me.bio || "")}</textarea></div>
      <button class="btn btn-primary" type="submit">Save profile changes</button>
    </form>
    <div class="grid g2" style="margin-top:1.25rem">
      <div class="card"><h3 style="font-size:1.05rem">Teaches</h3><div class="chip-list" style="margin-top:.6rem">
        ${(me.skillsTeach || []).map(s => `<span class="badge">${esc(s.name)}</span>`).join("")}
      </div></div>
      <div class="card"><h3 style="font-size:1.05rem">Learning</h3><div class="chip-list" style="margin-top:.6rem">
        ${(me.skillsLearn || []).map(s => `<span class="badge badge-soft">${esc(s.name)}</span>`).join("")}
      </div></div>
    </div>`);
  },

  "/community": () => `
  <div class="container" style="padding:2.5rem 0 4rem">
    <h1 style="font-size:2rem">Community</h1>
    <p class="muted">Stories, questions and swap shout-outs from students.</p>
    <div class="card" style="margin:1.5rem 0">
      <form data-post><label for="post">Share something</label>
        <textarea id="post" rows="3" placeholder="What did you learn this week?"></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:.75rem" type="submit">Post to community</button>
      </form>
    </div>
    <div class="grid g2">
      ${[...getCommunityPosts(), ...POSTS].map((p, i) => `<div class="card card-hover">
        <div class="row"><img class="avatar avatar-sm" src="${p.avatar || STUDENTS[i % STUDENTS.length].avatar}" alt="" loading="lazy" />
        <div><strong style="font-size:.9rem">${esc(p.name)}</strong><p class="muted" style="font-size:.78rem">${p.time}</p></div></div>
        <p style="font-size:.92rem;margin-top:.75rem">${esc(p.text)}</p>
        <div class="row" style="margin-top:.9rem"><button class="btn btn-ghost btn-sm" data-toast="Liked!">❤️ ${p.likes}</button>
        <button class="btn btn-ghost btn-sm" data-toast="Comments coming soon">💬 ${p.comments}</button></div>
      </div>`).join("")}
    </div>
  </div>`,

  "/how-it-works": () => `
  <div class="container" style="padding:2.5rem 0 4rem">
    <div class="section-head"><h1 style="font-size:2.2rem">How SkillSwap Campus works</h1><p>No money, no subscriptions — just students trading knowledge.</p></div>
    <div class="grid g2">
      ${[["Create your profile", "Add your college, year and a short bio so peers know who they're swapping with."],
         ["List teach + learn skills", "Tag each skill with a level so matches are realistic."],
         ["Review your matches", "A match score ranks peers by two-way fit — you teach theirs, they teach yours."],
         ["Send a swap request", "Propose what you'll teach and what you want in return."],
         ["Schedule a session", "Pick online or on-campus, then meet and teach."],
         ["Rate and grow", "Leave a rating, track progress and unlock badges."]]
        .map(([t, d], i) => `<div class="card step"><span class="step-num">${i + 1}</span><h3 style="font-size:1.05rem">${t}</h3><p class="muted" style="font-size:.9rem;margin-top:.35rem">${d}</p></div>`).join("")}
    </div>
    <div class="card" style="margin-top:2rem;text-align:center;background:var(--grad-hero);color:#fff;border:none">
      <h2 style="font-size:1.6rem">Ready to make your first swap?</h2>
      <p style="opacity:.92;margin:.5rem 0 1.25rem">Join 12,000+ students learning from each other.</p>
      <a class="btn btn-outline" href="#/signup" style="background:#fff;color:#6d28d9;border:none">Create free account</a>
    </div>
  </div>`,

  "/login": () => `
  <div class="container auth-wrap"><div class="auth-card">
    <h1>Welcome back</h1><p class="muted" style="font-size:.9rem">Log in to continue swapping skills.</p>
    <form data-auth="login" style="margin-top:1.5rem">
      <div class="field"><label for="e">College email</label><input id="e" type="email" required placeholder="you@college.edu" /></div>
      <div class="field"><label for="p">Password</label><input id="p" type="password" required placeholder="••••••••" /></div>
      <button class="btn btn-primary btn-block" type="submit">Log in</button>
    </form>
    <p class="muted" style="font-size:.85rem;margin-top:1rem;text-align:center">
      <a href="#/forgot">Forgot password?</a> • New here? <a href="#/signup" style="color:var(--primary)">Create account</a></p>
  </div></div>`,

  "/signup": () => `
  <div class="container auth-wrap"><div class="auth-card">
    <h1>Create your account</h1><p class="muted" style="font-size:.9rem">Free forever. Swap skills, not money.</p>
    <form data-auth="signup" style="margin-top:1.5rem">
      <div class="field"><label for="n">Full name</label><input id="n" required placeholder="Riya Sharma" /></div>
      <div class="field"><label for="c">College</label><input id="c" required placeholder="SRM University" /></div>
      <div class="field"><label for="e2">College email</label><input id="e2" type="email" required placeholder="you@college.edu" /></div>
      <div class="field"><label for="p2">Password</label><input id="p2" type="password" required placeholder="••••••••" /></div>
      <button class="btn btn-primary btn-block" type="submit">Create account</button>
    </form>
    <p class="muted" style="font-size:.85rem;margin-top:1rem;text-align:center">Already a member? <a href="#/login" style="color:var(--primary)">Log in</a></p>
  </div></div>`,

  "/forgot": () => `
  <div class="container auth-wrap"><div class="auth-card">
    <h1>Reset password</h1><p class="muted" style="font-size:.9rem">We'll email you a reset link.</p>
    <form data-auth="forgot" style="margin-top:1.5rem">
      <div class="field"><label for="e3">College email</label><input id="e3" type="email" required placeholder="you@college.edu" /></div>
      <button class="btn btn-primary btn-block" type="submit">Send reset link</button>
    </form>
    <p class="muted" style="font-size:.85rem;margin-top:1rem;text-align:center"><a href="#/login" style="color:var(--primary)">Back to login</a></p>
  </div></div>`,

  "/verify-email": () => `
  <div class="container auth-wrap"><div class="auth-card" id="verification-status">
    <h1>Verifying your email</h1><p class="muted">Please wait while we activate your account.</p>
  </div></div>`,
};

function studentPage(id) {
  const s = STUDENTS.find((x) => x.id === id);
  if (!s) return `<div class="container" style="padding:4rem 0;text-align:center"><h1>Student not found</h1><a class="btn btn-primary" href="#/explore" style="margin-top:1rem">Back to explore</a></div>`;
  return `<div class="container" style="padding:2.5rem 0 4rem">
    <a class="btn btn-ghost btn-sm" href="#/explore">← Back to explore</a>
    <div class="card" style="margin-top:1rem">
      <div class="row">
        <img class="avatar" style="width:80px;height:80px" src="${s.avatar}" alt="${esc(s.name)}" />
        <div><h1 style="font-size:1.6rem">${esc(s.name)}</h1>
          <p class="muted" style="font-size:.9rem">${esc(s.college)} • ${esc(s.branch)} • ${esc(s.year)}</p>
          <div class="chip-list"><span class="badge">⭐ ${s.rating}</span><span class="badge badge-soft">${s.swaps} swaps</span><span class="badge badge-soft">${esc(s.mode)}</span></div>
        </div>
        <button class="btn btn-primary" style="margin-left:auto" data-demo-swap>Request swap</button>
      </div>
      <div class="divider"></div>
      <p class="muted" style="font-size:.92rem">${esc(s.bio)}</p>
      <p class="muted" style="font-size:.85rem;margin-top:.5rem">🕒 Available: ${esc(s.availability)}</p>
    </div>
    <div class="grid g2" style="margin-top:1.25rem">
      <div class="card"><h3 style="font-size:1.05rem">Teaches</h3>
        ${s.teaches.map((t) => `<div class="list-item"><div style="flex:1"><strong style="font-size:.9rem">${esc(t.name)}</strong><p class="muted" style="font-size:.8rem">${esc(t.category)}</p></div><span class="badge">${esc(t.level)}</span></div>`).join("")}</div>
      <div class="card"><h3 style="font-size:1.05rem">Wants to learn</h3>
        ${s.learns.map((t) => `<div class="list-item"><div style="flex:1"><strong style="font-size:.9rem">${esc(t.name)}</strong><p class="muted" style="font-size:.8rem">${esc(t.category)}</p></div><span class="badge badge-soft">${esc(t.level)}</span></div>`).join("")}</div>
    </div>
    <div class="card" style="margin-top:1.25rem"><h3 style="font-size:1.05rem">Achievements</h3>
      <div class="chip-list" style="margin-top:.6rem">${s.achievements.map((a) => `<span class="badge badge-success">🏅 ${esc(a)}</span>`).join("")}</div></div>
  </div>`;
}

/* ---------- swap modal ---------- */
function openSwapModal(student) {
  const name = student.name;
  $("#modal-root").innerHTML = `
  <div class="modal-backdrop" data-close>
    <div class="modal" role="dialog" aria-modal="true">
      <h2 style="font-size:1.25rem">Request a swap with ${esc(name)}</h2>
      <p class="muted" style="font-size:.88rem">Propose what you'll teach and what you'd like to learn.</p>
      <form data-swap-form data-recipient="${esc(student.id)}" style="margin-top:1.25rem">
        <div class="field"><label for="teach">I can teach</label><input id="teach" required placeholder="Python" /></div>
        <div class="field"><label for="learn">I want to learn</label><input id="learn" required placeholder="UI/UX Design" /></div>
        <div class="field"><label for="note">Message</label><textarea id="note" rows="3" placeholder="Hi! Would you be up for a swap this weekend?"></textarea></div>
        <div class="row" style="flex-wrap:nowrap">
          <button class="btn btn-outline btn-block" type="button" data-close>Cancel</button>
          <button class="btn btn-primary btn-block" type="submit">Send request</button>
        </div>
      </form>
    </div>
  </div>`;
}
const closeModal = () => ($("#modal-root").innerHTML = "");

function toCardStudent(match) {
  return {
    id: match.userId || match.id,
    name: match.name,
    avatar: match.avatarUrl,
    college: match.collegeName,
    year: "Student",
    bio: match.bio,
    teaches: match.skillsTeach || (match.teachSkills || []).map((name) => ({ name })),
    learns: match.skillsLearn || (match.learnSkills || []).map((name) => ({ name })),
    rating: match.avgRating || 0,
    swaps: match.totalSwaps || 0,
    mode: "Online",
    match: match.score || 0,
    isLive: true,
  };
}

/* ---------- explore filtering ---------- */
function wireExplore(students = STUDENTS) {
  const q = $("#q"), cat = $("#cat"), mode = $("#mode"), out = $("#results"), count = $("#count");
  if (!out) return;
  const render = () => {
    const term = (q.value || "").toLowerCase();
    const list = students.filter((s) => {
      const hay = [s.name, s.college, s.branch, ...s.teaches.map((t) => t.name), ...s.learns.map((t) => t.name)].join(" ").toLowerCase();
      const okTerm = !term || hay.includes(term);
      const okCat = cat.value === "All categories" || [...s.teaches, ...s.learns].some((t) => t.category === cat.value);
      const okMode = mode.value === "All modes" || s.mode === mode.value;
      return okTerm && okCat && okMode;
    });
    count.textContent = `${list.length} student${list.length === 1 ? "" : "s"} found`;
    out.innerHTML = list.length ? list.map((s) => skillCard(s, true)).join("")
      : `<div class="card" style="grid-column:1/-1;text-align:center"><h3>No matches</h3><p class="muted">Try a different skill or clear the filters.</p></div>`;
  };
  [q, cat, mode].forEach((el) => el.addEventListener("input", render));
  render();
}

/* ---------- router ---------- */
async function router() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const [path] = hash.split("?");
  const protectedPaths = new Set(["/dashboard", "/matches", "/my-skills", "/requests", "/sessions", "/messages", "/profile"]);
  if (protectedPaths.has(path) && !localStorage.getItem("ssc-access-token")) {
    location.hash = "#/login";
    return;
  }
  const page = pages[path] || pages["/"];
  let view;
  try {
    view = hash.startsWith("/student/") ? studentPage(path.split("/")[2]) : await page();
  } catch (err) {
    console.error('Page load failed:', err);
    view = `<div class="container" style="padding:4rem 0;text-align:center"><h1>Could not load this page</h1><p class="muted">Please check your connection and try again.</p><button class="btn btn-primary" style="margin-top:1rem" data-retry-page>Try again</button></div>`;
  }
  $("#app").innerHTML = view;
  updateAuthActions();
  document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + hash));
  $("#nav").classList.remove("open");
  window.scrollTo({ top: 0 });
  if (path === "/explore") {
    wireExplore(exploreStudents);
  }
  if (path === "/verify-email") {
    const token = new URLSearchParams(hash.split("?")[1] || "").get("token");
    const status = $("#verification-status");
    if (!token) {
      status.innerHTML = '<h1>Invalid verification link</h1><p class="muted">Please request a new verification email.</p>';
      return;
    }
    try {
      await api.verifyEmail(token);
      status.innerHTML = '<h1>Email verified!</h1><p class="muted">Your account is ready. Taking you to your dashboard…</p>';
      setTimeout(() => { location.hash = "#/dashboard"; }, 900);
    } catch (err) {
      status.innerHTML = `<h1>Verification failed</h1><p class="muted">${esc(err.message)}</p><a class="btn btn-primary" href="#/login" style="margin-top:1rem">Back to login</a>`;
    }
  }
}
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);

/* ---------- global interactions ---------- */
/* ---------- global interactions ---------- */
document.addEventListener("click", (e) => {
  if (e.target.closest('[data-logout]')) {
    api.logout();
    return;
  }
  if (e.target.closest('[data-retry-page]')) {
    router();
    return;
  }
  const editProfile = e.target.closest("[data-focus-profile]");
  if (editProfile) {
    $("#profile-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#profile-name")?.focus();
    return;
  }
  if (e.target.closest('[data-demo-swap]')) {
    if (localStorage.getItem('ssc-access-token')) {
      toast('This is a sample profile. Live swap requests appear for registered members in Explore.');
    } else {
      toast('Log in to view and request swaps with registered members.');
      location.hash = '#/login';
    }
    return;
  }
  const swapAction = e.target.closest("[data-swap-status]");
  if (swapAction) {
    api.updateSwapStatus(swapAction.dataset.swapId, swapAction.dataset.swapStatus)
      .then(() => { toast(`Swap ${swapAction.dataset.swapStatus}.`); router(); })
      .catch((err) => toast(err.message));
    return;
  }
  const completeSession = e.target.closest("[data-session-complete]");
  if (completeSession) {
    api.updateSessionStatus(completeSession.dataset.sessionComplete, 'completed')
      .then(() => { toast('Session marked complete. Credits were added.'); router(); })
      .catch((err) => toast(err.message));
    return;
  }
  const swap = e.target.closest("[data-swap-id]");
  if (swap) {
    const student = { id: swap.dataset.swapId, name: swap.dataset.swapName };
    openSwapModal(student);
    return;
  }
  if (e.target.closest("[data-close]")) return closeModal();
  const t = e.target.closest("[data-toast]");
  if (t) toast(t.dataset.toast);
});

document.addEventListener("submit", async (e) => {
  const f = e.target;
  e.preventDefault();

  if (f.matches("[data-swap-form]")) {
    const data = {
      recipientId: f.dataset.recipient,
      skillId: f.dataset.skill,
      message: $("#note").value,
    };
    try {
      await api.createSwap(data);
      closeModal();
      toast("Swap request sent! 🎉");
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  if (f.matches("[data-auth]")) {
    const mode = f.dataset.auth;
    try {
      if (mode === "login") {
        const credentials = {
          email: $("#e").value,
          password: $("#p").value,
        };
        await api.login(credentials);
        toast("Logged in — welcome back!");
        location.hash = "#/dashboard";
      } else if (mode === "signup") {
        const userData = {
          name: $("#n").value,
          collegeName: $("#c").value,
          email: $("#e2").value,
          password: $("#p2").value,
        };
        await api.register(userData);
        toast("Account created! You can now log in.");
        location.hash = "#/login";
      } else {
        toast("Password reset is not available yet. Please contact campus support.");
      }
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  if (f.matches("[data-profile-update]")) {
    try {
      const data = {
        bio: $("#profile-bio").value,
        name: $("#profile-name").value,
        collegeName: $("#profile-college").value,
      };
      await api.updateProfile(data);
      toast("Profile updated successfully!");
      location.hash = "#/profile";
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  if (f.matches("[data-skill-add]")) {
    try {
      const data = {
        skillName: f.querySelector("#skill-select").value,
        proficiency: f.querySelector("#prof-level").value,
      };
      const isTeaching = f.dataset.type === 'teach';
      if (isTeaching) {
        await api.request('/users/me/skills-teach', { method: 'POST', body: JSON.stringify(data) });
      } else {
        await api.request('/users/me/skills-learn', { method: 'POST', body: JSON.stringify(data) });
      }
      toast("Skill added to your profile!");
      location.hash = "#/my-skills";
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  if (f.matches("[data-message-form]")) {
    try {
      await api.sendMessage(f.dataset.swapId, $("#message-content").value);
      toast("Message sent");
      router();
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  if (f.matches('[data-course-search]')) {
    const query = $('#course-query').value.trim();
    if (query) location.hash = `#/courses?q=${encodeURIComponent(query)}`;
    return;
  }

  if (f.matches("[data-post]")) {
    const text = $("#post").value.trim();
    if (!text) return;
    const user = JSON.parse(localStorage.getItem('ssc-user') || '{}');
    const posts = getCommunityPosts();
    posts.unshift({
      name: user.name || 'Campus student',
      text,
      time: 'Just now',
      likes: 0,
      comments: 0,
      avatar: user.avatarUrl || '',
    });
    localStorage.setItem('ssc-community-posts', JSON.stringify(posts.slice(0, 30)));
    toast("Posted to the community feed");
    router();
    return;
  }
});

function updateAuthActions() {
  const actions = $('#auth-actions');
  if (!actions) return;
  const signedIn = Boolean(localStorage.getItem('ssc-access-token'));
  actions.innerHTML = `
    <button class="btn btn-ghost btn-sm" id="theme-toggle" aria-label="Toggle theme">${document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'}</button>
    ${signedIn
      ? '<a class="btn btn-ghost btn-sm desktop-only" href="#/profile">Profile</a><button class="btn btn-primary btn-sm desktop-only" type="button" data-logout>Log out</button>'
      : '<a class="btn btn-ghost btn-sm desktop-only" href="#/login">Login</a><a class="btn btn-primary btn-sm desktop-only" href="#/signup">Get Started</a>'}
    <button class="menu-btn" id="menu-btn" aria-label="Menu">☰</button>`;
  $('#theme-toggle').addEventListener('click', toggleTheme);
  $('#menu-btn').addEventListener('click', () => $('#nav').classList.toggle('open'));
}
