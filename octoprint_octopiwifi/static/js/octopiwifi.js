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
        self.wifi_key = ko.observable();
        self.wpa_key = ko.observable();

        self.onSettingsShown = function() {
            self.processing(true);
            self.selected_SSID("");
            OctoPrint.simpleApiGet("octopiwifi").done(function(data) {
                self.processing(false);
                self.available_networks(data.available_networks);
            });
        };

        self.add_wifi = function() {
            self.processing(true);
            OctoPrint.simpleApiCommand("octopiwifi", "create_nm_connection", {
                "ssid": self.selected_SSID(),
                "wifi_key": self.wifi_key()
            }).done(function(data) {
                self.processing(false);
                console.log(data);
            });
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: OctopiwifiViewModel,
        dependencies: ["settingsViewModel" ],
        elements: ["#settings_plugin_octopiwifi"]
    });
});
