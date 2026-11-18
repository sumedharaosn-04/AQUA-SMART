
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const tips = [
  "Turn off taps while soaping your hands.",
  "Repair dripping taps as soon as possible.",
  "Use a bucket instead of a continuously running hose.",
  "Check visible pipes and fittings regularly for leaks.",
  "Run washing machines with suitable full loads."
];

const initialState = {
  user: "Sumedha",
  theme: "system",
  target: 60,
  mode: "auto",
  emergency: false,
  points: 280,
  streak: 4,
  challenge: 65,
  tipIndex: 0,
  taps: [
    {id:1,name:"Kitchen tap",location:"Kitchen",status:false,litres:12.4},
    {id:2,name:"Bathroom tap",location:"Bathroom",status:false,litres:8.6},
    {id:3,name:"Garden tap",location:"Garden",status:false,litres:21}
  ],
  alerts: [
    {id:1,type:"warn",title:"Usage approaching daily target",desc:"Demo consumption has reached 70% of your daily goal.",time:"Today · 10:42 AM",read:false},
    {id:2,type:"red",title:"Unusually long tap activity",desc:"A simulated tap session exceeded the recommended duration.",time:"Today · 9:18 AM",read:false},
    {id:3,type:"warn",title:"Device check completed",desc:"All demo sensors are responding normally.",time:"Yesterday",read:true}
  ],
  history: []
};

let state;
try {
  state = {
    ...initialState,
    ...JSON.parse(localStorage.getItem("aquasmart-state") || "{}")
  };
} catch {
  state = structuredClone(initialState);
}

let activePage = "dashboard";
let chart = null;

function save() {
  localStorage.setItem("aquasmart-state", JSON.stringify(state));
}

function totalUsage() {
  return state.taps.reduce((sum,t) => sum + t.litres, 0);
}

function fmt(n) {
  return Number(n).toFixed(1);
}

