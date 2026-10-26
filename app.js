const API_URL = "https://fpl-api.adhikarysamarth.workers.dev/";
const PRIZES = ["$70", "$50", "$30"];
const SEASON_LABEL = "26/27";

const $ = id => document.getElementById(id);

// Escape text before it is placed into innerHTML
const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));

function renderGameweekWinners(histories, events, teams) {

    const finishedGameweeks =
        events.filter(event => event.finished).map(event => event.id);

    const gameweeks = [
        ...new Set(
            histories.flatMap(manager =>
                (manager.history.current || []).map(row => row.event)
            )
        )
    ]
        .filter(gw => finishedGameweeks.includes(gw))
        .sort((a, b) => b - a);

    const teamByEntry = new Map(teams.map(team => [team.entry, team]));

    const winners = [];

    gameweeks.forEach(gameweek => {

        const scores = histories
            .map(manager => {

                const result =
                    (manager.history.current || []).find(
                        item => item.event === gameweek
                    );

                if (!result) {
                    return null;
                }

                const leagueTeam = teamByEntry.get(manager.entry);
                const transferCost = result.event_transfers_cost || 0;

                return {
                    team: leagueTeam?.entry_name ?? manager.team,
                    manager: leagueTeam?.player_name ?? manager.manager,
                    grossPoints: result.points,
                    transferCost,
                    benchPoints: result.points_on_bench || 0,
                    points: result.points - transferCost
                };

            })
            .filter(Boolean);

        if (scores.length === 0) {
            return;
        }

        // League ranking rules: 1) net points, 2) bench points (tie-breaker)
        scores.sort((a, b) =>
            b.points !== a.points
                ? b.points - a.points
                : b.benchPoints - a.benchPoints
        );

        winners.push({ gameweek, managers: scores.slice(0, 3) });

    });

    const tbody = $("gameweekWinners");

    if (tbody) {

        tbody.replaceChildren();

        winners.forEach(({ gameweek, managers }) => {

            const row = document.createElement("tr");

            const gwCell = document.createElement("td");
            gwCell.textContent = `GW ${gameweek}`;
            row.appendChild(gwCell);

            [0, 1, 2].forEach(index => {

                const cell = document.createElement("td");
                const entry = managers[index];

                if (entry) {
                    cell.append(document.createTextNode(entry.team));

                    const pts = document.createElement("span");
                    pts.className = "pts";
                    pts.textContent = `${entry.points} pts`;
                    cell.appendChild(pts);
                }

                row.appendChild(cell);

            });

            tbody.appendChild(row);

        });

        if (winners.length === 0) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 4;
            cell.textContent = "No gameweek data available.";
            row.appendChild(cell);
            tbody.appendChild(row);

        }

    }

    return winners;

}

function placeCard(cls, rank, label, entry, prize) {

    if (!entry) {
        return "";
    }

    return `
        <div class="result-place ${cls}">
            <span class="rank-badge">${rank}</span>
            <div class="place-label">${label}</div>
            <h2>${esc(entry.team)}</h2>
            <p class="manager">${esc(entry.manager)}</p>
            <div class="gw-score">${entry.points} <small>pts</small></div>
            <strong class="prize">Won ${prize}</strong>
        </div>
    `;

}

