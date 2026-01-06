sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox"
], function (Controller, MessageBox) {
	"use strict";

	return Controller.extend("taskmanagement.webapp.controller.Login", {
		onInit: function () {
			// Mock users data
			this._aUsers = [
				{ username: "manager", password: "manager123", role: "Manager", name: "John Manager" },
				{ username: "admin", password: "admin123", role: "Administrator", name: "Admin User" },
				{ username: "user1", password: "user123", role: "User", name: "Sarah Johnson" },
				{ username: "user2", password: "user123", role: "User", name: "Mike Davis" }
			];
		},

		onUsernameChange: function (oEvent) {
			this._validateInputs();
		},

		onPasswordChange: function (oEvent) {
			this._validateInputs();
		},

		_validateInputs: function () {
			var oUsernameInput = this.byId("usernameInput");
			var oPasswordInput = this.byId("passwordInput");
			var oLoginButton = this.byId("loginButton");
			
			var sUsername = oUsernameInput.getValue();
			var sPassword = oPasswordInput.getValue();
			
			oLoginButton.setEnabled(sUsername.length > 0 && sPassword.length > 0);
		},

		onLogin: function (oEvent) {
			var oUsernameInput = this.byId("usernameInput");
			var oPasswordInput = this.byId("passwordInput");
			
			var sUsername = oUsernameInput.getValue().trim();
			var sPassword = oPasswordInput.getValue();
			
			if (!sUsername || !sPassword) {
				MessageBox.error("Please enter both username and password");
				return;
			}

			// Find user in mock data
			var oUser = this._aUsers.find(function (u) {
				return u.username === sUsername && u.password === sPassword;
			});

			if (oUser) {
				// Store user info in session storage
				sessionStorage.setItem("currentUser", JSON.stringify({
					username: oUser.username,
					name: oUser.name,
					role: oUser.role
				}));

				// Navigate to task list using full page navigation
				// This ensures the router processes the hash on page load
				var sCurrentPath = window.location.pathname;
				var sBaseUrl = window.location.origin;
				var sCorrectPath = sCurrentPath;
				
				if (!sCurrentPath.endsWith("index.html")) {
					sCorrectPath = sCurrentPath.endsWith("/") 
						? sCurrentPath + "index.html" 
						: sCurrentPath.substring(0, sCurrentPath.lastIndexOf("/") + 1) + "index.html";
				}
				
				// Use full page navigation - router will process hash on load
				window.location.href = sBaseUrl + sCorrectPath + "#/tasks";
			} else {
				MessageBox.error("Invalid username or password. Please try again.");
				oPasswordInput.setValue("");
			}
		}
	});
});

