import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../Users/userContext";
import { Camera, Save } from "lucide-react";

function Settings() {
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(
    "https://i.pravatar.cc/300"
  );
  const { user, updateAvatar } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setOriginalUsername(user.username || "");
      setAvatarPreview(user.avatar_url || "https://i.pravatar.cc/300");
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large (max 10MB)");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      let base64 = reader.result;

      if (base64.length > 8 * 1024 * 1024) {
        toast.error("Compressing large image...");
        base64 = await compressImage(base64);
      }
      setAvatarPreview(base64);

      try {
        const res = await fetch(`${API_URL}/users/me/update-avatar`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar_url: base64 }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to upload avatar");
        }

        updateAvatar(base64);

        if (data.token) {
          localStorage.setItem("token", data.token);
          window.dispatchEvent(new Event('storage'));
        }

        toast.success("Avatar updated successfully");
      } catch (err) {
        toast.error(err.message || "Failed to upload");
        setAvatarPreview(user?.avatar_url || "https://i.pravatar.cc/300");
      }
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = base64;
    });
  };

  const handleSaveProfile = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      let hasChanges = false;

      const trimmedUsername = username.trim();
      if (trimmedUsername && trimmedUsername !== originalUsername) {
        const res = await fetch(`${API_URL}/users/update-username`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: trimmedUsername }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.log("Username error response:", err);
          throw new Error(err.error || "Failed to update username");
        }
        hasChanges = true;

        const tokenRes = await fetch(`${API_URL}/auth/refresh-token`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (tokenRes.ok) {
          const { token: newToken } = await tokenRes.json();
          localStorage.setItem("token", newToken);
          window.dispatchEvent(new StorageEvent("storage"));
        } else {
          console.warn("Token refresh failed, but username updated");
        }
      }

      // Password change (unchanged)
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          toast.error("All password fields are required to change password");
          setIsSaving(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match");
          setIsSaving(false);
          return;
        }

        if (newPassword.length < 6) {
          toast.error("New password must be at least 6 characters");
          setIsSaving(false);
          return;
        }

        const res = await fetch(`${API_URL}/users/change-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to change password");
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        hasChanges = true;
        toast.success("Password changed successfully");
      }

      if (hasChanges) {
        window.location.reload();
      } else {
        toast.error("No changes made");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">
        Settings
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-8">
        {/* Avatar */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={avatarPreview}
              alt="Profile"
              className="w-32 h-32 rounded-full ring-4 ring-blue-500/20 object-cover"
            />
            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-colors">
              <Camera size={20} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Profile Picture
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Click the camera to upload a new avatar
            </p>
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-slate-700" />

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Your username"
          />
        </div>

        <div className="h-px bg-slate-200 dark:bg-slate-700" />

        {/* Change Password */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Change Password
          </h3>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
