function renderGameweekWinners(histories, events, teams) {
    const finishedGameweeks = events
        .filter(event => event.finished)
        .map(event => event.id)
        .sort((a, b) => b - a);
    const teamByEntry = new Map(
        teams.map(team => [team.entry, team])
    );
    const winners = [];

    finishedGameweeks.forEach(gameweek => {
        const scores = histories
            .map(manager => {
                const result = manager.history.current.find(
                    item => item.event === gameweek
                );

                if (!result) {
                    return null;
                }

                const leagueTeam = teamByEntry.get(manager.entry);

                return {

                    team:
                        leagueTeam?.entry_name ??
                        manager.team,

                    manager:
                        leagueTeam?.player_name ??
                        manager.manager,

                    grossPoints:
                        result.points,

                    transferCost:
                        result.event_transfers_cost || 0,

                    points:
                        result.points -
                        (result.event_transfers_cost || 0)

                };
            })
            .filter(Boolean);

        if (scores.length === 0) {
            return;
        }

        scores.sort(
    (a,b) => b.points - a.points
);

winners.push({

    gameweek,

    managers: scores.slice(0,3)

});
    });

    const tbody = document.getElementById("gameweekWinners");
    tbody.replaceChildren();

winners.forEach(({ gameweek, managers }) => {

    const row =
        document.createElement("tr");

    const first =
        managers[0]
        ? `${managers[0].team} (${managers[0].points})`
        : "";

    const second =
        managers[1]
        ? `${managers[1].team} (${managers[1].points})`
        : "";

    const third =
        managers[2]
        ? `${managers[2].team} (${managers[2].points})`
        : "";

    [

        `GW ${gameweek}`,

        first,

        second,

        third

    ].forEach(value => {

        const cell =
            document.createElement("td");

        cell.textContent =
            value;

        row.appendChild(cell);

    });

    tbody.appendChild(row);

});

    if (winners.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "No completed gameweek results are available yet.";
        row.appendChild(cell);
        tbody.appendChild(row);
    }

    return winners;
}

