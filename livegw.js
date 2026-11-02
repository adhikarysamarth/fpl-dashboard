const API_URL =
    "https://fpl-api.adhikarysamarth.workers.dev/live";

const CHIPS = {
    freehit:  { label: "FH", cls: "chip-fh" },
    wildcard: { label: "WC", cls: "chip-wc" },
    bboost:   { label: "BB", cls: "chip-bb" },
    "3xc":    { label: "TC", cls: "chip-tc" }
};

const $ =
    id => document.getElementById(id);

const esc =
    value =>
    String(value ?? "")
    .replace(
        /[&<>"']/g,
        ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[ch])
    );

fetch(API_URL)

.then(response => response.json())

.then(data => {

    const currentGW =
        data.currentGW;

    $("liveGWTitle").innerHTML =

        `📈 Live GW ${currentGW} Standings ` +

        `<span class="live-badge">Live</span>`;

    const rows =
        data.standings || [];

    // Summary Cards

    const leader =
        rows[0];

    const average =

        rows.length

        ?

        (
            rows.reduce(
                (sum,row) =>
                sum + row.netPoints,
                0
            ) / rows.length
        ).toFixed(1)

        :

        "0";

    const chipCounts = {};

    rows.forEach(row => {

        if(row.chip){

            const chipInfo =
                CHIPS[row.chip];

            if(chipInfo){

                chipCounts[
                    chipInfo.label
                ] =

                (
                    chipCounts[
                        chipInfo.label
                    ] || 0
                ) + 1;

            }

        }

    });

    const chipsTotal =
        Object.values(
            chipCounts
        )
        .reduce(
            (sum,val) =>
            sum + val,
            0
        );

    const chipBreakdown =

        chipsTotal

        ?

        Object.entries(
            chipCounts
        )
        .map(
            ([chip,count]) =>
            `${chip} ${count}`
        )
        .join(" · ")

        :

        "No chips played";

    if($("liveSummary")){

        $("liveSummary").innerHTML =

        `
        <div class="card">

            <h3>Current Leader</h3>

            <div class="big">

                <span class="lead-team">
                    ${esc(leader?.team ?? "N/A")}
                </span>

                <span class="lead-manager">
                    ${esc(leader?.manager ?? "")}
                </span>

                <span class="lead-pts">
                    ${leader?.netPoints ?? 0} pts
                </span>

            </div>

        </div>

        <div class="card">

            <h3>League Average</h3>

            <div class="current-gw-value">
                ${average}
            </div>

            <div class="card-note">
                points across ${rows.length} managers
            </div>

        </div>

        <div class="card">

            <h3>Chips Played</h3>

            <div class="current-gw-value">
                ${chipsTotal}
            </div>

            <div class="card-note">
                ${chipBreakdown}
            </div>

        </div>
        `;

    }

    // Table

    $("liveGWTable").innerHTML =

        rows.map(row => {

            let chip = "";

            if(row.chip){

                const chipInfo =
                    CHIPS[row.chip];

                if(chipInfo){

                    chip =

                    `<span class="chip-badge ${chipInfo.cls}">
                        ${chipInfo.label}
                    </span>`;

                }

            }

            return `
            <tr class="${
                row.rank <= 3
                    ? `rank-${row.rank}`
                    : ""
            }">

                <td>
                    ${row.rank}
                </td>

                <td>

                    ${esc(row.team)}

                    ${chip}

                </td>

                <td>

                    ${esc(row.manager)}

                </td>

                <td>

                    ${row.netPoints}

                </td>

            </tr>
            `;

        })

        .join("");

})

.catch(error => {

    console.error(
        "Live GW Error:",
        error
    );

    if($("liveGWTable")){

        $("liveGWTable").innerHTML =

        `
        <tr>

            <td colspan="4">

                Failed to load data

            </td>

        </tr>
        `;

    }

    if($("liveSummary")){

        $("liveSummary").innerHTML = "";

    }

});