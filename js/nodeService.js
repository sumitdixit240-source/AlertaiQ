// ======================
// BASE URL (CORRECT)
// ======================
const BASE = "https://alertaiq.onrender.com/api/nodes";

// ======================
// TOKEN
// ======================
function getToken() {
    const token = localStorage.getItem("token");
    console.log("🔑 TOKEN:", token);
    return token;
}

// ======================
// HANDLE AUTH ERROR
// ======================
function handleAuthError(res, data) {
    if (res.status === 401 || res.status === 403) {
        console.warn("🚨 Auth error:", res.status, data);
        localStorage.removeItem("token");
        window.location.href = "index.html";
        return true;
    }
    return false;
}

// ======================
// CREATE NODE
// ======================
async function pushNodeToCloud(node) {
    console.log("📤 Sending node:", node);

    try {
        const res = await fetch(`${BASE}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                title: node.title,
                category: node.category,
                frequency: node.frequency,
                amount: Number(node.amount),
                expiryDate: new Date(node.expiryDate).toISOString()
            })
        });

        console.log("📡 Status:", res.status);

        let data;
        try {
            data = await res.json();
        } catch {
            throw new Error("Server returned invalid JSON");
        }

        console.log("📦 Response:", data);

        if (handleAuthError(res, data)) return null;

        if (!res.ok) {
            throw new Error(data.message || data.error || "Create failed");
        }

        console.log("✅ Node created successfully");
        return data.data || data.node || data;

    } catch (err) {
        console.error("🔥 CREATE ERROR:", err);
        alert("Error: " + err.message);
        return null;
    }
}

// ======================
// GET ALL NODES
// ======================
async function getNodesFromCloud() {
    try {
        const res = await fetch(`${BASE}/all`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        console.log("📡 Fetch status:", res.status);

        let data;
        try {
            data = await res.json();
        } catch {
            throw new Error("Invalid JSON from server");
        }

        console.log("📦 Nodes:", data);

        if (handleAuthError(res, data)) return [];

        if (!res.ok) {
            console.error("❌ Fetch failed");
            return [];
        }

        return data.data || data.nodes || data.result || [];

    } catch (err) {
        console.error("🔥 FETCH ERROR:", err);
        return [];
    }
}

// ======================
// DELETE NODE
// ======================
async function deleteNodeFromCloud(id) {
    try {
        const res = await fetch(`${BASE}/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        console.log("📡 Delete status:", res.status);

        let data;
        try {
            data = await res.json();
        } catch {
            throw new Error("Invalid JSON from server");
        }

        console.log("📦 Delete response:", data);

        if (handleAuthError(res, data)) return null;

        if (!res.ok) {
            console.error("❌ Delete failed");
            return null;
        }

        console.log("🗑️ Node deleted");
        return data.success ? true : data;

    } catch (err) {
        console.error("🔥 DELETE ERROR:", err);
        return null;
    }
}
