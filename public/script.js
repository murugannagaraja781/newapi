async function calculateChart() {
    const data = {
        year: parseInt(document.getElementById('year').value),
        month: parseInt(document.getElementById('month').value),
        day: parseInt(document.getElementById('day').value),
        hour: parseInt(document.getElementById('hour').value),
        minute: parseInt(document.getElementById('minute').value),
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        timezone: parseFloat(document.getElementById('timezone').value)
    };

    const resultElement = document.getElementById('result-json');

    try {
        const response = await fetch('/api/charts/birth-chart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const jsonResponse = await response.json();
        const result = jsonResponse.data;

        resultElement.textContent = JSON.stringify(jsonResponse, null, 2);
        resultElement.style.display = 'block';

        const signsTa = {
            "Aries": "மேஷம்", "Taurus": "ரிஷபம்", "Gemini": "மிதுனம்", "Cancer": "கடகம்",
            "Leo": "சிம்மம்", "Virgo": "கன்னி", "Libra": "துலாம்", "Scorpio": "விருச்சிகம்",
            "Sagittarius": "தனுசு", "Capricorn": "மகரம்", "Aquarius": "கும்பம்", "Pisces": "மீனம்"
        };

        const planetsTa = {
            "Sun": "சூரியன்", "Moon": "சந்திரன்", "Mars": "செவ்வாய்", "Mercury": "புதன்",
            "Jupiter": "குரு", "Venus": "சுக்கிரன்", "Saturn": "சனி", "Rahu": "ராகு", "Ketu": "கேது"
        };

        const planetSymbols = {
            "Sun": "☉", "Moon": "☾", "Mars": "♂", "Mercury": "☿",
            "Jupiter": "♃", "Venus": "♀", "Saturn": "♄", "Rahu": "☊", "Ketu": "☋"
        };

        document.getElementById('chart-display').style.display = 'block';
        document.getElementById('panchangam-display').style.display = 'block';
        document.getElementById('dasha-display').style.display = 'block';

        const dStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
        const tStr = `${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}`;
        document.getElementById('center-details').innerHTML = `${dStr}<br>${tStr}`;
        document.getElementById('nav-center-details').innerHTML = `${dStr}<br>${tStr}`;

        // Panchangam display
        if (result.panchangam) {
            document.querySelector('#p-vara .p-value').textContent = result.panchangam.vara || "--";
            document.querySelector('#p-tithi .p-value').textContent = result.panchangam.tithi || "--";
            document.querySelector('#p-nakshatra .p-value').textContent = result.panchangam.nakshatra || "--";
            document.querySelector('#p-yoga .p-value').textContent = result.panchangam.yoga || "--";
            document.querySelector('#p-karana .p-value').textContent = result.panchangam.karana || "--";
        }

        // Dasha display
        if (result.dasha && result.dasha.sequence) {
            // Display Dasha info
            const dashaInfo = document.getElementById('dasha-info');
            if (dashaInfo) {
                dashaInfo.innerHTML = `
                    <strong>Current Dasha:</strong> ${result.dasha.currentLord} (${result.dasha.currentNakshatraTamil})<br>
                    <strong>Moon Longitude:</strong> ${result.dasha.moonLongitude}°<br>
                    <strong>Nakshatra:</strong> ${result.dasha.currentNakshatra} (#${result.dasha.nakshatraIndex + 1})<br>
                    <strong>Degree in Nakshatra:</strong> ${result.dasha.degreeInNakshatra}° (${result.dasha.percentageInNakshatra}%)<br>
                    <strong>Years Elapsed in Current Dasha:</strong> ${result.dasha.yearsElapsedInCurrentDasha}<br>
                    <strong>Remaining Years in Current Dasha:</strong> ${result.dasha.remainingYearsInCurrentDasha}
                `;
            }

            const dashaTableBody = document.querySelector('#dasha-table tbody');
            dashaTableBody.innerHTML = '';

            result.dasha.sequence.forEach(dasha => {
                const row = document.createElement('tr');
                const startDate = new Date(dasha.startDate).toLocaleDateString('en-IN');
                const endDate = new Date(dasha.endDate).toLocaleDateString('en-IN');
                const rowStyle = dasha.isActive ? 'background:#fff3e0;' : '';

                row.innerHTML = `
                    <td style="padding:12px; border-bottom:1px solid #eee; ${rowStyle}">${dasha.lord}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee; ${rowStyle}">${dasha.startYear.toFixed(2)}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee; ${rowStyle}">${dasha.endYear.toFixed(2)}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee; ${rowStyle}">${dasha.duration.toFixed(2)} years</td>
                    <td style="padding:12px; border-bottom:1px solid #eee; ${rowStyle}">${startDate}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee; ${rowStyle}">${endDate}</td>
                `;
                dashaTableBody.appendChild(row);
            });
        }

        // Planets table
        const tableBody = document.querySelector('#planets-table tbody');
        if (tableBody) tableBody.innerHTML = '';

        if (result.rawPlanets) {
            Object.keys(result.rawPlanets).forEach(pKey => {
                const planetData = result.rawPlanets[pKey];
                const pNameTa = planetsTa[pKey] || pKey;
                const signTa = signsTa[planetData.sign] || planetData.sign;
                const pDegreeFormatted = planetData.degreeFormatted || (planetData.degree + "°");
                const houseNum = planetData.house;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="planet-name-cell">${pNameTa}</td>
                    <td>${signTa}</td>
                    <td>${pDegreeFormatted}</td>
                    <td><span class="badge-house">${houseNum}</span></td>
                `;
                tableBody.appendChild(row);
            });
        }

        // ===== RASI CHART (D1) =====
        document.querySelectorAll('#rasi-grid .rasi-box .planets').forEach(el => el.innerHTML = '');

        if (result.rasi && Array.isArray(result.rasi)) {
            result.rasi.forEach(house => {
                const signName = house.sign;
                const box = document.getElementById(`sign-${signName}`);
                if (!box) return;

                if (house.planets && Array.isArray(house.planets)) {
                    house.planets.forEach(planetName => {
                        const planetData = result.rawPlanets[planetName];
                        if (!planetData) return;

                        const pNameTa = planetsTa[planetName] || planetName;
                        const pSymbol = planetSymbols[planetName] || '';
                        const pDegree = planetData.degreeFormatted || planetData.degree + '°';
                        appendPlanetToBox(box, pSymbol, pNameTa, pDegree);
                    });
                }
            });
        }

        // ===== NAVAMSA CHART (D9) =====
        document.querySelectorAll('#navamsa-grid .rasi-box .planets').forEach(el => el.innerHTML = '');

        if (result.navamsa && result.navamsa.houses && Array.isArray(result.navamsa.houses)) {
            result.navamsa.houses.forEach(house => {
                const signName = house.sign;
                const box = document.getElementById(`nav-sign-${signName}`);
                if (!box) return;

                if (house.planets && Array.isArray(house.planets)) {
                    house.planets.forEach(planetName => {
                        const pNameTa = planetsTa[planetName] || planetName;
                        const pSymbol = planetSymbols[planetName] || '';
                        appendPlanetToBox(box, pSymbol, pNameTa, '');
                    });
                }
            });
        }

        function appendPlanetToBox(container, symbol, name, degree) {
            const pDiv = document.createElement('div');
            pDiv.className = 'planet-block';
            pDiv.innerHTML = `
                <div class="planet-header">
                    <span class="p-symbol">${symbol}</span>
                    <span class="p-name">${name}</span>
                </div>
                <span class="p-degree">${degree}</span>
            `;
            const planetsContainer = container.querySelector('.planets');
            if (planetsContainer) {
                planetsContainer.appendChild(pDiv);
            }
        }

    } catch (error) {
        console.error('Error:', error);
        resultElement.textContent = 'Error: ' + error.message;
        resultElement.style.display = 'block';
    }
}
