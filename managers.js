fetch("https://fpl-api.adhikarysamarth.workers.dev/")
.then(response => response.json())
.then(data => {

    const histories = data.histories;
    const teams = data.league.standings.results;
    const events = data.bootstrap.events;

    const teamMap =
        new Map(
            teams.map(team => [
                team.entry,
                team
            ])
        );

    const analytics = {};

    histories.forEach(manager => {

        const team =
            teamMap.get(manager.entry);

        const teamName =
            team?.entry_name ||
            manager.team;

        const playerName =
            team?.player_name ||
            manager.manager;

        const chips =
            manager.history.chips || [];

        analytics[teamName] = {

            player: playerName,
            team: teamName,

            bb:
                chips.some(
                    chip =>
                    chip.name === "bboost"
                ),

            tc:
                chips.some(
                    chip =>
                    chip.name === "3xc"
                ),

            first:0,
            second:0,
            third:0,

            totalNetPoints:0,
            completedWeeks:0
        };

    });

    const currentGWId =
        events.find(
            event => event.is_current
        )?.id || 999;

    const finishedGameweeks =
    [
        ...new Set(
            histories.flatMap(
                manager =>
                    (manager.history.current || [])
                    .map(row => row.event)
            )
        )
    ]
    .filter(
        gw => gw < currentGWId
    )
    .sort(
        (a,b) => b-a
    );

    finishedGameweeks.forEach(gw => {

        const rankings = [];

        histories.forEach(manager => {

            const week =
                manager.history.current.find(
                    row =>
                    row.event === gw
                );

            if(!week){
                return;
            }

            const team =
                teamMap.get(manager.entry);

            rankings.push({

                team:
                    team.entry_name,

                points:
                    week.points -
                    (
                        week.event_transfers_cost || 0
                    )

            });

            analytics[
                team.entry_name
            ].totalNetPoints +=

                week.points -
                (
                    week.event_transfers_cost || 0
                );

            analytics[
                team.entry_name
            ].completedWeeks++;

        });

        rankings.sort(
            (a,b)=>
            b.points-a.points
        );

        if(rankings[0])
            analytics[
                rankings[0].team
            ].first++;

        if(rankings[1])
            analytics[
                rankings[1].team
            ].second++;

        if(rankings[2])
            analytics[
                rankings[2].team
            ].third++;

    });

    const rows =
        Object.values(analytics)
        .map(row => ({

            ...row,

            top3:
                row.first +
                row.second +
                row.third,

            wins:
                row.first,

            avgPoints:
                (

                    row.totalNetPoints /

                    Math.max(
                        row.completedWeeks,
                        1
                    )

                )
                .toFixed(1)

        }))
        .sort(
            (a,b)=>
            a.player.localeCompare(
                b.player
            )
        );

    const tbody =
        document.getElementById(
            "managersTable"
        );

    tbody.innerHTML = "";

    rows.forEach(row => {

        tbody.innerHTML += `

        <tr>

            <td>${row.player}</td>

            <td>${row.team}</td>

            <td>
                ${row.bb ? "Y" : ""}
            </td>

            <td>
                ${row.tc ? "Y" : ""}
            </td>

            <td>${row.first || ""}</td>

            <td>${row.second || ""}</td>

            <td>${row.third || ""}</td>

            <td>${row.top3 || ""}</td>

            <td>${row.avgPoints}</td>

        </tr>

        `;
    });

    const totalManagers =
    rows.length;

const totalBB =
    rows.filter(
        row => row.bb
    ).length;

const totalTC =
    rows.filter(
        row => row.tc
    ).length;

tbody.innerHTML += `

<tr class="summary-row">

    <td>
        <strong>
        ${totalManagers} Managers
        </strong>
    </td>

    <td></td>

    <td>
        <strong>
        ${totalBB}
        </strong>
    </td>

    <td>
        <strong>
        ${totalTC}
        </strong>
    </td>

    <td></td>

    <td></td>

    <td></td>

    <td></td>

    <td></td>

</tr>

`;

});

