sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel"
], function (Controller, Fragment, MessageBox, JSONModel) {
	"use strict";

	return Controller.extend("taskmanagement.webapp.controller.TaskList", {
		onInit: function () {
			// Check authentication
			var sCurrentUser = sessionStorage.getItem("currentUser");
			if (!sCurrentUser) {
				// Not logged in, redirect to login
				this.getOwnerComponent().getRouter().navTo("login", {}, true);
				return;
			}

			// Set user model
			var oUser = JSON.parse(sCurrentUser);
			this.getView().setModel(new JSONModel(oUser), "user");

			// Get tasks model - try multiple sources
			var oTasksModel = this.getView().getModel("tasks");
			if (!oTasksModel) {
				oTasksModel = this.getOwnerComponent().getModel("tasks");
			}
			
			if (!oTasksModel || !oTasksModel.getData()) {
				// Model not available, load it manually
				var that = this;
				var oModel = new JSONModel("webapp/model/tasks.json");
				oModel.attachRequestCompleted(function () {
					that._initializeTasks(oModel);
				});
				oModel.attachRequestFailed(function () {
					// If loading fails, use empty array
					var oEmptyModel = new JSONModel({ Tasks: [] });
					that._initializeTasks(oEmptyModel);
				});
				this.getView().setModel(oModel, "tasks");
				return;
			}
			
			this._initializeTasks(oTasksModel);
		},

		_initializeTasks: function (oTasksModel) {
			this._aTasks = oTasksModel.getData().Tasks || [];
			this._oFilteredTasks = new JSONModel({
				Tasks: this._aTasks
			});
			this.getView().setModel(this._oFilteredTasks, "tasks");
			
			// Statistics model
			this._updateStatistics();
			
			// Selected count model
			this.getView().setModel(new JSONModel({ selectedCount: 0 }), "selected");
			
			this._sCurrentFilter = "all";
			this._sSearchQuery = "";
			this._sAssigneeFilter = "all";
			this._sCategoryFilter = "all";
			this._sSortBy = "dueDate";
			
			this._populateFilterDropdowns();
			this._updateHighPriorityTasks();
		},

		_updateHighPriorityTasks: function () {
			var aHighPriority = this._aTasks.filter(function (oTask) {
				return oTask.priority === "High" && oTask.status !== "Completed";
			}).slice(0, 5); // Show max 5 high priority tasks
			
			var oHighPriorityModel = new JSONModel({
				Tasks: aHighPriority
			});
			this.getView().setModel(oHighPriorityModel, "highPriority");
		},

		_updateStatistics: function () {
			var iTotal = this._aTasks.length;
			var iPending = this._aTasks.filter(function (t) { return t.status === "Pending"; }).length;
			var iInProgress = this._aTasks.filter(function (t) { return t.status === "In Progress"; }).length;
			var iCompleted = this._aTasks.filter(function (t) { return t.status === "Completed"; }).length;
			var iOverdue = this._aTasks.filter(function (t) {
				if (!t.dueDate || t.status === "Completed") return false;
				var oDueDate = new Date(t.dueDate);
				var oToday = new Date();
				oToday.setHours(0, 0, 0, 0);
				return oDueDate < oToday;
			}).length;

			var iCompletionRate = iTotal > 0 ? Math.round((iCompleted / iTotal) * 100) : 0;
			
			var oStatsModel = new JSONModel({
				total: iTotal,
				pending: iPending,
				inProgress: iInProgress,
				completed: iCompleted,
				overdue: iOverdue,
				completionRate: iCompletionRate
			});
			this.getView().setModel(oStatsModel, "stats");
		},

		_populateFilterDropdowns: function () {
			// Get unique assignees
			var aAssignees = [];
			this._aTasks.forEach(function (oTask) {
				if (aAssignees.indexOf(oTask.assignee) === -1) {
					aAssignees.push(oTask.assignee);
				}
			});
			aAssignees.sort();

			// Get unique categories
			var aCategories = [];
			this._aTasks.forEach(function (oTask) {
				if (oTask.category && aCategories.indexOf(oTask.category) === -1) {
					aCategories.push(oTask.category);
				}
			});
			aCategories.sort();

			// Populate assignee filter
			var oAssigneeSelect = this.byId("assigneeFilter");
			aAssignees.forEach(function (sAssignee) {
				oAssigneeSelect.addItem(new sap.ui.core.Item({
					key: sAssignee,
					text: sAssignee
				}));
			});

			// Populate category filter
			var oCategorySelect = this.byId("categoryFilter");
			aCategories.forEach(function (sCategory) {
				oCategorySelect.addItem(new sap.ui.core.Item({
					key: sCategory,
					text: sCategory
				}));
			});
		},

		formatPriorityState: function (sPriority) {
			switch (sPriority) {
				case "High":
					return "Error";
				case "Medium":
					return "Warning";
				case "Low":
					return "Success";
				default:
					return "None";
			}
		},

		formatStatusState: function (sStatus) {
			switch (sStatus) {
				case "Completed":
					return "Success";
				case "In Progress":
					return "Information";
				case "Pending":
					return "Warning";
				default:
					return "None";
			}
		},

		formatDate: function (sDate) {
			if (!sDate) return "";
			var oDate = new Date(sDate);
			return oDate.toLocaleDateString();
		},

		isOverdue: function (sDate) {
			if (!sDate) return false;
			var oDueDate = new Date(sDate);
			var oToday = new Date();
			oToday.setHours(0, 0, 0, 0);
			return oDueDate < oToday;
		},

		onSearch: function (oEvent) {
			this._sSearchQuery = oEvent.getSource().getValue().toLowerCase();
			this._applyFilters();
		},

		onFilterChange: function (oEvent) {
			this._sCurrentFilter = oEvent.getSource().getSelectedKey();
			this._applyFilters();
		},

		onAssigneeFilterChange: function (oEvent) {
			this._sAssigneeFilter = oEvent.getSource().getSelectedKey();
			this._applyFilters();
		},

		onCategoryFilterChange: function (oEvent) {
			this._sCategoryFilter = oEvent.getSource().getSelectedKey();
			this._applyFilters();
		},

		onSortChange: function (oEvent) {
			this._sSortBy = oEvent.getSource().getSelectedKey();
			this._applyFilters();
		},

		_applyFilters: function () {
			var aFiltered = this._aTasks.filter(function (oTask) {
				// Status filter
				var bStatusMatch = this._sCurrentFilter === "all" || oTask.status === this._sCurrentFilter;
				
				// Search filter
				var bSearchMatch = !this._sSearchQuery || 
					oTask.title.toLowerCase().indexOf(this._sSearchQuery) !== -1 ||
					oTask.description.toLowerCase().indexOf(this._sSearchQuery) !== -1 ||
					oTask.assignee.toLowerCase().indexOf(this._sSearchQuery) !== -1 ||
					(oTask.category && oTask.category.toLowerCase().indexOf(this._sSearchQuery) !== -1);
				
				// Assignee filter
				var bAssigneeMatch = this._sAssigneeFilter === "all" || oTask.assignee === this._sAssigneeFilter;
				
				// Category filter
				var bCategoryMatch = this._sCategoryFilter === "all" || oTask.category === this._sCategoryFilter;
				
				return bStatusMatch && bSearchMatch && bAssigneeMatch && bCategoryMatch;
			}.bind(this));

			// Apply sorting
			aFiltered.sort(function (a, b) {
				switch (this._sSortBy) {
					case "dueDate":
						var aDate = a.dueDate ? new Date(a.dueDate) : new Date(0);
						var bDate = b.dueDate ? new Date(b.dueDate) : new Date(0);
						return aDate - bDate;
					case "priority":
						var aPriority = a.priority === "High" ? 3 : (a.priority === "Medium" ? 2 : 1);
						var bPriority = b.priority === "High" ? 3 : (b.priority === "Medium" ? 2 : 1);
						return bPriority - aPriority;
					case "status":
						return a.status.localeCompare(b.status);
					case "assignee":
						return a.assignee.localeCompare(b.assignee);
					case "title":
						return a.title.localeCompare(b.title);
					default:
						return 0;
				}
			}.bind(this));

			this._oFilteredTasks.setData({ Tasks: aFiltered });
			this._updateStatistics();
			this._updateHighPriorityTasks();
		},

		onSelectionChange: function (oEvent) {
			var aSelectedItems = oEvent.getSource().getSelectedItems();
			this.getView().getModel("selected").setProperty("/selectedCount", aSelectedItems.length);
		},

		onBulkDelete: function () {
			var oTable = this.byId("tasksTable");
			var aSelectedItems = oTable.getSelectedItems();
			
			if (aSelectedItems.length === 0) {
				MessageBox.warning("Please select at least one task to delete");
				return;
			}

			MessageBox.confirm(
				"Are you sure you want to delete " + aSelectedItems.length + " task(s)?",
				{
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.YES) {
							var aSelectedIds = aSelectedItems.map(function (oItem) {
								return oItem.getBindingContext("tasks").getObject().id;
							});
							
							this._aTasks = this._aTasks.filter(function (oTask) {
								return aSelectedIds.indexOf(oTask.id) === -1;
							});
							
							this._applyFilters();
							this._updateHighPriorityTasks();
							oTable.removeSelections();
							this.getView().getModel("selected").setProperty("/selectedCount", 0);
							MessageBox.success(aSelectedItems.length + " task(s) deleted successfully");
						}
					}.bind(this)
				}
			);
		},

		onBulkStatusChange: function () {
			var oTable = this.byId("tasksTable");
			var aSelectedItems = oTable.getSelectedItems();
			
			if (aSelectedItems.length === 0) {
				MessageBox.warning("Please select at least one task");
				return;
			}

			this._openBulkStatusDialog(aSelectedItems);
		},

		_openBulkStatusDialog: function (aSelectedItems) {
			var sFragmentName = "taskmanagement.webapp.view.BulkStatusDialog";
			
			if (!this._oBulkStatusDialog) {
				Fragment.load({
					id: this.getView().getId(),
					name: sFragmentName,
					controller: this
				}).then(function (oDialog) {
					this._oBulkStatusDialog = oDialog;
					this.getView().addDependent(this._oBulkStatusDialog);
					this._oBulkStatusDialog.open();
					this._aSelectedItemsForBulk = aSelectedItems;
				}.bind(this));
			} else {
				this._oBulkStatusDialog.open();
				this._aSelectedItemsForBulk = aSelectedItems;
			}
		},

		onBulkStatusSave: function () {
			var oSelect = Fragment.byId(this.getView().getId(), "bulkStatusSelect");
			var sNewStatus = oSelect.getSelectedKey();
			
			if (!sNewStatus) {
				MessageBox.warning("Please select a status");
				return;
			}

			var aSelectedIds = this._aSelectedItemsForBulk.map(function (oItem) {
				return oItem.getBindingContext("tasks").getObject().id;
			});

			this._aTasks.forEach(function (oTask) {
				if (aSelectedIds.indexOf(oTask.id) !== -1) {
					oTask.status = sNewStatus;
				}
			});

			this._applyFilters();
			this._updateHighPriorityTasks();
			var oTable = this.byId("tasksTable");
			oTable.removeSelections();
			this.getView().getModel("selected").setProperty("/selectedCount", 0);
			this._oBulkStatusDialog.close();
			MessageBox.success("Status updated for " + aSelectedIds.length + " task(s)");
		},

		onBulkStatusCancel: function () {
			this._oBulkStatusDialog.close();
		},

		onExportCSV: function () {
			var aTasks = this._oFilteredTasks.getData().Tasks;
			if (aTasks.length === 0) {
				MessageBox.warning("No tasks to export");
				return;
			}

			var sCSV = "Title,Description,Category,Assignee,Priority,Status,Due Date,Created Date\n";
			aTasks.forEach(function (oTask) {
				sCSV += '"' + (oTask.title || "").replace(/"/g, '""') + '",';
				sCSV += '"' + (oTask.description || "").replace(/"/g, '""') + '",';
				sCSV += '"' + (oTask.category || "") + '",';
				sCSV += '"' + (oTask.assignee || "") + '",';
				sCSV += '"' + (oTask.priority || "") + '",';
				sCSV += '"' + (oTask.status || "") + '",';
				sCSV += '"' + (oTask.dueDate || "") + '",';
				sCSV += '"' + (oTask.createdDate || "") + '"\n';
			});

			var sBlob = new Blob([sCSV], { type: "text/csv;charset=utf-8;" });
			var sLink = document.createElement("a");
			var sUrl = URL.createObjectURL(sBlob);
			sLink.setAttribute("href", sUrl);
			sLink.setAttribute("download", "tasks_" + new Date().toISOString().split('T')[0] + ".csv");
			sLink.style.visibility = "hidden";
			document.body.appendChild(sLink);
			sLink.click();
			document.body.removeChild(sLink);
			
			MessageBox.success("Tasks exported successfully");
		},

		onAddTask: function () {
			this._openTaskDialog(null);
		},

		onEditTask: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("tasks");
			if (oContext) {
				var oTask = oContext.getObject();
				this._openTaskDialog(oTask);
			}
		},

		onDeleteTask: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("tasks");
			if (oContext) {
				var oTask = oContext.getObject();
				MessageBox.confirm(
					"Are you sure you want to delete the task \"" + oTask.title + "\"?",
					{
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						onClose: function (sAction) {
							if (sAction === MessageBox.Action.YES) {
								var iIndex = this._aTasks.findIndex(function (t) {
									return t.id === oTask.id;
								});
								if (iIndex !== -1) {
									this._aTasks.splice(iIndex, 1);
									this._applyFilters();
									this._updateHighPriorityTasks();
									MessageBox.success("Task deleted successfully");
								}
							}
						}.bind(this)
					}
				);
			}
		},

		onTaskSelect: function (oEvent) {
			// Can be used for navigation or detail view
		},

		_openTaskDialog: function (oTask) {
			var sFragmentName = "taskmanagement.webapp.view.TaskDialog";
			
			if (!this._oDialog) {
				Fragment.load({
					id: this.getView().getId(),
					name: sFragmentName,
					controller: this
				}).then(function (oDialog) {
					this._oDialog = oDialog;
					this.getView().addDependent(this._oDialog);
					this._populateDialog(oTask);
					this._oDialog.open();
				}.bind(this));
			} else {
				this._populateDialog(oTask);
				this._oDialog.open();
			}
		},

		_populateDialog: function (oTask) {
			var oModel = new JSONModel({
				task: oTask ? Object.assign({}, oTask) : {
					id: (this._aTasks.length + 1).toString(),
					title: "",
					description: "",
					assignee: "",
					status: "Pending",
					priority: "Medium",
					category: "",
					dueDate: "",
					createdDate: new Date().toISOString().split('T')[0]
				},
				isEdit: !!oTask
			});
			this._oDialog.setModel(oModel, "taskModel");
		},

		onSaveTask: function () {
			var oModel = this._oDialog.getModel("taskModel");
			var oTask = oModel.getData().task;
			
			// Validation
			if (!oTask.title || !oTask.assignee || !oTask.dueDate) {
				MessageBox.error("Please fill in all required fields (Title, Assignee, Due Date)");
				return;
			}

			if (oModel.getData().isEdit) {
				// Update existing task
				var iIndex = this._aTasks.findIndex(function (t) {
					return t.id === oTask.id;
				});
				if (iIndex !== -1) {
					this._aTasks[iIndex] = oTask;
				}
			} else {
				// Add new task
				oTask.id = (Math.max.apply(null, this._aTasks.map(function (t) {
					return parseInt(t.id);
				})) + 1).toString();
				this._aTasks.push(oTask);
			}

			this._applyFilters();
			this._populateFilterDropdowns();
			this._updateHighPriorityTasks();
			this._oDialog.close();
			MessageBox.success(oModel.getData().isEdit ? "Task updated successfully" : "Task created successfully");
		},

		onCancelTask: function () {
			this._oDialog.close();
		},

		onRefresh: function () {
			this._applyFilters();
			this._updateStatistics();
			MessageBox.success("View refreshed");
		},

		onTaskItemPress: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("highPriority");
			if (oContext) {
				var oTask = oContext.getObject();
				// Find the task in the main tasks array to edit
				var oMainTask = this._aTasks.find(function (t) {
					return t.id === oTask.id;
				});
				if (oMainTask) {
					this._openTaskDialog(oMainTask);
				}
			}
		},

		onLogout: function () {
			sessionStorage.removeItem("currentUser");
			var oRouter = this.getOwnerComponent().getRouter();
			if (oRouter) {
				try {
					oRouter.navTo("login", {}, true);
				} catch (e) {
					// Fallback to direct navigation
					window.location.href = "index.html";
				}
			} else {
				window.location.href = "index.html";
			}
		}
	});
});
