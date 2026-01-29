import { useState, useEffect } from "react";

export default function EditUserModal({ user, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    employee_name: "",
    username: "",
    role: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        employee_name: user.employee_name,
        username: user.username,
        role: user.role,
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update user");
      const updatedUser = await res.json();
      onSave(updatedUser);
    } catch (err) {
      console.error(err);
      alert("Error updating user");
    }
  };

  const handleResetPassword = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/users/${user.id}/reset-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: "lxpassword" }),
        }
      );
      if (!res.ok) throw new Error("Failed to reset password");
      alert("Password reset to lxpassword");
    } catch (err) {
      console.error(err);
      alert("Error resetting password");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96">
        <h2 className="text-lg font-semibold mb-4">Edit User</h2>

        <input
          type="text"
          name="employee_name"
          placeholder="Name"
          value={formData.employee_name}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
        >
          <option value="administrator">Administrator</option>
          <option value="viewer">Viewer</option>
        </select>

        <button
          onClick={handleResetPassword}
          className="w-full bg-yellow-500 text-white py-2 rounded mb-3 cursor-pointer"
        >
          Change to Default Password
        </button>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
