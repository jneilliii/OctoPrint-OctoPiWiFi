# coding=utf-8
from __future__ import absolute_import
import octoprint.plugin
import os
import flask
import subprocess


class OctopiwifiPlugin(octoprint.plugin.SettingsPlugin,
                       octoprint.plugin.AssetPlugin,
                       octoprint.plugin.TemplatePlugin,
                       octoprint.plugin.SimpleApiPlugin,
                       ):

    # ~~ SettingsPlugin mixin

    def get_settings_defaults(self):
        return {
            # put your plugin's default settings here
        }

    # ~~ SimpleApiPlugin

    def is_api_adminonly(self):
        return True

    def get_api_commands(self):
        return {'create_nm_connection': ["ssid", "wifi_key"], 'set_ap_host_mode': [], 'set_ap_client_mode': ["ssid"],
                'update_wpa': ["wpa_key"]}

    def on_api_get(self, request):
        return flask.jsonify(available_networks=self.scan_wifi_networks())

    def on_api_command(self, command, data):
        if command == "create_nm_connection":
            return self.create_nm_connection(data["ssid"], data["wifi_key"])
        elif command == "set_ap_host_mode":
            return self.set_ap_host_mode()
        elif command == "set_ap_client_mode":
            return self.set_ap_client_mode(data["ssid"])
        elif command == "update_wpa":
            return self.update_wpa(data["wpa_key"])
        else:
            return None

    # ~~ TemplatePlugin mixin

    def get_template_vars(self):
        return {"plugin_version": self._plugin_version}

    # ~~ AssetPlugin mixin

    def get_assets(self):
        return {
            "js": ["js/octopiwifi.js"]
        }

    # ~~ Functions

    def scan_wifi_networks(self):
        iwlist_raw = subprocess.Popen(["sudo", "iwlist", "scan"], stdout=subprocess.PIPE)
        ap_list, err = iwlist_raw.communicate()
        ap_array = []

        for line in ap_list.decode("utf-8").rsplit("\n"):
            if "ESSID" in line:
                ap_ssid = line[27:-1]
                if ap_ssid != "" and ap_ssid not in ap_array:
                    ap_array.append(ap_ssid)

        return ap_array

    def create_nm_connection(self, ssid, wifi_key):
        try:
            if os.path.exists(f"/etc/NetworkManager/system-connections/{ssid}.nmconnection"):
                os.system(f"sudo nmcli con delete \"{ssid}\"")

            os.system(
                f"sudo nmcli con add type wifi ifname wlan0 mode infrastructure con-name \"{ssid}\" ssid \"{ssid}\" autoconnect true")

            if wifi_key == "":
                os.system(f"sudo nmcli con modify \"{ssid}\" wifi-sec.key-mgmt none")
            else:
                os.system(f"sudo nmcli con modify \"{ssid}\" wifi-sec.key-mgmt wpa-psk")
                os.system(f"sudo nmcli con modify \"{ssid}\" wifi-sec.psk \"{wifi_key}\"")
                return flask.jsonify(success=f"Created nm connection: {ssid}")
        except exception as e:
            self._logger.error(f"Error creating nm connection: {e}")
            return flask.jsonify(error=f"Error creating nm connection: {e}")

    def set_ap_host_mode(self):
        os.system("sudo nmcli con up OctoPiWiFi")

    def set_ap_client_mode(self, ssid):
        os.system(f"sudo nmcli con up \"{ssid}\"")

    def update_wpa(self, wpa_key):
        if not wpa_key == "":
            os.system("sudo nmcli con modify OctoPiWiFi wifi-sec.key-mgmt wpa-psk")
            os.system(f"sudo nmcli con modify OctoPiWiFi wifi-sec.psk \"{wpa_key}\"")
        else:
            os.system("sudo nmcli con modify OctoPiWiFi wifi-sec.key-mgmt none")

    # ~~ Softwareupdate hook

    def get_update_information(self):
        return {
            "octopiwifi": {
                "displayName": "OctoPiWifi",
                "displayVersion": self._plugin_version,

                # version check: github repository
                "type": "github_release",
                "user": "jneilliii",
                "repo": "OctoPrint-OctoPiWifi",
                "current": self._plugin_version,

                # update method: pip
                "pip": "https://github.com/jneilliii/OctoPrint-OctoPiWifi/archive/{target_version}.zip",
            }
        }


__plugin_name__ = "OctoPiWifi"
__plugin_pythoncompat__ = ">=3,<4"  # Only Python 3


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = OctopiwifiPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
