"use client";

import React, { useState } from "react";
import { User, Shield, Key, AlertTriangle, CheckCircle, LogOut } from "lucide-react";
import { Card, Button, Input } from "@/components/ios";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await api.post("/auth/change-password", {
        old_password: currentPassword,
        new_password: newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully! Security flag cleared." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (user) {
        setUser({ ...user, must_change_password: false });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Failed to update password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
          <User className="h-8 w-8 text-[#007AFF]" />
          Account Profile & Credentials
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Identity authentication, role capabilities, and security access management
        </p>
      </div>

      {/* Security Alert if must change password */}
      {user?.must_change_password && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <p className="font-semibold text-sm mb-0.5">Default Administrative Password Active</p>
            You are operating with the seeded default password. Update your password below to enhance system integrity and dismiss startup alerts.
          </div>
        </Card>
      )}

      {/* Profile Details */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#007AFF]" />
          User Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase text-neutral-500">Username</span>
            <p className="text-base font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">
              {user?.username || "admin"}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-neutral-500">Email</span>
            <p className="text-base font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">
              {user?.email || "admin@apxforge.local"}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-neutral-500">Role & Privileges</span>
            <div className="mt-1">
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 uppercase">
                {user?.role || "ADMIN"}
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-neutral-500">Session Status</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                JWT Authenticated (Local Secure Cookie)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password Card */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Key className="h-4 w-4 text-[#007AFF]" />
          Change Password
        </h2>

        {message && (
          <div className={`p-3 rounded-xl mb-4 text-xs font-medium flex items-center gap-2 ${
            message.type === "success" 
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" 
              : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
          }`}>
            {message.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase">New Password (min 8 chars)</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Session Management */}
      <div className="pt-4 flex justify-end">
        <Button variant="destructive" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Log Out Session
        </Button>
      </div>
    </div>
  );
}
