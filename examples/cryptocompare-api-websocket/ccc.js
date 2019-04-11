const ccc = {
  name: "ccc",
  cccurl: "https://min-api.cryptocompare.com",
  params: {
    credentials: "omit",
    headers: {},
    referrer: "https://cryptoqween.github.io/streamer/trade/",
    referrerPolicy: "no-referrer-when-downgrade",
    body: null,
    method: "GET",
    mode: "cors"
  },
  appInfo: {
    aggSubs: [],
    allSubs: [],
    actualSubs: new Set(),
    globalmenu: {},
    imageUrls: new Map(),
    coinMap: new Map(),
    exchanges: new Map(),
    cccaggexchanges: new Map(),
    alphaGroup: new Map(),
    pair: ["???", "???"]
  },
  coins: function () {
    return fetch(`${this.cccurl}/data/all/coinlist`, this.params)
      .then(res => res.json())
      .then(data => data.Data);
  },
  init: async function (...arguments) {
    this.coins().then(coins => {
      this.appInfo.imageUrls = new Map(
        Object.entries(coins)
        .reduce((a, c, i) => {
          a[i] = [c[0], `https://www.cryptocompare.com${c[1].ImageUrl}`];
          return a;
        }, [])
        .sort()
      );

      bigImg();

      ["fsym", "tsym"].map(selectors => {
        fillMenu(Object.keys(coins), selectors);
      });

      this.appInfo.coinMap = new Map(Object.entries(coins));

      this.appInfo.alphaGroup = new Map(
        groupAlphaArray([...this.appInfo.imageUrls.keys()]).reduce(
          (a, c, i) => {
            a[i] = [c.group, c.children];
            return a;
          },
          []
        )
      );
    });
    this.exchanges().then(exchanges => {
      this.appInfo.exchanges = new Map(Object.entries(exchanges));
    });
    this.cccaggexchanges().then(exchanges => {
      this.appInfo.cccaggexchanges = new Map(Object.entries(exchanges));
    });
    if (arguments.includes(true)) {
      updateOutput(5);
    }
  },
  exchanges: () => {
    return fetch(`${ccc.cccurl}/data/all/exchanges`, this.params).then(res =>
      res.json()
    );
  },
  cccaggexchanges: () => {
    return fetch(`${ccc.cccurl}/data/all/cccaggexchanges`, this.params).then(
      res => res.json()
    );
  },
  subs: (...parameters) => {
    return fetch(`${ccc.cccurl}/data/subs?fsym=${parameters[0]}`, this.params)
      .then(res => res.json())
      .then(res => {
        return parameters.includes(1) ? res : subReducer(res);
      });
  }
};

const groupAlphaArray = rawData => {
  let numtest = new RegExp(/[^A-Za-z]/);

  let data = rawData.reduce((r, e) => {
    let group = e.charAt(0).toUpperCase();
    numtest.test(group) ? (group = "0-9") : group;
    !r[group] ?
      (r[group] = {
        group,
        children: [e]
      }) :
      r[group].children.push(e);
    return r;
  }, {});
  return Object.values(data);
};

function showImage(list) {
  let fragment = document.createDocumentFragment();
  let container = document.getElementById("container");
  list.forEach(function (element) {
    let imgElem = document.createElement("img");
    fragment.appendChild(imgElem);
    imgElem.classList = "grid-item zoomInUp animated";
    imgElem.id = `${element[0]}`;
    imgElem.style.height = "100px";
    imgElem.style.width = "100px";
    imgElem.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    imgElem.alt = `${element[0]}`;
    imgElem.setAttribute("data-src", element[1]);
  });
  container.appendChild(fragment);
  myLazyLoad = new LazyLoad({
    container: container
  });
}

const toggleSetVal = async (set, val) => {
  if (set !== undefined) {
    set.has(val) ? set.delete(val) : set.add(val);
  }
};

function promiseMap(xs, f) {
  const reducer = (ysAcc$, x) =>
    ysAcc$.then(ysAcc =>
      f(x).then(y => {
        ysAcc[x] = y;
        return ysAcc;
      })
    );
  return xs.reduce(reducer, Promise.resolve({}));
}