function notify(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  $("#toastRegion").appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function log(title, desc) {
  state.history.unshift({
    title,
    desc,
    time: new Date().toLocaleString()
  });

  state.history = state.history.slice(0,100);
  save();
}

function heading(title, description, actions = "") {
  return `
    <div class="page-heading">
      <div>
        <div class="eyebrow">AQUASMART / WATER INTELLIGENCE</div>
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
      <div class="heading-actions">${actions}</div>
    </div>
  `;
}

function metric(label,value,foot,emoji) {
  return `
    <div class="metric">
      <div class="metric-top">
        <span>${label}</span>
        <span class="metric-icon">${emoji}</span>
      </div>
      <div class="metric-value">${value}</div>
      <div class="metric-foot">${foot}</div>
    </div>
  `;
}

function panel(title,subtitle,body) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">${title}</div>
          <div class="panel-sub">${subtitle}</div>
        </div>
      </div>
      ${body}
    </section>
  `;
}

function tapTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Device</th>
            <th>Location</th>
            <th>Water used</th>
            <th>Status</th>
            <th>Control</th>
          </tr>
        </thead>
        <tbody>
          ${state.taps.map(t => `
            <tr>
              <td><b>${t.name}</b></td>
              <td>${t.location}</td>
              <td>${fmt(t.litres)} L</td>
              <td>
                <span class="badge ${t.status ? "warn" : ""}">
                  ${t.status ? "Flowing" : "Standby"}
                </span>
              </td>
              <td>
                <button class="button" data-toggle-tap="${t.id}">
                  ${t.status ? "Turn OFF" : "Turn ON"}
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function activityList() {
  if (!state.history.length) {
    return `<p class="panel-sub">No recent activity yet.</p>`;
  }

  return state.history.map(item => `
    <div class="activity-item">
      <div class="alert-icon">●</div>
      <div class="alert-copy">
        <b>${item.title}</b>
        <p>${item.desc}</p>
        <small>${item.time}</small>
      </div>
    </div>
  `).join("");
}

// DASHBOARD

function dashboard() {
  const usage = totalUsage();
  const saved = Math.round(usage * .28 + 18);

  return heading(
    `Good afternoon, ${state.user} 👋`,
    "Here is your water conservation overview.",
    `<button class="button button-primary" data-page="control">Manage taps →</button>`
  ) + `
    <div class="grid metrics">
      ${metric("Water used today",fmt(usage)+" L","Across all registered taps","💧")}
      ${metric("Estimated water saved",saved+" L","Compared with baseline","🌱")}
      ${metric("Tap activations","18","Illustrative activity count","🚰")}
      ${metric("Daily target",Math.round(usage/state.target*100)+"%","Of "+state.target+" L goal","🎯")}
    </div>

    <div class="grid dashboard-grid">
      <div>
        ${panel("Water consumption","Weekly usage in litres",`
          <div class="chart-wrap">
            <canvas id="usageChart"></canvas>
          </div>
        `)}

        ${panel("Tap overview","Your registered smart taps",tapTable())}

        ${panel("Recent activity","Latest system events",activityList())}
      </div>

      <div>
        ${panel("Live tap status","Simulated device connection",
          state.taps.map(t => `
            <div class="tap-status">
              <div class="tap-symbol">🚰</div>
              <div>
                <b>${t.name}</b>
                <small>${t.status ? "Water flowing" : "No water flowing"}</small>
              </div>
              <span class="status-pill ${t.status ? "" : "offline"}">
                ${t.status ? "ON" : "OFF"}
              </span>
            </div>
          `).join("")
        )}

        ${panel("Daily water goal","Your target progress",`
          <div class="goal-row">
            <b>${fmt(usage)} L used</b>
            <span>${state.target} L</span>
          </div>
          <div class="progress">
            <span style="width:${Math.min(100,usage/state.target*100)}%"></span>
          </div>
          <p class="panel-sub">
            ${Math.max(0,state.target-usage).toFixed(1)} L remaining.
          </p>
        `)}

        <div class="tip-card">
          <b>💡 Today's conservation tip</b>
          <p>${tips[state.tipIndex % tips.length]}</p>
        </div>
      </div>
    </div>
  `;
}

// TAP CONTROL

function controlPage() {
  return heading(
    "Smart Tap Control",
    "Manage your taps and simulate automatic sensor operation.",
    `<button class="button button-danger" id="emergency">Emergency shutoff</button>
     <button class="button button-primary" id="addTap">+ Add tap</button>`
  ) + `
    <div class="grid control-layout">
      <div>
        ${panel("Tap operation","Choose your registered tap",`
          <div class="field">
            <label>Select tap</label>
            <select id="selectedTap">
              ${state.taps.map(t => `
                <option value="${t.id}">${t.name}</option>
              `).join("")}
            </select>
          </div>

          <div class="control-hero">
            <div class="faucet-large">🚰</div>
            <h2 id="tapStateTitle">Tap on standby</h2>
            <p id="tapStateDesc">Use the controls to simulate tap activity.</p>

            <div class="control-buttons">
              <button class="button button-primary" id="simulateHands">
                Simulate hands detected
              </button>
              <button class="button" id="removeHands">
                Remove hands
              </button>
            </div>
          </div>

          <div class="switch-row">
            <div>
              <b>Automatic mode</b>
              <small>Sensor-based operation</small>
            </div>
            <button class="switch ${state.mode==="auto"?"on":""}" id="modeSwitch"></button>
          </div>

          <div class="switch-row">
            <div>
              <b>Manual mode</b>
              <small>Manual tap operation</small>
            </div>
            <button class="switch ${state.mode==="manual"?"on":""}" id="manualSwitch"></button>
          </div>

          <div class="switch-row">
            <div>
              <b>IR sensor</b>
              <small id="sensorText">Ready</small>
            </div>
            <span class="badge">Online</span>
          </div>

          <div class="switch-row">
            <div>
              <b>Solenoid valve</b>
              <small id="valveText">Closed</small>
            </div>
            <span class="badge" id="valveBadge">CLOSED</span>
          </div>

          <div class="control-buttons" style="margin-top:15px">
            <button class="button" id="manualOn">Turn ON</button>
            <button class="button" id="manualOff">Turn OFF</button>
          </div>
        `)}
      </div>

      <div>
        ${panel("Registered taps","All your devices",tapTable())}

        ${panel("System architecture","How AquaSmart works",`
          <div class="usage-row"><span>IR Sensor</span><b>Detects hands</b></div>
          <div class="usage-row"><span>ESP32</span><b>Processes signal</b></div>
          <div class="usage-row"><span>Solenoid valve</span><b>Controls flow</b></div>
          <div class="usage-row"><span>Flow sensor</span><b>Measures water</b></div>
          <p class="panel-sub">
            Hardware connections are simulated in this prototype.
          </p>
        `)}
      </div>
    </div>
  `;
}

// WATER MONITORING

function monitoring() {
  return heading(
    "Water Monitoring",
    "Track water consumption across your registered taps.",
    `<button class="button" id="exportCsv">Export CSV ↓</button>`
  ) + `
    <div class="grid metrics">
      ${metric("Today's usage",fmt(totalUsage())+" L","All taps","💧")}
      ${metric("Weekly average","46.2 L","Sample average","📊")}
      ${metric("Peak usage","68.4 L","Sample daily peak","📈")}
      ${metric("Registered taps",state.taps.length,"Connected demo devices","🚰")}
    </div>

    <div class="grid section-grid">
      ${panel("Consumption trend","Weekly water usage",`
        <div class="chart-wrap"><canvas id="usageChart"></canvas></div>
      `)}
      ${panel("Usage by location","Tap consumption distribution",`
        <div class="chart-wrap"><canvas id="locationChart"></canvas></div>
      `)}
    </div>

    ${panel("Consumption records","Current demo readings",tapTable())}
  `;
}

// WATER SAVINGS

function savings() {
  return heading(
    "Water Savings",
    "Calculate and understand your estimated conservation impact."
  ) + `
    <div class="grid metrics">
      ${metric("Estimated saved","${Math.round(totalUsage()*.28+18)} L","Illustrative estimate","🌱")}
      ${metric("Monthly projection",fmt(totalUsage()*30)+" L","Usage projection","📅")}
      ${metric("Yearly projection",fmt(totalUsage()*365)+" L","Usage projection","🌍")}
      ${metric("Water target",state.target+" L","Daily target","🎯")}
    </div>

    <div class="grid section-grid">
      ${panel("Savings calculator","Compare conventional and smart tap usage",`
        <div class="field">
          <label>Conventional tap usage (L/day)</label>
          <input type="number" id="baselineInput" value="80" min="0">
        </div>
        <div class="field">
          <label>Smart tap usage (L/day)</label>
          <input type="number" id="smartInput" value="${fmt(totalUsage())}" min="0">
        </div>
        <button class="button button-primary" id="calculateSavings">Calculate savings</button>
        <div id="calcResult" class="insight-box">
          Enter your values to calculate possible savings.
        </div>
      `)}

      ${panel("Benefits of smart taps","How automation helps",`
        <div class="usage-row"><span>Automatic shutoff</span><b>Less unattended flow</b></div>
        <div class="usage-row"><span>Sensor operation</span><b>Touch-free usage</b></div>
        <div class="usage-row"><span>Water monitoring</span><b>Better awareness</b></div>
        <div class="usage-row"><span>Alerts</span><b>Unusual activity</b></div>
      `)}
    </div>
  `;
}

// ALERTS

function alertsPage() {
  return heading(
    "Alerts & Notifications",
    "Review events from your water monitoring system.",
    `<button class="button" id="markAllRead">Mark all as read</button>`
  ) + panel("Notification centre","System notifications",
    state.alerts.map(a => `
      <div class="alert-item">
        <div class="alert-icon ${a.type==="red"?"red":""}">!</div>
        <div class="alert-copy">
          <b>${a.title}</b>
          <p>${a.desc}</p>
          <small>${a.time}</small>
        </div>
        <button class="button" data-read-alert="${a.id}">
          ${a.read?"Read":"Mark read"}
        </button>
      </div>
    `).join("")
  );
}

// REWARDS

function rewards() {
  return heading(
    "Rewards & Achievements",
    "Track your progress and earn conservation points."
  ) + `
    <div class="grid metrics">
      ${metric("Points",state.points,"Conservation score","⭐")}
      ${metric("Current streak",state.streak+" days","Demo streak","🔥")}
      ${metric("Challenges completed","3","This month","🏆")}
      ${metric("Level","Level 2","Eco explorer","🌿")}
    </div>

    ${panel("Your progress","Next level: 400 points",`
      <div class="score">${state.points} points</div>
      <div class="progress">
        <span style="width:${Math.min(100,state.points/4)}%"></span>
      </div>
    `)}

    <div class="grid reward-grid">
      ${[
        ["🌱","Water Saver Beginner","Start tracking water usage.",true],
        ["🏆","Eco Champion","Work towards conservation goals.",true],
        ["💧","Weekly Hero","Complete a weekly challenge.",false],
        ["🛡️","Water Guardian","Maintain healthy devices.",false],
        ["🔥","Streak Keeper","Build a seven-day streak.",false],
        ["⭐","Goal Getter","Meet your daily target.",false]
      ].map(r=>`
        <div class="panel reward-card">
          <div class="reward-medal">${r[0]}</div>
          <h3>${r[1]}</h3>
          <p>${r[2]}</p>
          <span class="badge ${r[3]?"":"neutral"}">
            ${r[3]?"Unlocked":"Locked"}
          </span>
        </div>
      `).join("")}
    </div>

    ${panel("Weekly challenge","Reduce your water usage",`
      <div class="goal-row">
        <b>Challenge progress</b>
        <span>${state.challenge}%</span>
      </div>
      <div class="progress">
        <span style="width:${state.challenge}%"></span>
      </div>
      <button class="button button-primary" id="claimChallenge">
        Claim challenge progress
      </button>
    `)}
  `;
}

// DEVICE MANAGEMENT

function devices() {
  return heading(
    "Device Management",
    "Monitor connected sensors and smart tap devices.",
    `<button class="button button-primary" id="addTap">+ Add device</button>`
  ) + `
    ${panel("Connected hardware","Simulated device status",`
      <div class="usage-row"><span>ESP32 Controller</span><b class="positive">● Online</b></div>
      <div class="usage-row"><span>IR Sensor Array</span><b class="positive">● Online</b></div>
      <div class="usage-row"><span>Flow Sensor</span><b class="positive">● Online</b></div>
      <div class="usage-row"><span>Solenoid Valve</span><b>Standby</b></div>
    `)}

    ${panel("Registered taps","Manage your devices",tapTable())}
  `;
}

// AI INSIGHTS

function insights() {
  const highest = [...state.taps].sort((a,b)=>b.litres-a.litres)[0];

  return heading(
    "AI Water Insights",
    "Smart recommendations based on your water usage data."
  ) + `
    <div class="grid section-grid">
      ${panel("Usage analysis","Automated observations",`
        <div class="insight-box">
          <h3>Daily target analysis</h3>
          <p>Your current water consumption is ${fmt(totalUsage())} L against a target of ${state.target} L.</p>
        </div>
        <div class="insight-box">
          <h3>Highest usage location</h3>
          <p>${highest ? highest.name : "No tap registered"} has the highest recorded demo usage.</p>
        </div>
        <div class="insight-box">
          <h3>Monthly projection</h3>
          <p>Your projected monthly usage is ${fmt(totalUsage()*30)} L if today's usage continues.</p>
        </div>
      `)}

      ${panel("Recommendations","Conservation suggestions",`
        <div class="insight-box">
          <h3>Review high-use taps</h3>
          <p>Check taps with higher recorded consumption.</p>
        </div>
        <div class="insight-box">
          <h3>Set a daily goal</h3>
          <p>Use your consumption history to set a realistic target.</p>
        </div>
        <div class="insight-box">
          <h3>Inspect plumbing</h3>
          <p>Regularly check visible pipes and fittings.</p>
        </div>
      `)}
    </div>

    <p class="panel-sub">
      Note: This prototype uses rule-based analysis, not a connected AI model.
    </p>
  `;
}

// CONSERVATION TIPS

function tipsPage() {
  return heading(
    "Water Conservation Tips",
    "Simple habits that can help reduce unnecessary water usage."
  ) + `
    <div class="grid tip-list">
      ${tips.concat([
        "Use efficient tap aerators where suitable.",
        "Collect rainwater where local conditions allow.",
        "Monitor your household water meter regularly."
      ]).map((tip,i)=>`
        <div class="tip-item">
          <div class="eyebrow">TIP 0${i+1}</div>
          <h3>${[
            "Make every second count",
            "Fix dripping taps",
            "Clean efficiently",
            "Inspect your fittings",
            "Use appliances wisely",
            "Choose efficient fixtures",
            "Harvest rainwater",
            "Monitor your usage"
          ][i]}</h3>
          <p>${tip}</p>
        </div>
      `).join("")}
    </div>
  `;
}

// REPORTS

function reports() {
  return heading(
    "Sustainability Reports",
    "Review and export your water usage records.",
    `<button class="button button-primary" id="exportCsv">Download CSV</button>`
  ) + `
    <div class="grid metrics">
      ${metric("Total usage",fmt(totalUsage())+" L","Demo records","💧")}
      ${metric("Estimated saved",Math.round(totalUsage()*.28+18)+" L","Illustrative","🌱")}
      ${metric("Active devices",state.taps.length,"Registered taps","🚰")}
      ${metric("Points earned",state.points,"Conservation score","⭐")}
    </div>

    ${panel("Monthly sustainability summary","Current demonstration data",`
      <div class="insight-box">
        <h3>Water usage overview</h3>
        <p>Your registered taps have recorded ${fmt(totalUsage())} litres. Savings figures are estimates and are not verified meter readings.</p>
      </div>
      <button class="button button-primary" id="exportCsv">Export consumption records</button>
    `)}
  `;
}

// LEADERBOARD

function leaderboard() {
  return heading(
    "Community Leaderboard",
    "Compare example conservation scores."
  ) + panel("Water saver rankings","Illustrative sample data",`
    <table>
      <thead>
        <tr><th>Rank</th><th>Workspace</th><th>Points</th></tr>
      </thead>
      <tbody>
        <tr><td>01</td><td>Green Campus</td><td>940</td></tr>
        <tr><td>02</td><td>AquaSmart Demo</td><td>${state.points}</td></tr>
        <tr><td>03</td><td>City Care Clinic</td><td>710</td></tr>
        <tr><td>04</td><td>North Office</td><td>590</td></tr>
      </tbody>
    </table>
    <p class="panel-sub">These are sample entries, not real users.</p>
  `);
}

// ACTIVITY HISTORY

function activity() {
  return heading(
    "Activity History",
    "View recent actions performed in your workspace.",
    `<button class="button" id="clearHistory">Clear history</button>`
  ) + panel("Recent events","Newest events appear first",activityList());
}

// SETTINGS

function settings() {
  return heading(
    "Profile & Settings",
    "Personalise your AquaSmart experience."
  ) + `
    <div class="grid section-grid">
      ${panel("Profile","Your account preferences",`
        <div class="field">
          <label>Display name</label>
          <input id="userName" value="${state.user}">
        </div>
        <div class="field">
          <label>Daily water target (litres)</label>
          <input id="dailyTarget" type="number" min="1" value="${state.target}">
        </div>
        <button class="button button-primary" id="saveProfile">Save preferences</button>
      `)}

      ${panel("Appearance","Customise the application theme",`
        <div class="settings-row">
          <div>
            <b>Application theme</b>
            <small>Choose light, dark or system default.</small>
          </div>
          <select class="field" id="themeSelect">
            <option value="light" ${state.theme==="light"?"selected":""}>Light</option>
            <option value="dark" ${state.theme==="dark"?"selected":""}>Dark</option>
            <option value="system" ${state.theme==="system"?"selected":""}>Default</option>
          </select>
        </div>
      `)}

      ${panel("Demo data","Manage local application data",`
        <p class="panel-sub">Reset the application to its original demonstration values.</p>
        <button class="button button-danger" id="resetData">Reset demo data</button>
      `)}
    </div>
  `;
}

// HELP

function help() {
  return heading(
    "Help & About",
    "Learn about the AquaSmart project."
  ) + `
    <div class="grid section-grid">
      ${panel("About AquaSmart","Water conservation concept",`
        <p class="panel-sub">
          AquaSmart is a smart water conservation concept combining
          touchless tap operation with water usage monitoring.
          Its purpose is to reduce unnecessary water flow and
          improve awareness of water consumption.
        </p>
        <div class="usage-row"><span>Project focus</span><b>Water conservation</b></div>
        <div class="usage-row"><span>Related SDG</span><b>SDG 6</b></div>
        <div class="usage-row"><span>Prototype</span><b>Interactive demo</b></div>
      `)}

      ${panel("Proposed hardware","How the system can be built",`
        <div class="usage-row"><span>IR Sensor</span><b>Hand detection</b></div>
        <div class="usage-row"><span>ESP32</span><b>Controller</b></div>
        <div class="usage-row"><span>Solenoid valve</span><b>Flow control</b></div>
        <div class="usage-row"><span>Flow sensor</span><b>Water measurement</b></div>
        <p class="panel-sub">
          Physical hardware integration requires a separately built
          and safely tested circuit.
        </p>
      `)}
    </div>
  `;
}

// NAVIGATION

const pages = {
  dashboard,
  control: controlPage,
  monitoring,
  savings,
  alerts: alertsPage,
  rewards,
  devices,
  insights,
  tips: tipsPage,
  reports,
  leaderboard,
  activity,
  settings,
  help
};

const pageNames = {
  dashboard:"Dashboard",
  control:"Tap Control",
  monitoring:"Water Monitoring",
  savings:"Water Savings",
  alerts:"Alerts",
  rewards:"Rewards",
  devices:"Device Management",
  insights:"AI Insights",
  tips:"Conservation Tips",
  reports:"Reports",
  leaderboard:"Leaderboard",
  activity:"Activity History",
  settings:"Settings",
  help:"Help & About"
};

function render(page = activePage) {
  activePage = page;

  $("#pageContent").innerHTML = pages[page]();
  $("#pageCrumb").textContent = pageNames[page];
  $("#sideUser").textContent = state.user;

  $$(".nav-link").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  bindPage();
  drawCharts(page);
}

function drawCharts(page) {
  if (chart) {
    chart.destroy();
    chart = null;
  }

  const canvas = $("#usageChart");
  if (!canvas || typeof Chart === "undefined") return;

  const dark = document.documentElement.dataset.theme === "dark";

  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      datasets: [{
        label: "Water used (L)",
        data: [36,48,41,55,43,62,Math.round(totalUsage())],
        borderColor: dark ? "#6dd1c6" : "#087f80",
        backgroundColor: dark
          ? "rgba(109,209,198,.12)"
          : "rgba(8,127,128,.10)",
        fill: true,
        tension: .35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {display:false}
      },
      scales: {
        y: {beginAtZero:true}
      }
    }
  });

  const locationCanvas = $("#locationChart");

  if (locationCanvas) {
    new Chart(locationCanvas, {
      type: "doughnut",
      data: {
        labels: state.taps.map(t => t.location),
        datasets: [{
          data: state.taps.map(t => t.litres),
          backgroundColor: [
            "#087f80",
            "#69b6a7",
            "#b6d9cb",
            "#e2b66d",
            "#9aaeb1"
          ]
        }]
      },
      options: {
        responsive:true,
        maintainAspectRatio:false
      }
    });
  }
}

