"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Input } from "@/components/ios/Input";
import { Button } from "@/components/ios/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, setUser, setMustChangePasswordModal } = useAuthStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showDemoCreds = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDS !== "false";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tokenData = await apiClient<{
        access_token: string;
        refresh_token: string;
        must_change_password: boolean;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setTokens(tokenData.access_token, tokenData.refresh_token);

      // Fetch user profile
      const userProfile = await apiClient<any>("/auth/me", {
        token: tokenData.access_token,
      });
      setUser(userProfile);

      if (tokenData.must_change_password) {
        setMustChangePasswordModal(true);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = () => {
    setUsername("admin");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ios-bg p-4 select-none">
      <div className="w-full max-w-sm">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-[20px] bg-ios-blue text-white mx-auto flex items-center justify-center font-bold text-[32px] shadow-lg mb-3">
            A
          </div>
          <h1 className="text-[28px] font-bold text-ios-text tracking-tight">
            ApxForge Funds
          </h1>
          <p className="text-[15px] text-ios-secondaryText mt-1">
            Quantitative Analytics & Risk Engine
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 shadow-xl border border-ios-hairline">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-control bg-ios-red/10 border border-ios-red/30 text-ios-red text-[13px] text-center font-medium">
                {error}
              </div>
            )}

            <Input
              label="Username"
              icon={<User className="w-4 h-4" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              autoFocus
            />

            <Input
              type="password"
              label="Password"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full gap-2 mt-2"
              disabled={loading}
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Seed demo chip */}
          {showDemoCreds && (
            <div className="mt-6 pt-4 border-t border-ios-hairline text-center">
              <button
                type="button"
                onClick={fillDemoCreds}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ios-secondaryBg dark:bg-white/10 text-[12px] font-semibold text-ios-secondaryText hover:text-ios-blue transition-colors ios-press"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-ios-green" />
                <span>Dev Creds: admin / admin123</span>
              </button>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-[12px] text-ios-secondaryText">
          Apple HIG Design System • Bank-Level Encryption
        </div>
      </div>
    </div>
  );
}
