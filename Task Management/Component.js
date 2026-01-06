sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"taskmanagement/webapp/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("taskmanagement.Component", {
		metadata: {
			manifest: "json"
		},

		init: function () {
			UIComponent.prototype.init.apply(this, arguments);
			this.setModel(models.createDeviceModel(), "device");
			this.getRouter().initialize();
		}
	});
});

