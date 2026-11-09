const API_URL = "https://fpl-api.adhikarysamarth.workers.dev/";
const LIVE_API_URL = "https://fpl-api.adhikarysamarth.workers.dev/live";

const PRIZES = ["$70", "$50", "$30"];
const CHIPS = {
    freehit:  { label: "FH", cls: "chip-fh" },
    wildcard: { label: "WC", cls: "chip-wc" },
    bboost:   { label: "BB", cls: "chip-bb" },
    "3xc":    { label: "TC", cls: "chip-tc" }
};

function chipBadge(chipName) {

    const info =
        CHIPS[chipName];

    return info
        ? `<span class="chip-badge ${info.cls}">
             ${info.label}
           </span>`
        : "";
}
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

                const chipPlayed =
                (manager.history.chips || [])
                .find(
                    chip =>
                        chip.event === gameweek
                )?.name || null;

                return {
                    team: leagueTeam?.entry_name ?? manager.team,
                    manager: leagueTeam?.player_name ?? manager.manager,
                    grossPoints: result.points,
                    transferCost,
                    benchPoints: result.points_on_bench || 0,
                    points: result.points - transferCost,
                    chip: chipPlayed
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
            <h2>
                ${esc(entry.team)}
                ${chipBadge(entry.chip)}
            </h2>
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

        fetch(LIVE_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Live API HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(liveData => {
            const standings = liveData.standings || [];
            const leader = standings[0] || {
                team: "N/A",
                manager: "",
                netPoints: 0
            };

            const average = standings.length
                ? (
                    standings.reduce(
                        (sum, row) => sum + Number(row.netPoints || 0),
                        0
                    ) / standings.length
                  ).toFixed(1)
                : "0.0";

            let badge = "";

            if (liveData.status === "final") {
                badge = '<span class="status-badge">COMPLETED</span>';
                $("leadingGWTitle").innerText =
                    `GW ${liveData.currentGW} Winner`;
            } else if (liveData.status === "awaiting") {
                badge = '<span class="awaiting-badge">AWAITING CONFIRMATION</span>';
                $("leadingGWTitle").innerText =
                    `GW ${liveData.currentGW} Provisional Leader`;
            } else {
                badge = '<span class="live-badge">LIVE</span>';
                $("leadingGWTitle").innerText =
                    `🔥 Leading GW ${liveData.currentGW} 🔥`;
            }

            $("gw").innerHTML =
                `<span>GW ${liveData.currentGW}</span>${badge}`;

            $("leadingGW").innerHTML = `
                <span class="lead-team">${esc(leader.team)}</span>
                <span class="lead-manager">${esc(leader.manager)}</span>
                <span class="lead-pts">${leader.netPoints} pts</span>
            `;

            $("gwAverage").innerHTML =
                `League average: ${average} net pts`;
        })
        .catch(error => {
            console.error("Unable to load live GW summary:", error);

            $("gw").innerHTML =
                currentGW.finished
                    ? `<span>GW ${currentGW.id}</span><span class="status-badge">COMPLETED</span>`
                    : `<span>GW ${currentGW.id}</span><span class="live-badge">LIVE</span>`;

            $("leadingGWTitle").innerText =
                currentGW.finished
                    ? `GW ${currentGW.id} Winner`
                    : `🔥 Leading GW ${currentGW.id} 🔥`;

            $("leadingGW").textContent =
                "Live standings temporarily unavailable";
            $("gwAverage").textContent = "";
        });
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
                ${placeCard("gold", 1, "🔥 Winner 🔥", first, PRIZES[0])}
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

    const mostWinsManager =
        gameweekWinners
            .flatMap(gw => gw.managers)
            .find(
                manager =>
                    manager.team === mostWinsTeam
            )?.manager || "";

    let highestScore = 0;
    let highestScoreTeam = "";
    let highestScoreManager = "";
    let highestScoreGW = "";
    let lowestWinningScore = Infinity;
    let lowestWinningGW = "";
    let lowestWinningTeam = "";
    let lowestWinningManager = "";

    gameweekWinners.forEach(gw => {
        gw.managers.forEach(manager => {
            if (manager.points > highestScore) {
                highestScore = manager.points;
                highestScoreTeam = manager.team;
                highestScoreManager = manager.manager;
                highestScoreGW = gw.gameweek;
            }
        });
        const weeklyWinner =
            gw.managers[0];
        if (
            weeklyWinner &&
            weeklyWinner.points < lowestWinningScore
        ) {
            lowestWinningScore =
                weeklyWinner.points;
            lowestWinningTeam =
                weeklyWinner.team;
            lowestWinningManager =
                weeklyWinner.manager;
            lowestWinningGW =
                gw.gameweek;
        }
    });

    const averageWinnerScore = gameweekWinners.length
        ? (
            gameweekWinners.reduce(
                (sum, gw) => sum + gw.managers[0].points,
                0
            ) / gameweekWinners.length
        ).toFixed(1)
        : "0.0";

    const teamStats = {};
    gameweekWinners.forEach(gw => {
        gw.managers.forEach((manager, index) => {
            teamStats[manager.team] ??= {
                team: manager.team,
                top3: 0,
                moneyWon: 0
            };
            teamStats[manager.team].top3++;
            if(index === 0){
                teamStats[manager.team].moneyWon += 70;
            }
            if(index === 1){
                teamStats[manager.team].moneyWon += 50;
            }
            if(index === 2){
                teamStats[manager.team].moneyWon += 30;
            }
        });
    });

    const mostTop3 =
        Object.values(teamStats)
        .sort((a,b) => b.top3 - a.top3)[0];

    const mostTop3Manager =
        gameweekWinners
            .flatMap(gw => gw.managers)
            .find(
                m => m.team === mostTop3?.team
            )?.manager || "";

    const mostMoney =
        Object.values(teamStats)
        .sort((a,b) => b.moneyWon - a.moneyWon)[0];

    const mostMoneyManager =
        gameweekWinners
            .flatMap(gw => gw.managers)
            .find(
                m => m.team === mostMoney?.team
            )?.manager || "";

    const completedGWIds = new Set(
        bootstrap.events
            .filter(event => event.finished)
            .map(event => event.id)
    );

    const benchTotals = {};

    histories.forEach(manager => {
        const teamName = manager.team;
        const managerName = manager.manager;
        const chips = manager.history.chips || [];

        const benchBoostGWs = new Set(
            chips
                .filter(chip => chip.name === "bboost")
                .map(chip => chip.event)
        );

        benchTotals[teamName] ??= {
            team: teamName,
            manager: managerName,
            points: 0
        };

        (manager.history.current || [])
            .filter(week =>
                completedGWIds.has(week.event) &&
                !benchBoostGWs.has(week.event)
            )
            .forEach(week => {
                benchTotals[teamName].points +=
                    Number(week.points_on_bench || 0);
            });
    });

    const benchFarmer = Object.values(benchTotals)
        .sort((a, b) => b.points - a.points)[0];

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
            <h3>Highest Winning Score</h3>
            <h2 class="statpts">${highestScore}</h2>
            <small>${esc(highestScoreTeam)} &middot; ${esc(highestScoreManager)} &middot; GW ${highestScoreGW}</small>
        </div>

        <div class="podium-card">
            <h3>Lowest Winning Score</h3>
            <h2 class="statpts">${Number.isFinite(lowestWinningScore) ? lowestWinningScore : 0}</h2>
            <small>${esc(lowestWinningTeam)} · ${esc(lowestWinningManager)} · GW ${lowestWinningGW}</small>
        </div>

        <div class="podium-card">
            <h3>Most GW Wins</h3>
            <h2 class="statpts">${mostWinsCount}</h2>
            <small>
                ${esc(mostWinsTeam)}
                ·
                ${esc(mostWinsManager)}
            </small>
        </div>

        <div class="podium-card">
            <h3>Most Top 3 Finishes</h3>
            <h2 class="statpts">
                ${mostTop3?.top3 || 0}
            </h2>
            <small>
                ${esc(mostTop3?.team || "N/A")}
                ·
                ${esc(mostTop3Manager)}
            </small>
        </div>    

        <div class="podium-card">
            <h3>Avg Winner Score</h3>
            <h2 class="statpts">${averageWinnerScore}</h2>
        </div>
        
        <div class="podium-card">
            <h3>Highest Payout</h3>
            <h2 class="statpts">
                $${mostMoney?.moneyWon || 0}
            </h2>
            <small>
                ${esc(mostMoney?.team || "N/A")}
                ·
                ${esc(mostMoneyManager)}
            </small>
        </div>
        <div class="podium-card">
            <h3>Bench Farmer</h3>
            <h2 class="statpts">${benchFarmer?.points || 0} Pts</h2>
            <small>
                ${esc(benchFarmer?.team || "N/A")}
                ·
                ${esc(benchFarmer?.manager || "")}
            </small>
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