// TAP OPERATIONS

function selectedTap() {
  return state.taps.find(
    t => t.id === Number($("#selectedTap")?.value)
  ) || state.taps[0];
}

function setTap(on,source="Manual operation") {
  if (state.emergency && on) {
    notify("Emergency shutoff is active.");
    return;
  }

  const tap = selectedTap();
  if (!tap) return;

  tap.status = on;

  log(
    `${tap.name} turned ${on ? "ON" : "OFF"}`,
    source
  );

  save();
  render("control");

  notify(`${tap.name}: ${on ? "ON" : "OFF"} (demo)`);
}

// EVENT HANDLERS

function bindPage() {

  $$("[data-page]").forEach(button => {
    button.onclick = () => {
      render(button.dataset.page);
      $("#sidebar").classList.remove("open");
    };
  });

  $$("[data-toggle-tap]").forEach(button => {
    button.onclick = () => {
      const tap = state.taps.find(
        t => t.id === Number(button.dataset.toggleTap)
      );

      if (!tap) return;

      tap.status = !tap.status;

      log(
        `${tap.name} ${tap.status ? "turned ON" : "turned OFF"}`,
        "Tap control"
      );

      save();
      render(activePage);
    };
  });

  const add = $("#addTap");

  if (add) {
    add.onclick = () => {
      $("#modalBackdrop").classList.add("open");
    };
  }

  const select = $("#selectedTap");

  if (select) {
    select.onchange = () => render("control");
  }

  const simulate = $("#simulateHands");

  if (simulate) {
    simulate.onclick = () => {
      if (state.mode !== "auto") {
        notify("Enable automatic mode first.");
        return;
      }

      setTap(true,"IR sensor detected simulated hands");
    };
  }

  const remove = $("#removeHands");

  if (remove) {
    remove.onclick = () => {
      setTap(false,"IR sensor no longer detects hands");
    };
  }

  const manualOn = $("#manualOn");

  if (manualOn) {
    manualOn.onclick = () => {
      if (state.mode !== "manual") {
        notify("Enable manual mode first.");
        return;
      }

      setTap(true);
    };
  }

  const manualOff = $("#manualOff");

  if (manualOff) {
    manualOff.onclick = () => setTap(false);
  }

  const autoSwitch = $("#modeSwitch");

  if (autoSwitch) {
    autoSwitch.onclick = () => {
      state.mode = state.mode === "auto" ? "manual" : "auto";
      save();
      render("control");
    };
  }

  const manualSwitch = $("#manualSwitch");

  if (manualSwitch) {
    manualSwitch.onclick = () => {
      state.mode = state.mode === "manual" ? "auto" : "manual";
      save();
      render("control");
    };
  }

  const emergency = $("#emergency");

  if (emergency) {
    emergency.onclick = () => {
      state.emergency = !state.emergency;

      if (state.emergency) {
        state.taps.forEach(t => t.status = false);
      }

      log(
        "Emergency shutoff " +
        (state.emergency ? "activated" : "released"),
        "Demo operation"
      );

      save();
      render("control");

      notify(
        state.emergency
          ? "Emergency shutoff activated."
          : "Emergency shutoff released."
      );
    };
  }

  const mark = $("#markAllRead");

  if (mark) {
    mark.onclick = () => {
      state.alerts.forEach(a => a.read = true);
      save();
      render("alerts");
    };
  }

  $$("[data-read-alert]").forEach(button => {
    button.onclick = () => {
      const alert = state.alerts.find(
        a => a.id === Number(button.dataset.readAlert)
      );

      if (alert) alert.read = true;

      save();
      render("alerts");
    };
  });

  const calculate = $("#calculateSavings");

  if (calculate) {
    calculate.onclick = () => {
      const baseline = Number($("#baselineInput").value);
      const smart = Number($("#smartInput").value);

      if (baseline < 0 || smart < 0 || !Number.isFinite(baseline+smart)) {
        notify("Enter valid water usage values.");
        return;
      }

      const saved = Math.max(0,baseline-smart);
      const percentage = baseline
        ? Math.round(saved/baseline*100)
        : 0;

      $("#calcResult").innerHTML = `
        <h3>Estimated daily savings</h3>
        <div class="score">${fmt(saved)} L</div>
        <p>${percentage}% estimated reduction.</p>
        <p class="panel-sub">Based on your entered assumptions.</p>
      `;
    };
  }

  const claim = $("#claimChallenge");

  if (claim) {
    claim.onclick = () => {
      if (state.challenge >= 100) {
        notify("Challenge already completed!");
        return;
      }

      state.challenge = 100;
      state.points += 50;
      save();
      render("rewards");
      notify("50 demo points earned!");
    };
  }

  const saveProfile = $("#saveProfile");

  if (saveProfile) {
    saveProfile.onclick = () => {
      state.user = $("#userName").value.trim() || "AquaSmart User";
      state.target = Math.max(
        1,
        Number($("#dailyTarget").value) || 60
      );

      save();
      render("settings");
      notify("Preferences saved.");
    };
  }

  const themeSelect = $("#themeSelect");

  if (themeSelect) {
    themeSelect.onchange = () => {
      state.theme = themeSelect.value;
      applyTheme();
      save();
      render("settings");
    };
  }

  const reset = $("#resetData");

  if (reset) {
    reset.onclick = () => {
      if (!confirm("Reset all demonstration data?")) return;

      localStorage.removeItem("aquasmart-state");

      state = structuredClone(initialState);

      applyTheme();
      render("dashboard");

      notify("Demo data reset.");
    };
  }

  const clear = $("#clearHistory");

  if (clear) {
    clear.onclick = () => {
      state.history = [];
      save();
      render("activity");
      notify("History cleared.");
    };
  }

  $$("[id=exportCsv]").forEach(button => {
    button.onclick = exportCSV;
  });
}

