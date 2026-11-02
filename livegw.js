const API_URL = "https://fpl-api.adhikarysamarth.workers.dev/";

const CHIPS = {
    freehit:  { label: "FH", cls: "chip-fh" },
    wildcard: { label: "WC", cls: "chip-wc" },
    bboost:   { label: "BB", cls: "chip-bb" },
    "3xc":    { label: "TC", cls: "chip-tc" }
};

const $ = id => document.getElementById(id);

const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));

fetch(API_URL)
.then(response => response.json())
.then(data => {

    const teams = data.league.standings.results;
    const histories = data.histories;
    const events = data.bootstrap.events;

    const currentGW =
        events.find(event => event.is_current) ??
        events.find(event => event.is_next);

    const title = $("liveGWTitle");

    if (currentGW && title) {
        title.innerHTML =
            `Live GW ${currentGW.id} Standings ` +
            (currentGW.finished
                ? '<span class="status-badge">Final</span>'
                : '<span class="live-badge">Live</span>');
    }

    const chipCounts = {};

    const rows = histories.map(manager => {

        const team = teams.find(t => t.entry === manager.entry);

        const weeks = manager.history.current || [];

        const latestWeek =
            (currentGW && weeks.find(w => w.event === currentGW.id)) ??
            weeks.at(-1);

        const netPoints =
            (latestWeek?.points || 0) -
            (latestWeek?.event_transfers_cost || 0);

        const benchPoints = latestWeek?.points_on_bench || 0;

        let chip = "";

        const playedChip =
            latestWeek &&
            manager.history.chips?.find(c => c.event === latestWeek.event);

        const chipInfo = playedChip && CHIPS[playedChip.name];

        if (chipInfo) {
            chip = `<span class="chip-badge ${chipInfo.cls}">${chipInfo.label}</span>`;
            chipCounts[chipInfo.label] = (chipCounts[chipInfo.label] || 0) + 1;
        }

        return {
            team: team?.entry_name ?? manager.team ?? "Unknown",
            manager: team?.player_name ?? manager.manager ?? "",
            chip,
            netPoints,
            benchPoints
        };

    });

    // Rank by net points, bench points as tie-breaker
    rows.sort((a, b) =>
        b.netPoints !== a.netPoints
            ? b.netPoints - a.netPoints
            : b.benchPoints - a.benchPoints
    );

    rows.forEach((row, index) => { row.rank = index + 1; });

    // ---------- Summary cards ----------
    const leader = rows[0];

    const average = (
        rows.reduce((sum, r) => sum + r.netPoints, 0) /
        Math.max(rows.length, 1)
    ).toFixed(1);

    const chipsTotal = Object.values(chipCounts).reduce((s, n) => s + n, 0);

    const chipBreakdown = chipsTotal
        ? Object.entries(chipCounts).map(([k, n]) => `${k} ${n}`).join(" · ")
        : "No chips played";

    // Summary cards are optional: skip quietly if the page has no container
    const summaryEl = $("liveSummary");

    if (summaryEl) summaryEl.innerHTML = `
        <div class="card">
            <h3>${currentGW?.finished ? "GW Winner" : "Current Leader"}</h3>
            <div class="big">
                <span class="lead-team">${esc(leader?.team ?? "N/A")}</span>
                <span class="lead-manager">${esc(leader?.manager ?? "")}</span>
                <span class="lead-pts">${leader?.netPoints ?? 0} pts</span>
            </div>
        </div>

        <div class="card">
            <h3>League Average</h3>
            <div class="current-gw-value">${average}</div>
            <div class="card-note">points across ${rows.length} managers</div>
        </div>

        <div class="card">
            <h3>Chips Played</h3>
            <div class="current-gw-value">${chipsTotal}</div>
            <div class="card-note">${chipBreakdown}</div>
        </div>
    `;

    // ---------- Standings table ----------
    $("liveGWTable").innerHTML = rows.map(row => `
        <tr class="${row.rank <= 3 ? `rank-${row.rank}` : ""}">
            <td class="rank-cell"><span class="rank-pill">${row.rank}</span></td>
            <td class="team-cell">${esc(row.team)}${row.chip}</td>
            <td class="manager-cell">${esc(row.manager)}</td>
            <td class="pts-cell">${row.netPoints}</td>
        </tr>
    `).join("");

})
.catch(error => {

    console.error("Live GW Error:", error);

    const table = $("liveGWTable");

    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="4">Failed to load data</td>
            </tr>
        `;
    }

    const summary = $("liveSummary");

    if (summary) {
        summary.innerHTML = "";
    }

});