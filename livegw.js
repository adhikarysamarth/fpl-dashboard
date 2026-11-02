fetch(
    "https://fpl-api.adhikarysamarth.workers.dev/"
)
.then(response => response.json())
.then(data => {

    const teams =
        data.league.standings.results;

    const histories =
        data.histories;

    const bootstrap =
        data.bootstrap;

    const currentGW =
        bootstrap.events.find(
            event => event.is_current
        );

    document.getElementById(
        "liveGWTitle"
    ).innerText =
    `📈 Live GW ${currentGW.id} Standings`;

    const rows =
        histories.map(manager => {

            const team =
                teams.find(
                    t =>
                    t.entry ===
                    manager.entry
                );

            let chip = "";

            const currentGWChip =
                manager.history.chips?.find(
                    chip =>
                        chip.event === currentGW.id
                );

            if (currentGWChip) {

                switch (
                    currentGWChip.name
                ) {

                    case "freehit":
                        chip =
                        '<span class="chip-badge chip-fh">FH</span>';
                        break;

                    case "wildcard":
                        chip =
                        '<span class="chip-badge chip-wc">WC</span>';
                        break;

                    case "bboost":
                        chip =
                        '<span class="chip-badge chip-bb">BB</span>';
                        break;

                    case "3xc":
                        chip =
                        '<span class="chip-badge chip-tc">TC</span>';
                        break;

                }

            }

            return {

                team:
                    team.entry_name,

                manager:
                    team.player_name,

                chip,

                points:
                    Number(
                        team.event_total || 0
                    )

            };

        });

    rows.sort(
        (a,b) =>
        b.points - a.points
    );

    rows.forEach(
        (row,index) => {

            row.rank =
                index + 1;

        }
    );

    const table =
        document.getElementById(
            "liveGWTable"
        );

    table.innerHTML = "";

    rows.forEach(row => {

        table.innerHTML +=
        `
        <tr>

            <td>
                ${row.rank}
            </td>

            <td>

                ${row.team}

                ${row.chip}

            </td>

            <td>
                ${row.manager}
            </td>

            <td>
                ${row.points}
            </td>

        </tr>
        `;

    });

})
.catch(error => {

    console.error(
        "Live GW Error:",
        error
    );

    const table =
        document.getElementById(
            "liveGWTable"
        );

    if (table) {

        table.innerHTML =
        `
        <tr>

            <td colspan="4">

                Failed to load data

            </td>

        </tr>
        `;

    }

});