function RateLimit(fn, delay, context) {
  let queue = [],
    timer = null;

  function processQueue() {
    let item = queue.shift();
    if (item) fn.apply(item.context, item.arguments);
    if (queue.length === 0) clearInterval(timer), (timer = null);
  }

  return function limited() {
    queue.push({
      context: context || this,
      arguments: [].slice.call(arguments)
    });
    if (!timer) {
      processQueue(); // start immediately on the first invocation
      timer = setInterval(processQueue, delay);
    }
  };
}

function bigImg() {
  let container = document.getElementById("container");
  container.innerHTML = "";
  showImage(unique(Array.from(ccc.appInfo.imageUrls)));
}
const union = (setA, setB) => {
  let _union = new Set(setA);
  for (let elem of setB) {
    _union.add(elem);
  }
  return _union;
};

const unique = arr => [...new Set(arr)];

const uniqueFilter = (arr, zeroTwoOrFive) => {
  return unique(arr.filter(bases => bases.split("~")[0] === zeroTwoOrFive));
};
const reducer = (a, c) =>
  Array.isArray(c) || (typeof c === "object" && c !== null) ? [...a, ...c] : [...a, c];

const subReducer = res => {
  let vals = Object.values(res);
  vals[0] !== "Error" ?
    (vals = vals
      .flat()
      .map(y => {
        return Object.values(y).reduce(reducer);
      })
      .reduce(reducer)) :
    (vals = []);
  console.log("vals reduce: ", vals);
  return vals;
};
const chunkArray = async (myArray, chunk_size) => {
  let results = [];
  while (myArray.length) {
    results.push(myArray.splice(0, chunk_size));
  }
  return results;
};

const cccaggOrCustom = () => {
  if (ccc.appInfo.aggSubs !== undefined) {
    if (
      ccc.appInfo.aggSubs.size < ccc.appInfo.allSubs.size &&
      ccc.appInfo.aggSubs.size !== 0
    ) {
      updateOutput(2);
    } else {
      updateOutput(5);
    }
  }
};

const fsym = coin =>
  ccc.subs(coin).then(res => {
    if (res.length !== 0) {
      let menus = unique(makeMenus(res));
      ccc.appInfo.globalmenu = menus;
      ccc.appInfo.aggSubs = new Set(ccc.appInfo.globalmenu[4]);
      ccc.appInfo.allSubs = new Set(ccc.appInfo.globalmenu[4]);
      ccc.appInfo.pair = [coin, "???"];
      fillMenu(menus[1], "tsym");
      console.log(filtertest(menus[1]));
      myLazyLoad.update();
      updateOutput(5);
    } else {
      ccc.init(true);
    }
  });

const tsym = coin => {
  filteredExs = unique(
    ccc.appInfo.globalmenu[2]
    .filter(x => x.match(coin))
    .filter(x => x.includes("2~"))
    .map(exchanges => exchanges.split("~")[1])
  ).sort();
  ccc.appInfo.aggSubs = new Set(filteredExs);
  ccc.appInfo.allSubs = new Set(filteredExs);
  ccc.appInfo.pair[1] = coin;
  updateOutput(5);
};

const fillMenu = (list, selector) => {
  let subsSelect = document.getElementById(selector);
  subsSelect.innerHTML = "";
  let fragment = document.createDocumentFragment();
  list.sort();
  list.unshift("Select...");
  list.map(function (element) {
    let opt = document.createElement("option");
    opt.value = element;
    opt.innerHTML = element;
    fragment.appendChild(opt);
  });
  subsSelect.appendChild(fragment);
};

const makeMenus = res => {
  let exs5 = uniqueFilter(res, "5");
  let exs2 = uniqueFilter(res, "2")
    .map(exchanges => exchanges.split("~")[1])
    .sort();
  let exs0 = uniqueFilter(res, "0").map(exchanges => exchanges.split("~")[1]);

  let menus = [
    res[0].split("~")[2],
    unique(res.map(bases => bases.split("~")[3])),
    res,
    exs5,
    exs2,
    exs0
  ];
  return menus;
};

function filtertest(list) {
  document.querySelectorAll("#container>img").forEach(imageEl => {
    //console.log(list.indexOf(imageEl.id));
    return list.indexOf(imageEl.id) === -1 ?
      imageEl.classList.add("hide") :
      imageEl.classList.remove("hide");
  });
}

