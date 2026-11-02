// Live GW page
// Data contract (unchanged): GET /live -> { currentGW, standings: [{ rank, team, manager, chip, netPoints }] }

(() => {

const API_URL = "https://fpl-api.adhikarysamarth.workers.dev/live";
const REFRESH_MS = 60000;

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

let allRows = [];
let hasLoaded = false;

function chipBadge(chipName) {
    const info = CHIPS[chipName];
    return info
        ? `<span class="chip-badge ${info.cls}">${info.label}</span>`
        : "";
}

function renderTitle(currentGW) {

    const title = $("liveGWTitle");

    if (title) {
        title.innerHTML =
            `Live GW ${esc(currentGW)} Standings ` +
            `<span class="live-badge">Live</span>`;
    }

}

function renderSummary(rows) {

    const summary = $("liveSummary");

    if (!summary) {
        return;
    }

    const leader = rows[0];

    const average = rows.length
        ? (rows.reduce((sum, row) => sum + row.netPoints, 0) / rows.length).toFixed(1)
        : "0";

    const chipCounts = {};

    rows.forEach(row => {
        const info = CHIPS[row.chip];
        if (info) {
            chipCounts[info.label] = (chipCounts[info.label] || 0) + 1;
        }
    });

    const chipsTotal = Object.values(chipCounts).reduce((sum, n) => sum + n, 0);

    const chipBreakdown = chipsTotal
        ? Object.entries(chipCounts).map(([label, n]) => `${label} ${n}`).join(" · ")
        : "No chips played";

    summary.innerHTML = `
        <div class="card">
            <h3>Current Leader</h3>
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

}

function renderTable() {

    const tbody = $("liveGWTable");

    if (!tbody) {
        return;
    }

    if (allRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No standings available yet.</td></tr>`;
        return;
    }

    const searchBox = /** @type {HTMLInputElement | null} */ ($("liveSearch"));

    const query = (searchBox?.value || "").trim().toLowerCase();

    const visible = allRows.filter(row =>
        !query ||
        row.team.toLowerCase().includes(query) ||
        row.manager.toLowerCase().includes(query)
    );

    if (visible.length === 0) {
        tbody.innerHTML =
            `<tr><td colspan="4">No managers match "${esc(query)}".</td></tr>`;
        return;
    }

    tbody.innerHTML = visible.map(row => {

        return `
            <tr class="${row.rank <= 3 ? `rank-${row.rank}` : ""}">
                <td class="rank-cell"><span class="rank-pill">${row.rank}</span></td>
                <td class="team-cell">${esc(row.team)}${chipBadge(row.chip)}<span class="team-manager">${esc(row.manager)}</span></td>
                <td class="manager-cell">${esc(row.manager)}</td>
                <td class="pts-cell">${row.netPoints}</td>
            </tr>
        `;

    }).join("");

}

function setStamp(text, failed = false) {

    const stamp = $("liveUpdated");

    if (stamp) {
        stamp.textContent = text;
        stamp.classList.toggle("is-error", failed);
    }

}

async function load() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        allRows = (data.standings || []).map((row, index) => ({
            rank: row.rank ?? index + 1,
            team: String(row.team ?? ""),
            manager: String(row.manager ?? ""),
            chip: row.chip || "",
            netPoints: Number(row.netPoints) || 0
        }));

        hasLoaded = true;

        renderTitle(data.currentGW);
        renderSummary(allRows);
        renderTable();

        setStamp(
            "Updated " +
            new Date().toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            }) +
            " · refreshes every minute"
        );

    } catch (error) {

        console.error("Live GW Error:", error);

        if (hasLoaded) {

            // Keep showing the last good data
            setStamp("Update failed, retrying...", true);

        } else {

            const tbody = $("liveGWTable");

            if (tbody) {
                tbody.innerHTML =
                    `<tr><td colspan="4">Failed to load data</td></tr>`;
            }

            const summary = $("liveSummary");

            if (summary) {
                summary.innerHTML = "";
            }

            setStamp("Could not load standings", true);

        }

    }

}

$("liveSearch")?.addEventListener("input", renderTable);

load();

setInterval(() => {
    if (!document.hidden) {
        load();
    }
}, REFRESH_MS);

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        load();
    }
});

})();