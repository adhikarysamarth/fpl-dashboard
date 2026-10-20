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

        const highestScore = Math.max(...scores.map(score => score.points));
        winners.push({
            gameweek,
            managers: scores.filter(score => score.points === highestScore)
        });
    });

    const tbody = document.getElementById("gameweekWinners");
    tbody.replaceChildren();

    winners.forEach(({ gameweek, managers }) => {
        managers.forEach(winner => {
            const row = document.createElement("tr");

            [ `GW ${gameweek}`, winner.team, winner.manager, `${winner.points} pts` ]
                .forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.appendChild(cell);
                });

            tbody.appendChild(row);
        });
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

if (latestWinner) {

    const teamNames =
        latestWinner.managers
        .map(manager => manager.team)
        .join(", ");

    const managerNames =
        latestWinner.managers
        .map(manager => manager.manager)
        .join(", ");

    const winningPoints =
        latestWinner.managers[0].points;

    document.getElementById(
        "recentWinner"
    ).innerHTML =
    `
    <div class="winner-name">
        ${teamNames}
    </div>

    <h3>
        ${managerNames}
    </h3>

    <p>
        Won GW ${latestWinner.gameweek}
        with
        <strong>
            ${winningPoints} net points
        </strong>
    </p>
    `;
}

const winCounts = {};

gameweekWinners.forEach(gw => {

    gw.managers.forEach(manager => {

        const teamName = manager.team;

        winCounts[teamName] =
            (winCounts[teamName] || 0) + 1;

    });

});

const topManagers =
    Object.entries(winCounts)
    .map(([team, wins]) => ({
        team,
        wins
    }))
    .sort((a, b) => b.wins - a.wins);

if(topManagers.length > 0){

    const leader = topManagers[0];

    let leaderManager = "";

    gameweekWinners.forEach(gw => {

        gw.managers.forEach(manager => {

            if(
                manager.team === leader.team &&
                !leaderManager
            ){
                leaderManager =
                    manager.manager;
            }

        });

    });

    document.getElementById(
        "gwWinner"
    ).innerHTML =
    `
    <strong>
        ${leader.team}
    </strong>

    <br>

    <small>
        ${leaderManager}
    </small>

    <br>

    (${leader.wins} Wins)
    `;
}

const topThree =
    topManagers.slice(0,3);

document.getElementById(
    "topThree"
).innerHTML =

topThree.map((manager,index)=>`

<div class="podium-card ${
    index === 0
        ? "first"
        : index === 1
        ? "second"
        : "third"
}">

    <h3>

        ${
            index === 0
                ? "🥇 First Place"
                : index === 1
                ? "🥈 Second Place"
                : "🥉 Third Place"
        }

    </h3>

    <h2>
        ${manager.team}
    </h2>

    <h3>
        ${manager.wins}
        GW Wins
    </h3>

</div>

`).join("");

})
.catch(error => {

    console.error(error);

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
