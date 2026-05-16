// DOM Elements
const menuBtn = document.getElementById('menu-btn');
const settingsMenu = document.getElementById('settings-menu');
const searchView = document.getElementById('search-view');
const weatherView = document.getElementById('weather-view');
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const searchLoading = document.getElementById('search-loading');
const resultsList = document.getElementById('results-list');
const backBtn = document.getElementById('back-btn');

// Weather View Elements
const locationNameEl = document.getElementById('location-name');
const temperatureEl = document.getElementById('temperature');
const weatherDescriptionEl = document.getElementById('weather-description');
const outfitTextEl = document.getElementById('outfit-text');

// Toggle Menu
menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
    if (!settingsMenu.classList.contains('hidden')) {
        settingsMenu.classList.add('hidden');
    }
});

settingsMenu.addEventListener('click', (e) => e.stopPropagation());

// Search Logic
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function handleSearch() {
    const query = cityInput.value.trim();
    if (!query) return;

    resultsList.innerHTML = '';
    searchLoading.classList.remove('hidden');

    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
        const data = await response.json();

        searchLoading.classList.add('hidden');

        if (!data.results || data.results.length === 0) {
            resultsList.innerHTML = '<li><span class="result-name">No locations found.</span></li>';
            return;
        }

        data.results.forEach(location => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="result-name">${location.name}</span>
                <span class="result-admin">${location.admin1 ? location.admin1 + ', ' : ''}${location.country}</span>
            `;
            li.addEventListener('click', () => fetchWeather(location));
            resultsList.appendChild(li);
        });
    } catch (error) {
        searchLoading.classList.add('hidden');
        resultsList.innerHTML = '<li><span class="result-name">Error fetching locations.</span></li>';
    }
}

// Weather Fetching Logic
async function fetchWeather(location) {
    // Switch view
    searchView.classList.remove('active');
    setTimeout(() => {
        searchView.classList.add('hidden');
        weatherView.classList.remove('hidden');
        weatherView.classList.add('active');
    }, 400);

    locationNameEl.textContent = location.name;
    temperatureEl.textContent = '--';
    weatherDescriptionEl.textContent = 'Loading...';
    outfitTextEl.textContent = '--';

    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code`);
        const data = await response.json();

        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;

        temperatureEl.textContent = temp;
        updateWeatherUI(temp, code);
    } catch (error) {
        weatherDescriptionEl.textContent = 'Error loading weather data.';
    }
}

// UI Updating (Mood & Outfit)
function updateWeatherUI(temp, code) {
    const { mood, description, conditionMod } = interpretWeatherCode(code);
    
    // Set Mood Class on body
    document.body.className = `mood-${mood}`;
    
    // Set Text
    weatherDescriptionEl.textContent = description;
    
    // Determine Outfit
    let outfit = '';
    if (temp > 25) {
        outfit = "Wear a t-shirt, shorts, and sunglasses.";
    } else if (temp >= 18) {
        outfit = "Wear a light shirt and comfortable pants.";
    } else if (temp >= 10) {
        outfit = "Wear a light jacket and comfortable shoes.";
    } else {
        outfit = "Wear a heavy coat, sweater, and warm pants.";
    }

    if (conditionMod === 'rain') {
        outfit += " Take an umbrella or wear a raincoat.";
    } else if (conditionMod === 'snow') {
        outfit += " Make sure to wear a scarf and gloves.";
    }

    outfitTextEl.textContent = outfit;
}

// WMO Code Interpretation
function interpretWeatherCode(code) {
    let mood = 'default';
    let description = 'Unknown';
    let conditionMod = null;

    // Sunny / Clear
    if (code === 0 || code === 1) {
        mood = 'sunny';
        description = code === 0 ? 'Clear sky' : 'Mainly clear';
    } 
    // Cloudy
    else if ([2, 3, 45, 48].includes(code)) {
        mood = 'cloudy';
        if (code === 2) description = 'Partly cloudy';
        else if (code === 3) description = 'Overcast';
        else description = 'Fog';
    }
    // Rainy
    else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
        mood = 'rainy';
        conditionMod = 'rain';
        if ([51, 53, 55].includes(code)) description = 'Drizzle';
        else if ([80, 81, 82].includes(code)) description = 'Rain showers';
        else description = 'Rain';
    }
    // Cold / Snow
    else if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
        mood = 'cold';
        conditionMod = 'snow';
        if ([56, 57].includes(code)) description = 'Freezing drizzle';
        else if ([66, 67].includes(code)) description = 'Freezing rain';
        else if ([85, 86].includes(code)) description = 'Snow showers';
        else description = 'Snow';
    }
    // Storm
    else if ([95, 96, 99].includes(code)) {
        mood = 'storm';
        conditionMod = 'rain';
        description = 'Thunderstorm';
    }

    return { mood, description, conditionMod };
}

// Back Button Logic
backBtn.addEventListener('click', () => {
    weatherView.classList.remove('active');
    setTimeout(() => {
        weatherView.classList.add('hidden');
        searchView.classList.remove('hidden');
        searchView.classList.add('active');
        // Reset body class to default
        document.body.className = 'mood-default';
        cityInput.value = '';
        resultsList.innerHTML = '';
    }, 400);
});
