/*
 * View model for OctoPrint-OctoPiWifi
 *
 * Author: jneilliii
 * License: AGPLv3
 */
$(function() {
    function OctopiwifiViewModel(parameters) {
        var self = this;

        self.settingsViewModel = parameters[0];
        self.processing = ko.observable(false);
        self.available_networks = ko.observableArray([]);
        self.selected_SSID = ko.observable();
        self.wifi_key = ko.observable("");
        self.wpa_key = ko.observable();
        self.message = ko.observable("");

        self.onSettingsShown = function() {
            self.processing(true);
            self.selected_SSID("");
            OctoPrint.simpleApiGet("octopiwifi").done(function(data) {
                self.processing(false);
                self.available_networks(data.available_networks);
            });

            // TODO: add already saved connections as list
        };

        self.add_wifi = function() {
            self.processing(true);
            self.message("Processing...please wait");
            OctoPrint.simpleApiCommand("octopiwifi", "create_nm_connection", {
                "ssid": self.selected_SSID(),
                "wifi_key": self.wifi_key()
            }).done(function(data) {
                if (data.success) {
                    self.message(data.success);
                } else if(data.error) {
                    self.message(data.error);
                } else {
                    self.message("");
                }
                self.wifi_key("");
                setTimeout(self.message, 5000, "");
                self.processing(false);
            });
        };

        // TODO: add delete function, add manual switching function
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: OctopiwifiViewModel,
        dependencies: ["settingsViewModel" ],
        elements: ["#settings_plugin_octopiwifi"]
    });
});
