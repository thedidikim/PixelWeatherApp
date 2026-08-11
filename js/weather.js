$(document).ready(function () {
    // Use browser's geolocation services to retrieve user's coordinates
    $("#location-button").click(function () {
        // Check if browser support geolocation
        if (!navigator.geolocation) {
            $("#status").text("Error: Geolocation not supported by this browser.");
            return;
        }

        // Inform the user that the browser is requesting their location
        $("#status").text("Retrieving your location...");

        // Request user's current location
        navigator.geolocation.getCurrentPosition(
            function (position) {
                // Get latitude and longitude provided by browser
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;

                // Place coordinates into input fields
                $("#latitude").val(latitude);
                $("#longitude").val(longitude);

                // Inform the users that their location was successfully retrieved
                $("#status").text("Location retrieved. Run Forecast to continue...");
            },

            function (error) {
                // Display error if location request fails
                if (error.code === error.PERMISSION_DENIED) {
                    $("#status").text("Error: Location permission denied.");
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    $("#status").text("Error: Your location could not be determined.");
                } else if (error.code === error.TIMEOUT) {
                    $("#status").text("Error: Location request timed out.");
                } else {
                    $("#status").text("Error: Unable to retrieve your location.");
                }
            }

        );
    });

    // Run the forecast search when user submits form
    $("#weather-form").submit(function (event) {
        // Prevent browser from reloading page when form is submitted
        event.preventDefault();

        // Get coordinates entered by user
        var latitude = $("#latitude").val();
        var longitude = $("#longitude").val();

        // Assemble URL for NWS coordinates endpoint
        var pointsUrl = `https://api.weather.gov/points/${latitude},${longitude}`;

        // Change status display to reflect that coordinates were sent
        $("#status").text("Retrieving Forecast...");
        $("#forecast").empty();

        // First REST API call to NWS to grid info using latitude and longitude
        $.ajax({
            url: pointsUrl,
            method: "GET",
            dataType: "json",

            success: function (data) {
                // Save grid location based on coordinates
                var gridId = data.properties.gridId;
                var gridX = data.properties.gridX;
                var gridY = data.properties.gridY;

                // Save city and state data and display above forecast results
                var city = data.properties.relativeLocation.properties.city;
                var state = data.properties.relativeLocation.properties.state;
                var locationName = city + ", " + state;

                // Assemble URL for NWS forecast endpoint
                var forecastUrl = `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`;

                // Second REST API call to NWS to get forecast info using coordinates URL
                $.ajax({
                    url: forecastUrl,
                    method: "GET",
                    dataType: "json",

                    success: function (forecastData) {
                        periods = forecastData.properties.periods;

                        // Change status display to reflect successful request and append location name
                        $("#status").html("Forecast Retrieved for:<br>" + locationName);

                        // Display first three forecast periods with weather icons, temperature, and wind
                        for (let i = 0; i < 3; i++) {
                            const period = periods[i];
                            var forecastCard = `
                                <article class="forecast-card">
                                    <h3>${period.name}</h3>
                                    <img src="${period.icon}" alt="${period.shortForecast}">
                                    <div class="temperature">
                                        ${period.temperature}º${period.temperatureUnit}
                                    </div>
                                    <p>
                                        ${period.shortForecast}
                                    </p>
                                    <p>
                                        Wind: ${period.windDirection} ${period.windSpeed}
                                    </p>
                                </article>
                            `;

                            $("#forecast").append(forecastCard);
                        }
                    },

                    error: function (xhr, status, error) {
                        console.error("Forecast request failed.");
                        console.error(status);
                        console.error(error);

                        $("#status").text("Error: Unable to retrieve forecast.");
                    }
                })
            },

            error: function (xhr, status, error) {
                console.error("Coordinates request failed.");
                console.error(status);
                console.error(error);

                $("#status").text("Error: Unable to locate forecast location.");
            }
        });
    });
});