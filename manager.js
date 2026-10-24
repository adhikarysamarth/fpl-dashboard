const params =
new URLSearchParams(
window.location.search
);

const managerId =
Number(params.get("id"));

fetch(
"https://fpl-api.adhikarysamarth.workers.dev/"
)
.then(r => r.json())
.then(data => {

    const teams =
    data.league.standings.results;

    const team =
    teams.find(
        x => x.entry === managerId
    );

    if(!team) return;

    document.getElementById(
        "teamName"
    ).innerText =
    team.entry_name;

    document.getElementById(
        "managerInfo"
    ).innerHTML =
    `
    <div class="card">

        <p>
        Manager:
        ${team.player_name}
        </p>

        <p>
        Rank:
        ${team.rank}
        </p>

        <p>
        GW Points:
        ${team.event_total}
        </p>

        <p>
        Total:
        ${team.total}
        </p>

    </div>
    `;
});