// Live Cafe
// https://github.com/mativizo/live-cafe



// Config and variables:
const config = {
    streamer: "mativizo",
    dayLength: 20000,
    dayNightTransitionLength: 10000,
    timeBetweenOrders: 10000,
    orderExpirationTime: 15000,

    mainAliases: ["lc", "livecafe", "cafe"],
    openAliases: ["open", "otwórz", "otworz", "otwoz", "otwarte"],
    closeAliases: ["close", "closed", "zamknij", "zamkniete", "zamknięte"],
    serveAliases: ["serve", "serving", "podaj", "serwuj", "zaserwuj", "daj", "give", "daje"],
    products: {
        coffee: {
            orders: ["Kawa dla mnie! ☕", "Czarna, mocna! ☕"],
            priceRange: { min: 250, max: 850 },
            aliases: ["☕", "kawa", "kawka", "kawusia", "coffee", "kofi", "coffe", "cofe", "cofee"]
        },
        tea: {
            orders: ["Zielona herbata. ☕", "Dla mnie herbata! ☕"],
            priceRange: { min: 150, max: 400 },
            aliases: ["☕", "herbata", "herba", "tea", "herbate", "herbatę", "herbatka"]
        }
    }
}

const status = {
    isDay: false,
    isOpen: false,
    leaderboard: [],
    order: null
}

$(document).ready(() => {
    
    // Create new orders
    setInterval(() => {
        if (status.isOpen && status.order == null) {
            newOrder();
        }
    }, config.timeBetweenOrders)

    // Day night cycle
    setInterval(() => {
        if (status.isDay) goNight();
        else goDay();
    }, config.dayLength)


    ComfyJS.onCommand = ( user, command, message, flags, extra ) => {
        if (!config.mainAliases.includes(command.toLowerCase())) return;
        
        const args = getArgs(message);

        if (args.length == 0) return;
        
        const subcommand = args[0];
        args.shift();

        if (config.openAliases.includes(subcommand.toLowerCase())) {
            return goOpen();
        }

        if (config.closeAliases.includes(subcommand.toLowerCase())) {
            return goClose();
        }

        if (config.serveAliases.includes(subcommand.toLowerCase())) {
            if (args.length == 0) return;
            if (status.order == null) return;

            let possibleProductCategory = args[0].toLowerCase();
            let categories = Object.keys(config.products);
            let productCategory = false;

            for (let i = 0; i < categories.length; i++) {
                if (config.products[ categories[i] ].aliases.includes(possibleProductCategory)) {
                    productCategory = categories[i];
                }
            }

            if (!productCategory) return;

            return makeOrder(user, productCategory);
        }                    
    }


    ComfyJS.Init(config.streamer);
});



const goClose = () => {
    if (!status.isOpen) return;
    status.isOpen = false
    $("#close").fadeIn(10);
    $("#open").fadeOut(10);
}

const goOpen = () => {
    if (status.isOpen) return;
    status.isOpen = true
    $("#close").fadeOut(10);
    $("#open").fadeIn(10);
}

const goNight = () => {
    if (!status.isDay) return;
    status.isDay = false;
    $("#day-bg").fadeOut(10000);
    $("#night-mask").fadeIn(10000);
}

const goDay = () => {
    if (status.isDay) return;
    status.isDay = true;
    $("#day-bg").fadeIn(10000);
    $("#night-mask").fadeOut(10000);
}

const getArgs = (message) => message.split(" ");

const addToLeaderboard = (user, amount) => {
    let needsToAdd = true;
    for (let i = 0; i < status.leaderboard.length; i++) {
        let place = status.leaderboard[i];
        if (place.user == user) {
            needsToAdd = false;

            status.leaderboard[i].amount += amount;
            status.leaderboard[i].lastAdded = amount;
        }
    }

    if (needsToAdd) {
        status.leaderboard.push({
            user, amount, lastAdded: amount
        })
    }

    refreshList();
}

const refreshList = () => {
    $("#lb-content").fadeOut(1000, () => {
        $("#lb-content").html("");
        let lb = status.leaderboard.sort((a,b) => b.amount - a.amount)
        lb.forEach((v, i) => {
            $("#lb-content").append(`
                <p class='lb-row'>${(i+1)}. ${v.user}: $${v.amount.toFixed(2)} (${(v.lastAdded > 0) ? "+" : "-"}${v.lastAdded.toFixed(2)})</p>
            `)
        })
        $("#lb-content").fadeIn(1000)
    })
}

const newOrder = () => {
    let categories = Object.keys(config.products)
    let category = categories[Math.floor(Math.random() * categories.length)]

    let product = config.products[category];

    status.order = {
        "category": category,
        "text": product.orders[Math.floor(Math.random() * product.orders.length)],
        "price": Math.floor(Math.random() * (product.priceRange.max - product.priceRange.min) + product.priceRange.min) / 100,
        "completed": false
    }

    $("#order").text(status.order.text);
    
    // let left = Math.floor(Math.random() * 1800);
    // let top = Math.floor(Math.random() * 900);
    let left = 100;
    let top = 100;

    $("#order").css("top", top)
    $("#order").css("left", left);
    if ($("#order").hasClass("crossed")) $("#order").removeClass("done");
    $("#order").fadeIn(500);

    setTimeout(() => {
        if (status.order != null) {
            $("#order").animate({
                "top": "-=1000"
            }, 5000, () => {
                status.order = null;
            })
        }
    }, config.orderExpirationTime)
}

const makeOrder = (user, category) => {
    if (status.order == null) return;
    if (status.order.completed) return;
    if (status.order.category != category) return;

    $("#order").addClass("done");
    addToLeaderboard(user, status.order.price)
    status.order.completed = true;
}