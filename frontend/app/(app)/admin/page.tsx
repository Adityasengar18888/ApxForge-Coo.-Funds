"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Users, Cpu, Activity, Lock, AlertTriangle, 
  RotateCw, Play, CheckCircle, Database, Server, RefreshCw 
} from "lucide-react";
import { Card, Button, Input, Skeleton, Segmented } from "@/components/ios";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

interface AuditRecord {
  id: number;
  user_id: number;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface Diagnostics {
  service: string;
  version: string;
  python_version: string;
  database: {
    type: string;
    file: string;
    size_kb: number;
  };
  system_metrics: {
    process_rss_mb: number;
    cpu_usage_pct: number;
    system_ram_pct: number;
  };
  scheduler: {
    is_running: boolean;
    jobs_count: number;
    jobs: Array<{ id: string; name: string; next_run_time: string }>;
  };
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);

  const [retrainingStatus, setRetrainingStatus] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get("/admin/audit-logs");
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDiagnostics = async () => {
    try {
      const res = await api.get("/admin/diagnostics");
      setDiagnostics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetchAuditLogs();
      fetchDiagnostics();
    }
  }, [user]);

  const handleToggleUser = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/toggle-active`);
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Action failed");
    }
  };

  const handleResetPasswordFlag = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/reset-password-flag`);
      alert("Password change required flag set for user.");
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Action failed");
    }
  };

  const handleTriggerRetrain = async () => {
    setLoading(true);
    try {
      const res = await api.post("/admin/models/retrain");
      setRetrainingStatus(res.data.message);
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to trigger retraining");
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <ShieldCheck className="h-16 w-16 text-[#FF3B30] mx-auto" />
        <h2 className="text-xl font-bold">Administrative Access Required</h2>
        <p className="text-sm text-neutral-500">
          This secure console requires administrative privileges. Contact your organization administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#007AFF]" />
            Administrative Operations & Security Console
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            System health telemetry, user credentials, ML retraining pipeline, and immutable audit logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { fetchUsers(); fetchDiagnostics(); fetchAuditLogs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full md:w-96">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "users", label: "Users" },
            { value: "pipeline", label: "ML Retrain" },
            { value: "diagnostics", label: "Diagnostics" },
            { value: "audit", label: "Audit Log" },
          ]}
        />
      </div>

      {/* TAB 1: USERS */}
      {tab === "users" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#007AFF]" />
              Registered Accounts ({users.length})
            </h2>
            <span className="text-xs text-neutral-400">Role-based Access Control</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-neutral-900/60 text-neutral-500 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Active Status</th>
                  <th className="py-3 px-4 text-center">Must Change Pwd</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">{u.username}</div>
                      <div className="text-xs text-neutral-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.is_active ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.must_change_password ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> YES
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-neutral-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResetPasswordFlag(u.id)}
                      >
                        Force Pwd Reset
                      </Button>
                      <Button
                        variant={u.is_active ? "destructive" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleUser(u.id)}
                        disabled={u.id === user?.id}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: ML PIPELINE */}
      {tab === "pipeline" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-2">
              <Cpu className="h-5 w-5 text-[#007AFF]" />
              Autonomous Machine Learning Retraining Pipeline
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Executes end-to-end model retraining for the Options Pricing Engine and Directional Classifier,
              generates test-split metrics, and registers calibrated joblib artifacts into the versioned registry.
            </p>

            {retrainingStatus && (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-sm font-medium mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 shrink-0" />
                {retrainingStatus}
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleTriggerRetrain} disabled={loading} className="px-6">
                <Play className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Triggering Pipeline..." : "Retrain All Active Models"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: DIAGNOSTICS */}
      {tab === "diagnostics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <span className="text-xs font-semibold uppercase text-neutral-500">Service Process RSS</span>
              <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
                {diagnostics ? `${diagnostics.system_metrics.process_rss_mb} MB` : <Skeleton className="h-8 w-24" />}
              </h3>
              <span className="text-xs text-neutral-400 mt-1 block">Memory footprint</span>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold uppercase text-neutral-500">Database Size</span>
              <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
                {diagnostics ? `${diagnostics.database.size_kb} KB` : <Skeleton className="h-8 w-24" />}
              </h3>
              <span className="text-xs text-neutral-400 mt-1 block">{diagnostics?.database.type}</span>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold uppercase text-neutral-500">APScheduler Daemon</span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${diagnostics?.scheduler.is_running ? "bg-emerald-500" : "bg-rose-500"}`} />
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {diagnostics?.scheduler.is_running ? "ACTIVE" : "STOPPED"}
                </h3>
              </div>
              <span className="text-xs text-neutral-400 mt-1 block">
                {diagnostics?.scheduler.jobs_count} recurring tasks registered
              </span>
            </Card>
          </div>

          {diagnostics && diagnostics.scheduler.jobs.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-3">Scheduled Background Workers</h3>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {diagnostics.scheduler.jobs.map((job) => (
                  <div key={job.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{job.name}</span>
                      <span className="text-neutral-400 ml-2 font-mono">({job.id})</span>
                    </div>
                    <span className="font-mono text-neutral-500">
                      Next Run: {job.next_run_time ? new Date(job.next_run_time).toLocaleTimeString() : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {tab === "audit" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Security & Operations Audit Trail
            </h2>
            <span className="text-xs text-neutral-400">Append-Only Event Ledger</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">User ID</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                    <td className="py-2.5 px-4 text-xs font-mono text-neutral-400">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs font-mono">{log.user_id}</td>
                    <td className="py-2.5 px-4 text-xs font-mono text-neutral-400">{log.ip_address}</td>
                    <td className="py-2.5 px-4 text-xs text-neutral-600 dark:text-neutral-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