// ADD NEW TAP

$("#tapForm").onsubmit = event => {
  event.preventDefault();

  const name = $("#tapName").value.trim();

  if (!name) return;

  state.taps.push({
    id: Date.now(),
    name,
    location: $("#tapLocation").value,
    status: false,
    litres: 0
  });

  log(name+" added","New demo tap registered");

  save();

  $("#modalBackdrop").classList.remove("open");
  $("#tapForm").reset();

  render(activePage);
  notify("New tap added!");
};

$("#modalClose").onclick = () => {
  $("#modalBackdrop").classList.remove("open");
};

$("#cancelModal").onclick = () => {
  $("#modalBackdrop").classList.remove("open");
};

// CSV EXPORT

function exportCSV() {
  const rows = [
    ["Tap","Location","Status","Water Usage (L)"],
    ...state.taps.map(t => [
      t.name,
      t.location,
      t.status ? "ON" : "OFF",
      t.litres
    ])
  ];

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value).replaceAll('"','""')}"`
    ).join(",")
  ).join("\n");

  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "aquasmart-water-report.csv";
  link.click();

  URL.revokeObjectURL(url);

  notify("CSV report downloaded.");
}

// THEME MANAGEMENT

function applyTheme() {
  let theme = state.theme;

  if (theme === "system") {
    theme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches ? "dark" : "light";
  }

  document.documentElement.dataset.theme = theme;
}

$("#themeQuick").onclick = () => {
  state.theme =
    state.theme === "light" ? "dark" :
    state.theme === "dark" ? "system" : "light";

  applyTheme();
  save();
  render(activePage);

  notify("Theme changed to "+state.theme);
};

// MOBILE SIDEBAR

$("#menuToggle").onclick = () => {
  $("#sidebar").classList.toggle("open");
};

// SIMULATED WATER CONSUMPTION

setInterval(() => {
  const active = state.taps.filter(t => t.status);

  if (active.length) {
    active.forEach(t => {
      t.litres = +(t.litres + 0.08).toFixed(2);
    });

    save();

    if (
      activePage === "dashboard" ||
      activePage === "monitoring"
    ) {
      render(activePage);
    }
  }
},5000);

// START APPLICATION

applyTheme();
render("dashboard");
