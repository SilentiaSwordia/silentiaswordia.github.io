const monsterInput = document.getElementById("monsterInput");
const searchButton = document.getElementById("searchButton");
const monsterResult = document.getElementById("monsterResult");
const suggestionsList = document.getElementById("suggestions");
const currencyInput = document.getElementById("currencyInput");
const currencySearchButton = document.getElementById("currencySearchButton");
const currencyResult = document.getElementById("currencyResult");
const currencySuggestions = document.getElementById("currencySuggestions");
const shanaQuote = document.getElementById("shanaQuote");
const shanaAuthor = document.getElementById("shanaAuthor");
const shanaButton = document.getElementById("shanaButton");
const shanaInspPicsContainer = document.getElementById(
  "shanaInspPicsContainer",
);

let allMonsters = [];

// Fetch all monsters on page load
axios
  .get("https://www.dnd5eapi.co/api/2014/monsters")
  .then((response) => {
    allMonsters = response.data.results;
  })
  .catch((error) => {
    console.error("Error loading monster list:", error);
  });

// Handle autocomplete input
monsterInput.addEventListener("input", () => {
  const inputValue = monsterInput.value.toLowerCase();
  suggestionsList.innerHTML = "";

  if (!inputValue) {
    suggestionsList.style.display = "none";
    return;
  }

  const filteredMonsters = allMonsters
    .filter((monster) => monster.name.toLowerCase().includes(inputValue))
    .slice(0, 10); // Limit to 10 suggestions

  if (filteredMonsters.length > 0) {
    suggestionsList.style.display = "block";

    filteredMonsters.forEach((monster) => {
      const suggestionItem = document.createElement("div");
      suggestionItem.classList.add("suggestion-item");
      suggestionItem.textContent = monster.name;

      suggestionItem.addEventListener("click", () => {
        monsterInput.value = monster.name;
        suggestionsList.style.display = "none";
        searchMonster(monster.name.toLowerCase());
      });

      suggestionsList.appendChild(suggestionItem);
    });
  } else {
    suggestionsList.style.display = "none";
  }
});

// Close suggestions if clicking outside
document.addEventListener("click", (e) => {
  if (e.target !== monsterInput && e.target !== suggestionsList) {
    suggestionsList.style.display = "none";
  }
});

searchButton.addEventListener("click", () => {
  const monsterName = monsterInput.value.toLowerCase();
  if (monsterName) {
    searchMonster(monsterName);
  } else {
    monsterResult.innerHTML = "Please enter a monster name.";
  }
});

function searchMonster(monsterName) {
  monsterResult.innerHTML = "Searching...";
  suggestionsList.style.display = "none"; // Hide suggestions when searching

  const matchedMonster = allMonsters.find(
    (monster) => monster.name.toLowerCase() === monsterName,
  );

  if (matchedMonster) {
    axios
      .get(`https://www.dnd5eapi.co${matchedMonster.url}`)
      .then((monsterResponse) => {
        const monsterData = monsterResponse.data;
        const ac = monsterData.armor_class[0]?.value || "Unknown";
        const hp = `${monsterData.hit_points} (${monsterData.hit_dice})`;

        // Format speeds
        let speedStr = [];
        for (const [type, value] of Object.entries(monsterData.speed)) {
          speedStr.push(`${type} ${value}`);
        }

        // Format ability scores
        const abilities = `
              <div class="abilities">
                <div class="ability"><strong>STR:</strong> ${monsterData.strength}</div>
                <div class="ability"><strong>DEX:</strong> ${monsterData.dexterity}</div>
                <div class="ability"><strong>CON:</strong> ${monsterData.constitution}</div>
                <div class="ability"><strong>INT:</strong> ${monsterData.intelligence}</div>
                <div class="ability"><strong>WIS:</strong> ${monsterData.wisdom}</div>
                <div class="ability"><strong>CHA:</strong> ${monsterData.charisma}</div>
              </div>
            `;

        monsterResult.innerHTML = `
              <h2 class="monster-name">${monsterData.name}</h2>
              <p class="monster-meta"><em>${monsterData.size} ${monsterData.type}, ${monsterData.alignment}</em></p>
              <hr>
              <p><strong>Armor Class:</strong> ${ac}</p>
              <p><strong>Hit Points:</strong> ${hp}</p>
              <p><strong>Speed:</strong> ${speedStr.join(", ")}</p>
              <hr>
              ${abilities}
            `;
      })
      .catch((error) => {
        monsterResult.innerHTML = "Error fetching monster details.";
      });
  } else {
    monsterResult.innerHTML = "Monster not found.";
  }
}

// Currency converter

let allCurrencies = [];
let allCurrencyNames = {};

