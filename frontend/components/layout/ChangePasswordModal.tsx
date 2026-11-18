"use client";

import React, { useState } from "react";
import { Sheet } from "@/components/ios/Sheet";
import { Input } from "@/components/ios/Input";
import { Button } from "@/components/ios/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/lib/api";

export const ChangePasswordModal: React.FC = () => {
  const { showPasswordModal, setMustChangePasswordModal, user, setUser } = useAuthStore();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!showPasswordModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await apiClient("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      setSuccess(true);
      if (user) {
        setUser({ ...user, must_change_password: false });
      }
      setTimeout(() => {
        setMustChangePasswordModal(false);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      isOpen={showPasswordModal}
      onClose={() => setMustChangePasswordModal(false)}
      title="Change Default Password"
    >
      <div className="space-y-4">
        <p className="text-[14px] text-ios-secondaryText">
          You are currently using the default system credentials. For security, please update your password.
        </p>

        {error && (
          <div className="p-3 rounded-control bg-ios-red/10 border border-ios-red/30 text-ios-red text-[13px]">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-control bg-ios-green/10 border border-ios-green/30 text-ios-green text-[14px] font-semibold text-center">
            Password updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setMustChangePasswordModal(false)}
              >
                Skip for now
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Sheet>
  );
};
