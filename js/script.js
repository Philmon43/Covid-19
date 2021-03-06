const obj = {
    countriesUrl: "https://api.codetabs.com/v1/proxy?quest=https://restcountries.herokuapp.com/api/v1",
    covidUrl: "https://corona-api.com/countries",
    countryName: document.querySelector(".country_name"),
    regions: document.querySelector(".regions"),
    ctx: document.getElementById('myChart').getContext('2d'),
    currentRegion: document.querySelector(".current__region"),
    spiner: document.querySelector(".spiner"),
}
const spinerOn = () => obj.spiner.style.display = "flex"
const spinerOff = () => obj.spiner.style.display = "none"

const renderData = (labels, data, total) => {
    const myChart = new Chart(obj.ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: " of " + total,
                data,
                backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            events: ['click']
        }
    });
}

const request = async (url) => {
    try {
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        return console.log(e);
    }
}

const newData = async () => {
    const countriesApi = await request(obj.countriesUrl)
    const covidApi = await request(obj.covidUrl)
    covidApi.data.map((a) => {
        return countriesApi.filter((b) => {
            if (a.code === b.cca2) {
                a.region = b.region
            }
            return b
        })
    })
    return covidApi
}

//sum of numbers
function sum() {
    let sum = 0
    for (let i = 0; i < arguments.length; i++) {
        sum += arguments[i]
    }
    return sum
}
// create buttons
function createBtn() {
    for (let i = 0; i < arguments.length; i++) {
        let newBtn = document.createElement("button");
        newBtn.classList.add(arguments[i]);
        newBtn.innerText = arguments[i];
        obj.regions.appendChild(newBtn)
    }
}
//get total stats
function wholeStats(acc, curr) {
    let currObj = curr.latest_data
    for (const k in currObj) {
        if (typeof (currObj[k]) === "number") {
            acc[k] = acc[k] + currObj[k] || 0
        }
    }
    acc["active"] = acc.confirmed - acc.recovered
    return acc
}
//update sidebar info boxes
function updateSideBar() {
    for (let i = 0; i < arguments.length; i++) {
        let current = document.querySelector("." + arguments[i][0])
        current.lastElementChild.innerText = arguments[i][1]
    }
}
//create links by country name
function createATag() {
    obj.currentRegion.innerHTML = ""
    for (let i = 0; i < arguments.length; i++) {
        let newATag = document.createElement("a");
        newATag.innerText = arguments[i][1].name
        newATag.classList.add(arguments[i][1].code)
        obj.currentRegion.appendChild(newATag)
    }
}

const onWorld = async () => {
    spinerOn()
    const response = await newData()
    const regions = response.data
        .filter((a => a.region !== ""))
        .reduce((acc, curr) => {
            acc[curr.region] = acc[curr.region] + curr.latest_data.confirmed || 0
            return acc
        }, {})
    const totalStats = response.data.reduce(wholeStats, {});
    const region = Object.keys(regions);
    const regionConfirmedCases = Object.values(regions);
    const total = Object.entries(totalStats)
    createBtn.apply(null, region);
    updateSideBar.apply(null, total)
    renderData(region, regionConfirmedCases, sum.apply(null, regionConfirmedCases))
    obj.countryName.innerText = "World Covid19 Graph"
    spinerOff()
}
onWorld()

const onRegion = async () => {
    const response = await newData()
    obj.regions.addEventListener("click", (e) => {
        const region = response.data.filter((a) => a.region === e.target.className)
        const countries = region
            .filter((a => a.name !== ""))
            .reduce((acc, curr) => {
                acc[curr.name] = curr.latest_data.confirmed || 0
                return acc
            }, {})
        const regionTotal = Object.entries(region.reduce(wholeStats, {}))
        const countriesKeys = Object.keys(countries)
        const countriesValues = Object.values(countries)
        updateSideBar.apply(null, regionTotal)
        renderData(countriesKeys, countriesValues, sum.apply(null, countriesValues))
        createATag.apply(null, Object.entries(region))
        obj.countryName.innerText = e.target.className + " Covid19 Graph"
    });
}
onRegion()

const onCountry = async () => {
    obj.currentRegion.addEventListener("click", async (e) => {
        spinerOn()
        const response = await request(`${obj.covidUrl}/${e.target.className}?include=timeline`)
        const latest = response.data.latest_data
        const timeLine = response.data.timeline;
        if (timeLine === "undefined") return
        const date = timeLine.slice(0).reverse().map(a => a.date);
        const confirmed = timeLine.slice(0).reverse().map(a => a.confirmed);
        renderData(date, confirmed, confirmed[confirmed.length - 1])
        delete latest.calculated
        latest.active = latest.confirmed - latest.recovered
        updateSideBar.apply(null, Object.entries(response.data.latest_data));
        obj.countryName.innerText = e.target.className + " Covid19 Graph"
        spinerOff()
    });
}
onCountry()