function fetchCurrencyNames() {
  axios
    .get("https://api.currencyfreaks.com/v2.0/supported-currencies")
    .then((response) => {
      const currencies = response.data.supportedCurrenciesMap;
      if (currencies) {
        allCurrencyNames = {};
        for (const code in currencies) {
          allCurrencyNames[code] = currencies[code].currencyName || code;
        }
      } else {
        allCurrencyNames = {};
      }
    })
    .catch((error) => {
      console.error("Error loading currency list:", error);
    });
}

function fetchCurrency() {
  axios
    .get(
      "https://v6.exchangerate-api.com/v6/3b9165d0e7478c2bb9bace5f/latest/USD",
    )
    .then((response) => {
      const rates = response.data.conversion_rates;
      if (rates) {
        allCurrencies = Object.keys(rates).map((code) => ({
          name: code,
          rate: rates[code],
        }));
      } else {
        allCurrencies = [];
      }
    })
    .catch((error) => {
      console.error("Error loading currency list:", error);
    });

  currencyInput.addEventListener("input", () => {
    const currencyName = currencyInput.value.toLowerCase();
    currencySuggestions.innerHTML = "";

    if (!currencyName) {
      currencySuggestions.style.display = "none";
      return;
    }

    const filteredCurrencies = allCurrencies
      .filter((currency) => currency.name.toLowerCase().includes(currencyName))
      .slice(0, 10);

    if (filteredCurrencies.length > 0) {
      currencySuggestions.style.display = "block";

      filteredCurrencies.forEach((currency) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.classList.add("currency-suggestion-item");
        suggestionItem.textContent = currency.name;

        suggestionItem.addEventListener("click", () => {
          currencyInput.value = currency.name;
          currencySuggestions.style.display = "none";
          searchCurrency(currency.name.toLowerCase());
        });
        currencySuggestions.appendChild(suggestionItem);
      });
    } else {
      currencySuggestions.style.display = "none";
    }
  });
}

currencySearchButton.addEventListener("click", () => {
  const currencyName = currencyInput.value.toLowerCase();
  if (currencyName) {
    searchCurrency(currencyName);
  } else {
    currencyResult.innerHTML = "Please enter a currency name.";
  }
});

function searchCurrency(currencyName) {
  currencyResult.innerHTML = "Searching...";
  currencySuggestions.style.display = "none";

  const matchedCurrency = allCurrencies.find(
    (currency) => currency.name.toLowerCase() === currencyName,
  );

  if (matchedCurrency) {
    const fullName =
      allCurrencyNames[matchedCurrency.name] || matchedCurrency.name;
    currencyResult.innerHTML = `
      <h2 class="currency-name">${fullName}</h2>
      <p><strong>Exchange Rate 1 USD =</strong> ${matchedCurrency.rate} ${matchedCurrency.name}</p>
    `;
  } else {
    currencyResult.innerHTML = "Currency not found.";
  }
}

fetchCurrencyNames();
fetchCurrency();

let shanaWouldLove = [];

function fetchRandomInsp() {
  // dummyjson is much more stable and has proper CORS headers for both Local & GitHub
  const quotesUrl = "https://dummyjson.com/quotes/random";

  axios
    .get(quotesUrl)
    .then((response) => {
      // DummyJSON structure is { quote: "text", author: "name" }
      shanaQuote.textContent = response.data.quote;
      shanaAuthor.textContent = "- " + response.data.author;
    })
    .catch((error) => {
      console.error("API Error, using fallback:", error);

      // HARDCODED FALLBACKS: If the internet or API dies, your site still works!
      const fallbacks = [
        {
          q: "Believe you can and you're halfway there.",
          a: "Theodore Roosevelt",
        },
        {
          q: "Your passion is waiting for your courage to catch up.",
          a: "Isabelle Lafleche",
        },
        {
          q: "The best way to predict the future is to create it.",
          a: "Abraham Lincoln",
        },
      ];
      const random = fallbacks[Math.floor(Math.random() * fallbacks.length)];

      shanaQuote.textContent = random.q;
      shanaAuthor.textContent = "- " + random.a;
    });

  // Dog API
  axios
    .get("https://dog.ceo/api/breeds/image/random")
    .then((response) => {
      shanaInspPicsContainer.innerHTML = "";
      let img = document.createElement("img");
      img.src = response.data.message;
      img.alt = "A cute dog";
      img.width = 300;
      img.height = 200;
      img.style.objectFit = "cover";
      shanaInspPicsContainer.appendChild(img);
    })
    .catch((err) => console.error("Dog API Error:", err));
}
// Fetch initial quote on page load
fetchRandomInsp();

// Fetch new quote on button click
shanaButton.addEventListener("click", fetchRandomInsp);
