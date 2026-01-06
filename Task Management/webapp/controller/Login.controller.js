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

				// Navigate to task list
				var that = this;
				var oComponent = this.getOwnerComponent();
				
				// Ensure URL includes index.html
				var sCurrentPath = window.location.pathname;
				var sBaseUrl = window.location.origin;
				var sCorrectPath = sCurrentPath;
				
				if (!sCurrentPath.endsWith("index.html")) {
					sCorrectPath = sCurrentPath.endsWith("/") 
						? sCurrentPath + "index.html" 
						: sCurrentPath.substring(0, sCurrentPath.lastIndexOf("/") + 1) + "index.html";
					window.history.replaceState(null, "", sBaseUrl + sCorrectPath);
				}
				
				// Navigate by setting hash directly - router will listen and load view
				var oRouter = oComponent.getRouter();
				
				// Ensure we're on index.html first
				if (!sCurrentPath.endsWith("index.html")) {
					window.history.replaceState(null, "", sBaseUrl + sCorrectPath);
				}
				
				// Wait for router to be ready, then set hash
				var fnSetHash = function() {
					if (oRouter || oComponent.getRouter()) {
						// Router is ready, set hash - this will trigger router's hash change listener
						window.location.hash = "#/tasks";
						
						// Also call navTo to ensure navigation happens
						var oReadyRouter = oComponent.getRouter();
						if (oReadyRouter) {
							setTimeout(function() {
								try {
									oReadyRouter.navTo("taskList", {}, true);
								} catch (e) {
									// Router will handle hash change
								}
							}, 10);
						}
						
						// Ensure URL format is maintained
						setTimeout(function() {
							var sPath = window.location.pathname;
							if (!sPath.endsWith("index.html")) {
								var sNewPath = sPath.endsWith("/") 
									? sPath + "index.html" 
									: sPath.substring(0, sPath.lastIndexOf("/") + 1) + "index.html";
								window.history.replaceState(null, "", sBaseUrl + sNewPath + window.location.hash);
							}
						}, 300);
					} else {
						// Router not ready yet, wait and try again
						setTimeout(fnSetHash, 50);
					}
				};
				
				// Start navigation
				fnSetHash();
			} else {
				MessageBox.error("Invalid username or password. Please try again.");
				oPasswordInput.setValue("");
			}
		}
	});
});

