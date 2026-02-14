const storageKey = "dcfm-data-v1";

const defaultData = {
  workOrders: [
    {
      id: crypto.randomUUID(),
      title: "CRAC Unit #3 filter replacement",
      priority: "High",
      status: "Open",
      asset: "CRAC-03",
      assignedTo: "J. Patel",
      dueDate: "2026-02-20",
      description: "Increased pressure differential detected."
    }
  ],
  maintenanceSheets: [
    {
      id: crypto.randomUUID(),
      equipment: "Generator A",
      frequency: "Monthly",
      procedureRef: "GEN-M-011",
      safetyNotes: "Lockout/Tagout before service",
      lastCompleted: "2026-01-15",
      nextDue: "2026-02-15"
    }
  ],
  parts: [
    {
      id: crypto.randomUUID(),
      partName: "MERV 13 Filter",
      partNumber: "FLT-CRAC-13",
      quantity: 6,
      minStock: 8,
      location: "Aisle 2 / Shelf B",
      vendor: "CoolAir Supplies"
    }
  ],
  orders: [
    {
      id: crypto.randomUUID(),
      poNumber: "PO-10024",
      part: "MERV 13 Filter",
      quantity: 20,
      vendor: "CoolAir Supplies",
      orderDate: "2026-02-10",
      status: "Submitted"
    }
  ],
  assets: [
    {
      id: crypto.randomUUID(),
      assetId: "UPS-A",
      assetType: "UPS",
      zone: "Power Room 1",
      condition: "Good",
      lastInspection: "2026-01-20",
      nextInspection: "2026-04-20"
    }
  ]
};

function loadData() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return structuredClone(defaultData);
  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultData), ...parsed };
  } catch {
    return structuredClone(defaultData);
  }
}

const state = loadData();

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function toRows(targetId, headers, records, fields) {
  const table = document.getElementById(targetId);
  const head = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}<th>Actions</th></tr>`;
  const body = records
    .map((row) => {
      const cols = fields
        .map((f) => {
          const value = row[f] ?? "";
          if (["status", "priority"].includes(f)) {
            return `<td><span class="badge ${String(value).replace(/\s+/g, "\\ ")}">${value}</span></td>`;
          }
          return `<td>${value}</td>`;
        })
        .join("");
      return `${cols}<td><button data-delete="${targetId}:${row.id}">Delete</button></td>`;
    })
    .map((r) => `<tr>${r}</tr>`)
    .join("");
  table.innerHTML = `<thead>${head}</thead><tbody>${body || `<tr><td colspan="${headers.length + 1}">No records.</td></tr>`}</tbody>`;
}

function renderDashboard() {
  const lowStockCount = state.parts.filter((p) => Number(p.quantity) < Number(p.minStock)).length;
  const openWorkOrders = state.workOrders.filter((w) => w.status !== "Completed").length;
  const dueMaintenance = state.maintenanceSheets.filter((m) => new Date(m.nextDue) <= new Date()).length;
  const pendingOrders = state.orders.filter((o) => !["Received", "Cancelled"].includes(o.status)).length;

  document.getElementById("dashboard").innerHTML = [
    ["Open Work Orders", openWorkOrders],
    ["Due/Overdue Maintenance", dueMaintenance],
    ["Low Stock Parts", lowStockCount],
    ["Pending Orders", pendingOrders],
    ["Tracked Assets", state.assets.length]
  ]
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function renderTables() {
  toRows(
    "workOrdersTable",
    ["Title", "Priority", "Status", "Asset", "Assigned", "Due", "Description"],
    state.workOrders,
    ["title", "priority", "status", "asset", "assignedTo", "dueDate", "description"]
  );
  toRows(
    "maintenanceTable",
    ["Equipment", "Frequency", "Procedure", "Safety", "Last Completed", "Next Due"],
    state.maintenanceSheets,
    ["equipment", "frequency", "procedureRef", "safetyNotes", "lastCompleted", "nextDue"]
  );
  toRows(
    "partsTable",
    ["Part", "Part #", "Qty", "Min", "Location", "Vendor"],
    state.parts,
    ["partName", "partNumber", "quantity", "minStock", "location", "vendor"]
  );
  toRows(
    "ordersTable",
    ["PO #", "Part", "Qty", "Vendor", "Order Date", "Status"],
    state.orders,
    ["poNumber", "part", "quantity", "vendor", "orderDate", "status"]
  );
  toRows(
    "assetsTable",
    ["Asset ID", "Type", "Zone", "Condition", "Last Inspection", "Next Inspection"],
    state.assets,
    ["assetId", "assetType", "zone", "condition", "lastInspection", "nextInspection"]
  );
}

function renderAll() {
  renderDashboard();
  renderTables();
  saveData();
}

function formToRecord(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function setupForm(formId, listKey) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const record = { id: crypto.randomUUID(), ...formToRecord(form) };
    state[listKey].unshift(record);
    form.reset();
    renderAll();
  });
}

function handleDelete(event) {
  const button = event.target.closest("button[data-delete]");
  if (!button) return;
  const [tableId, id] = button.dataset.delete.split(":");
  const map = {
    workOrdersTable: "workOrders",
    maintenanceTable: "maintenanceSheets",
    partsTable: "parts",
    ordersTable: "orders",
    assetsTable: "assets"
  };
  const key = map[tableId];
  state[key] = state[key].filter((item) => item.id !== id);
  renderAll();
}

setupForm("workOrderForm", "workOrders");
setupForm("maintenanceForm", "maintenanceSheets");
setupForm("partsForm", "parts");
setupForm("ordersForm", "orders");
setupForm("assetForm", "assets");
document.body.addEventListener("click", handleDelete);
renderAll();