fetch("https://fpl-api.adhikarysamarth.workers.dev/")
.then(response => response.json())
.then(data => {

    const leagueData = data.league;
    const bootstrap = data.bootstrap;
    const histories = data.histories;

    const teams =
        leagueData.standings.results;

    document.getElementById(
        "leagueName"
    ).innerText =
    leagueData.league.name;

    /*document.getElementById(
        "members"
    ).innerText =
    teams.length;*/

    document.getElementById(
        "lastUpdatedTop"
    ).innerText =
    new Date(
        leagueData.last_updated_data
    ).toLocaleString();

    const currentGW =
        bootstrap.events.find(
            event => event.is_current
        );

    if(currentGW){

    const currentGWScores = [];

    histories.forEach(manager => {

        const result =
            manager.history.current.find(
                row =>
                row.event === currentGW.id
            );

        if(!result){
            return;
        }

        const team =
            teams.find(
                t => t.entry === manager.entry
            );

        currentGWScores.push({

            team:
                team?.entry_name ||
                manager.team,

            manager:
                team?.player_name ||
                manager.manager,

            points:
                result.points -
                (
                    result.event_transfers_cost || 0
                )

        });

    });

    currentGWScores.sort(
        (a,b)=>
        b.points-a.points
    );

    const leader =
        currentGWScores[0];

    const average =
        (
            currentGWScores.reduce(
                (sum,row)=>
                sum + row.points,
                0
            )
            /
            currentGWScores.length
        ).toFixed(1);

        document.getElementById(
            "leadingGWTitle"
        ).innerText =
        `🔥 Leading GW ${currentGW.id}`;

        document.getElementById(
            "gwWinner"
        ).innerHTML =
        `
        <strong>
        ${leader.team}
        </strong>

        <br>

        ${leader.manager}

        <br>

        ${leader.points} pts
        `;

        document.getElementById(
            "gwAverage"
        ).innerHTML =
        `
        League Avg: ${average} pts
        `;
    }

    if(currentGW){

        document.getElementById(
            "gw"
        ).innerText =
        "GW " + currentGW.id;
    }

    const nextGW =
        bootstrap.events.find(
            event => event.is_next
        );

    if(nextGW){

        const deadlineDate =
            new Date(
                nextGW.deadline_time
            );

        document.getElementById(
            "deadline"
        ).innerText =
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

        function updateCountdown(){

            const now = new Date();

            const distance =
                deadlineDate - now;

            if(distance <= 0){

                document.getElementById(
                    "countdown"
                ).innerHTML =
                "⏰ Deadline Passed";

                return;
            }

            const days =
                Math.floor(distance/(1000*60*60*24));

            const hours =
                Math.floor((distance%(1000*60*60*24))
                /(1000*60*60));

            const minutes =
                Math.floor((distance%(1000*60*60))
                /(1000*60));

            const seconds =
                Math.floor((distance%(1000*60))
                /1000);

            document.getElementById(
                "countdown"
            ).innerHTML =
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }

        updateCountdown();

        setInterval(updateCountdown,1000);
    }

    const gameweekWinners =
    renderGameweekWinners(
        histories,
        bootstrap.events,
        teams
    );

const latestWinner =
    gameweekWinners[0];

if(latestWinner){

    const winner =
        latestWinner.managers[0];

    const teamName =
        winner.team;

    const managerName =
        winner.manager;

    const winningPoints =
        winner.points;

    document.getElementById(
        "recentWinner"
    ).innerHTML =
    `
    <div class="winner-name">
        🔥 ${teamName} 🔥
    </div>

    <h3>
        ${managerName}
    </h3>

    <p>
        GW ${latestWinner.gameweek}

        <br><br>

        <strong>
            ${winningPoints} Net Points
        </strong>

    </p>
    `;
}

const winCounts = {};

gameweekWinners.forEach(gw => {

    const winner = gw.managers[0];

    if(!winner){
        return;
    }

    winCounts[winner.team] =
        (winCounts[winner.team] || 0) + 1;

});

const uniqueWinners =
    Object.keys(winCounts).length;

const mostWins =
    Object.entries(winCounts)
    .sort((a,b) => b[1] - a[1])[0];

let highestScore = 0;

let highestScoreTeam = "";

let highestScoreManager = "";

let highestScoreGW = "";

gameweekWinners.forEach(gw => {

    gw.managers.forEach(manager => {

        if(manager.points > highestScore){

            highestScore =
                manager.points;

            highestScoreTeam =
                manager.team;

            highestScoreManager =
                manager.manager;

            highestScoreGW =
                gw.gameweek;

        }

    });

});

const averageWinnerScore =
(
    gameweekWinners.reduce(
        (sum,gw) =>
        sum + gw.managers[0].points,
        0
    )
    /
    gameweekWinners.length
).toFixed(1);

document.getElementById(
    "seasonSnapshot"
).innerHTML =

`
<div class="podium-card">
<h3>Completed GWs</h3>
<h2>${gameweekWinners.length}</h2>
</div>

<div class="podium-card">
<h3>Unique Winners</h3>
<h2>${uniqueWinners}</h2>
</div>

<div class="podium-card">
    <h3>Highest Net Score</h3>
    <h2>${highestScore}</h2>
    <small>${highestScoreTeam}</small> |
    <small>${highestScoreManager}</small> |
    <small>
    GW ${highestScoreGW}
    </small>
</div>

<div class="podium-card">
<h3>Most GW Wins</h3>
<h2>${mostWins[0]} | ${mostWins[1]} wins</h2>
</div>

<div class="podium-card">
<h3>Avg Winner Score</h3>
<h2>${averageWinnerScore}</h2>
</div>
`;

})
.catch(error => {

    console.error("REAL ERROR:", error);

    alert(error);

    document.getElementById("gwWinner").textContent =
        "Unable to load gameweek winner";
    document.getElementById("recentWinner").textContent =
        "Unable to load gameweek results. Check the API connection and try again.";

    const tbody = document.getElementById("gameweekWinners");
    tbody.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent =
        "Unable to load gameweek winners. Check the API connection and try again.";
    row.appendChild(cell);
    tbody.appendChild(row);

});
