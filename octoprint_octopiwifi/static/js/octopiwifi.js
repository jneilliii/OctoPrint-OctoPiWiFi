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
        self.saved_connections = ko.observableArray([]);
        self.selected_SSID = ko.observable();
        self.wifi_key = ko.observable("");
        self.wpa_key = ko.observable();
        self.message = ko.observable("");
        self.action_message = ko.observable("");

        self.onSettingsShown = function() {
            self.selected_SSID("");
            self.refresh_networks();
            self.refresh_saved_connections();
        };

        self.refresh_networks = function() {
            self.processing(true);
            self.message("Processing...please wait");
            OctoPrint.simpleApiGet("octopiwifi", {'data': {'scan_wifi_networks': true}}).done(function(data) {
                self.processing(false);
                self.message("");
                self.available_networks(data.available_networks);
            });
        };

        self.refresh_saved_connections = function() {
            self.processing(true);
            self.message("Processing...please wait");
            OctoPrint.simpleApiGet("octopiwifi", {'data': {'list_nm_connections': true}}).done(function(data) {
                self.processing(false);
                self.message("");
                self.saved_connections(data.saved_connections);
            });
        };

        self.add_wifi = function() {
            self.processing(true);
            self.action_message("Processing...please wait");
            OctoPrint.simpleApiCommand("octopiwifi", "create_nm_connection", {
                "ssid": self.selected_SSID(),
                "wifi_key": self.wifi_key()
            }).done(function(data) {
                self.processing(false);
                if (data.success) {
                    self.action_message(data.success);
                    setTimeout(self.action_message, 5000, "");
                    self.refresh_saved_connections();
                } else if(data.error) {
                    self.action_message(data.error);
                } else {
                    self.action_message("");
                }
                self.wifi_key("");
            });
        };

        self.remove_wifi = function(ssid) {
            self.processing(true);
            self.action_message("Processing...please wait");
            OctoPrint.simpleApiCommand("octopiwifi", "delete_nm_connection", {
                "ssid": ssid
            }).done(function(data) {
                self.processing(false);
                if (data.success) {
                    self.action_message(data.success);
                    setTimeout(self.action_message, 5000, "");
                    self.refresh_saved_connections();
                } else if(data.error) {
                    self.action_message(data.error);
                } else {
                    self.action_message("");
                }
            });
        };

        self.activate_wifi = function(ssid) {
            self.processing(true);
            self.action_message("Enabling "+ssid+"...please wait");
            OctoPrint.simpleApiCommand("octopiwifi", "set_ap_client_mode", {
                "ssid": ssid
            }).done(function(data) {
                self.processing(false);
                if (data.success) {
                    self.action_message(data.success);
                    setTimeout(self.action_message, 5000, "");
                    self.refresh_saved_connections();
                } else if(data.error) {
                    self.action_message(data.error);
                } else {
                    self.action_message("");
                }
            });
        };

        self.onWizardDetails = function(response){
            self.onSettingsShown();
            $("#wizard_plugin_octopiwifi_link").insertAfter("#wizard_firstrun_start_link");
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: OctopiwifiViewModel,
        dependencies: ["settingsViewModel", "wizardViewModel"],
        elements: ["#settings_plugin_octopiwifi", "#wizard_plugin_octopiwifi"]
    });
});
