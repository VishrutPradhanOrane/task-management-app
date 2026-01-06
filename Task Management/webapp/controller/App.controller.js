sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("taskmanagement.webapp.controller.App", {
		onInit: function () {
			var that = this;
			// Store reference to App container for router
			this._oApp = this.byId("app");
			
			// Wait for router to be initialized and App to be ready
			setTimeout(function() {
				// Check if user is already logged in
				var sCurrentUser = sessionStorage.getItem("currentUser");
				if (sCurrentUser) {
					// User is logged in, navigate to task list
					var oRouter = that.getOwnerComponent().getRouter();
					if (oRouter) {
						try {
							oRouter.navTo("taskList", {}, true);
						} catch (e) {
							// Fallback to direct navigation
							if (window.location.pathname.includes("index.html")) {
								window.location.hash = "#/tasks";
							} else {
								window.location.href = "index.html#/tasks";
							}
						}
					}
				}
			}, 200);
		},
		
		onAfterRendering: function() {
			// App is fully rendered, router should be ready now
			this._oApp = this.byId("app");
		}
	});
});