const isChecked = lineEl => {
  return ccc.appInfo.aggSubs.has(lineEl) ? "checked" : "";
};
const markupList = (lineEls, typeOf, delimiter = "") => {
  let exchangemarkup = `<ul>
    ${lineEls
      .map(
        lineEl =>
          `<li class='exchange-item'>

            <input type = "checkbox"
            class="exchange-checkbox"
            name = "${lineEl}"
            value ="${lineEl}" 
            ${isChecked(lineEl)}>
            ${lineEl}
            </li>`
      )
      .join(delimiter)}
    </ul>`;

  let subscriptionmarkup = `<ul>
    ${lineEls
      .map(
        lineEl =>
          `<li class='subItem'>
            ${typeOf}~${lineEl}~${ccc.appInfo.pair[0]}~${
            ccc.appInfo.pair[1]
          }</li>`
      )
      .join(delimiter)}
    </ul>`;

  return typeOf === "exchange" ? exchangemarkup : subscriptionmarkup;
};

const updateOutput = (twoOrFive = 0) => {
  if (twoOrFive === 5) {
    document.getElementById("wsoutput2").innerHTML = `<ul><li>5~CCCAGG~${
      ccc.appInfo.pair[0]
    }~${ccc.appInfo.pair[1]}</li></ul>`;
  } else {
    document.getElementById("wsoutput2").innerHTML = markupList(
      Array.from(ccc.appInfo.aggSubs).filter(x => x !== "Select..."),
      twoOrFive
    );
  }
  document.getElementById("exchanges").innerHTML = markupList(
    Array.from(ccc.appInfo.allSubs).filter(
      x => x !== ("Select..." || "CCCAGG")
    ),
    "exchange"
  );
};

const createSubscriptionStrings = () => {
  ccc.appInfo.actualSubs = new Set();
  ccc.appInfo.actualSubs = union(ccc.appInfo.actualSubs, ccc.appInfo.aggSubs);
  ccc.appInfo.actualSubs = Array.from(ccc.appInfo.actualSubs).reduce((a, c) => {
    a.push(`2~${c}~${ccc.appInfo.pair[0]}~${ccc.appInfo.pair[1]}`);
    return a;
  }, []);
  return ccc.appInfo.actualSubs.length === ccc.appInfo.allSubs.size ?
    (ccc.appInfo.actualSubs = [
      `5~CCCAGG~${ccc.appInfo.pair[0]}~${ccc.appInfo.pair[1]}`
    ]) :
    ccc.appInfo.actualSubs;
};

document.addEventListener("change", function () {
  if (event.target instanceof HTMLSelectElement) {
    if (event.target.id === "fsym") {
      fsym(event.target.value);
    }
    if (event.target.id === "tsym") {
      tsym(event.target.value);
    }
  }
});

document.addEventListener("mouseup", function () {
  event.target instanceof HTMLInputElement &&
    event.target.getAttribute("type") == "checkbox" ?
    toggleSetVal(ccc.appInfo.aggSubs, event.target.value).then(
      cccaggOrCustom()
    ) :
    console.log("other mouse up, not a checkbox!");

  if (event.target.classList.contains("exchange-item")) {
    console.log(event.target.querySelector(".exchange-checkbox").checked);
  }
  if (event.target.classList.contains("subscribe")) {
    if (ccc.appInfo.actualSubs.length > 0) {
      removeSubs(ccc.appInfo.actualSubs);
    }
    createSubscriptionStrings();

    addSubs(ccc.appInfo.actualSubs);
  }
  if (event.target.classList.contains("addsub")) {
    
    createSubscriptionStrings();

    addSubs(ccc.appInfo.actualSubs);
  }
  if (event.target.classList.contains("unsubscribe")) {
   
      removeSubs(ccc.appInfo.actualSubs);
    

  }
});

let socket = io.connect("wss://streamer.cryptocompare.com/");

const addSubs = subsArr => {
  socket.emit("SubAdd", {
    subs: subsArr
  });
};
const removeSubs = subsArr => {
  socket.emit("SubRemove", {
    subs: subsArr
  });
};
socket.on("m", function (message) {
  console.log(message);
});
const preLoaded = () => console.log("I'm loaded")
ccc.init();