fetch(API_URL)
.then(response => response.json())
.then(data => {

    const leagueData = data.league;
    const bootstrap = data.bootstrap;
    const histories = data.histories;

    const teams = leagueData.standings.results;

    $("leagueName").innerText = leagueData.league.name;

    $("lastUpdatedTop").innerText =
        new Date(leagueData.last_updated_data).toLocaleString();

    const currentGW = bootstrap.events.find(event => event.is_current);

    if (currentGW) {

        const currentGWScores = teams
            .map(team => ({
                team: team.entry_name,
                manager: team.player_name,
                points: Number(team.event_total || 0)
            }))
            .sort((a, b) => b.points - a.points);

        const leader = currentGWScores[0] ?? {
            team: "N/A",
            manager: "",
            points: 0
        };

        const average = (
            currentGWScores.reduce((sum, row) => sum + row.points, 0) /
            Math.max(currentGWScores.length, 1)
        ).toFixed(1);

        $("leadingGWTitle").innerText =
            currentGW.finished
                ? `GW ${currentGW.id} Winner`
                : `Leading GW ${currentGW.id}`;

        $("leadingGW").innerHTML = `
            <span class="lead-team">${esc(leader.team)}</span>
            <span class="lead-manager">${esc(leader.manager)}</span>
            <span class="lead-pts">${leader.points} pts</span>
        `;

        $("gwAverage").innerHTML = `League average: ${average} pts`;

        $("gw").innerHTML =
            currentGW.finished
                ? `<span>GW ${currentGW.id}</span><span class="status-badge">Completed</span>`
                : `<span>GW ${currentGW.id}</span>`;

    }

    const nextGW = bootstrap.events.find(event => event.is_next);

    if (nextGW) {

        const deadlineDate = new Date(nextGW.deadline_time);

        $("deadlineTitle").innerText = `GW ${nextGW.id} Deadline`;

        $("deadline").innerText =
            `${deadlineDate.toLocaleDateString("en-US", {
                timeZone: "America/New_York",
                month: "short",
                day: "numeric",
                year: "numeric"
            })} ${deadlineDate.toLocaleTimeString("en-US", {
                timeZone: "America/New_York",
                hour: "numeric",
                minute: "2-digit"
            })} Eastern Time`;

        const updateCountdown = () => {

            const distance = deadlineDate - new Date();

            if (distance <= 0) {
                $("countdown").innerHTML = "Deadline passed";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            $("countdown").innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        };

        updateCountdown();
        setInterval(updateCountdown, 1000);

    }

    const gameweekWinners =
        renderGameweekWinners(histories, bootstrap.events, teams);

    const latestWinner = gameweekWinners[0];

    if (latestWinner) {

        const [first, second, third] = latestWinner.managers;

        $("gwResultsTitle").innerText =
            `GW ${latestWinner.gameweek} Results`;

        $("recentWinner").innerHTML = `
            <div class="results-grid">
                ${placeCard("gold", 1, "First place", first, PRIZES[0])}
                ${placeCard("silver", 2, "Second place", second, PRIZES[1])}
                ${placeCard("bronze", 3, "Third place", third, PRIZES[2])}
            </div>
            <div class="share-row">
                <button type="button" class="copy-btn" id="copyResults">Copy for Viber</button>
            </div>
        `;

        // Copies a plain-text summary that pastes cleanly into Viber
        const copyBtn = $("copyResults");

        copyBtn.addEventListener("click", async () => {

            const medals = ["🥇", "🥈", "🥉"];

            const lines = [
                "🚨 🚨 🚨",
                `GameWeek ${latestWinner.gameweek} Winners (${SEASON_LABEL}):`
            ];

            latestWinner.managers.forEach((m, i) => {
                lines.push("");
                lines.push(
                    `${medals[i]}${m.team} (${m.manager}): ${m.points} points. Gets ${PRIZES[i]}.`
                );
            });

            const text = lines.join("\n");

            try {
                await navigator.clipboard.writeText(text);
            } catch {
                const ta = document.createElement("textarea");
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                ta.remove();
            }

            copyBtn.textContent = "Copied!";
            setTimeout(() => { copyBtn.textContent = "Copy for Viber"; }, 2000);

        });

    }

    // ---------- Season snapshot ----------
    const winCounts = {};

    gameweekWinners.forEach(gw => {
        const winner = gw.managers[0];
        if (winner) {
            winCounts[winner.team] = (winCounts[winner.team] || 0) + 1;
        }
    });

    const uniqueWinners = Object.keys(winCounts).length;

    const [mostWinsTeam, mostWinsCount] =
        Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0] ?? ["N/A", 0];

    let highestScore = 0;
    let highestScoreTeam = "";
    let highestScoreManager = "";
    let highestScoreGW = "";

    gameweekWinners.forEach(gw => {
        gw.managers.forEach(manager => {
            if (manager.points > highestScore) {
                highestScore = manager.points;
                highestScoreTeam = manager.team;
                highestScoreManager = manager.manager;
                highestScoreGW = gw.gameweek;
            }
        });
    });

    const averageWinnerScore = gameweekWinners.length
        ? (
            gameweekWinners.reduce(
                (sum, gw) => sum + gw.managers[0].points,
                0
            ) / gameweekWinners.length
        ).toFixed(1)
        : "0.0";

    $("seasonSnapshot").innerHTML = `
        <div class="podium-card">
            <h3>Completed GWs</h3>
            <h2 class="statpts">${gameweekWinners.length}</h2>
        </div>

        <div class="podium-card">
            <h3>Unique Winners</h3>
            <h2 class="statpts">${uniqueWinners}</h2>
        </div>

        <div class="podium-card">
            <h3>Highest Net Score</h3>
            <h2 class="statpts">${highestScore}</h2>
            <small>${esc(highestScoreTeam)} &middot; ${esc(highestScoreManager)} &middot; GW ${highestScoreGW}</small>
        </div>

        <div class="podium-card">
            <h3>Most GW Wins</h3>
            <h2 class="statpts">${mostWinsCount}</h2>
            <small>${esc(mostWinsTeam)}</small>
        </div>

        <div class="podium-card">
            <h3>Avg Winner Score</h3>
            <h2 class="statpts">${averageWinnerScore}</h2>
        </div>
    `;

})
.catch(error => {

    console.error("Failed to load dashboard data:", error);

    $("leadingGW").textContent = "Unable to load gameweek winner";
    $("recentWinner").textContent =
        "Unable to load gameweek results. Check the API connection and try again.";

    const tbody = $("gameweekWinners");

    if (tbody) {
        tbody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent =
            "Unable to load gameweek winners. Check the API connection and try again.";
        row.appendChild(cell);
        tbody.appendChild(row);
    }

});