import {
  View,
  UserStar,
  User,
  Search,
  Edit3,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import AddUser from "./addusers";
import EditUser from "./edituser";
import DeleteUserButton from "./deleteuser";

function AllUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rolesFilter, setRolesFilter] = useState("");
  const [users, setUsers] = useState([]);

  //for Editing Users
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found, please login first");
      return;
    }

    fetch("http://localhost:5000/users", {
      headers: {
        Authorization: `Bearer ${token}`, //send token
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or server error");
        return res.json();
      })
      .then((user) => setUsers(user))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const formatRole = (role) => {
    if (!role) return "";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const ROLES = ["Administrator", "Viewer"];

  // Filtering
  const filteredData = useMemo(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (rolesFilter) {
      filtered = filtered.filter(
        (row) => row.role?.toLowerCase() === rolesFilter
      );
    }

    return filtered;
  }, [users, searchTerm, rolesFilter]);

  //HANDLES ADDING USERS
  const addUser = (user) => {
    setUsers((prevUsers) => [...prevUsers, user]);
  };

  //HANDLES EDITING USERS
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSave = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  //HANDLES DELETING USERS
  const handleDelete = (id) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
  };

  const getColorRoles = (roles) => {
    const colorsRoles = {
      Administrator: "bg-blue-100 text-blue-800",
      Viewer: "bg-purple-100 text-purple-800",
    };
    return colorsRoles[formatRole(roles)] || "bg-gray-100 text-gray-800";
  };

  //pagination logic here if needed
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;
  const paginatedUsers = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Employees</h2>
              <p className="text-indigo-100 text-sm">Manage Roles</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-white">
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
              <User size={16} />
              <span className="font-semibold">{filteredData.length}</span>
              <span className="text-indigo-100">Total</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
              <View size={16} />
              <span className="font-semibold">
                {
                  filteredData.filter(
                    (row) => formatRole(row.role) === "Viewer"
                  ).length
                }
              </span>
              <span className="text-indigo-100">Viewer</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
              <UserStar size={16} />
              <span className="font-semibold">
                {
                  filteredData.filter(
                    (row) => formatRole(row.role) === "Administrator"
                  ).length
                }
              </span>
              <span className="text-indigo-100">Administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center gap-3">
            <AddUser onAdd={addUser} />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Users"
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 w-full sm:w-80 bg-white shadow-md"
              />
            </div>
            <div className="relative">
              <Filter
                size={18}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <select
                value={rolesFilter}
                onChange={(e) => setRolesFilter(e.target.value)}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 w-full sm:w-80 bg-white shadow-md"
              >
                <option value="">All Roles</option>
                {ROLES.map((role) => (
                  <option key={role} value={role.toLowerCase()}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              <th className="px-8 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider align-middle">
                Name
              </th>
              <th className="px-8 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider align-middle">
                Username
              </th>
              <th className="px-8 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider align-middle">
                Roles
              </th>
              <th className="px-8 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider align-middle">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/100"
                  }`}
                >
                  <td className="px-8 py-4 text-center align-middle">
                    {row.employee_name}
                  </td>
                  <td className="px-8 py-4 text-center align-middle">
                    {row.username}
                  </td>
                  <td className="px-8 py-4 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getColorRoles(
                          formatRole(row.role)
                        )}`}
                      >
                        {formatRole(row.role)}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center align-middle">
                    <button
                      className="p-2 text-purple-500 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                      onClick={() => handleEditClick(row)}
                    >
                      <Edit3 size={16} />
                    </button>
                    {/*DELETE USER BUTTON*/}
                    <DeleteUserButton row={row} onDelete={handleDelete} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">
                  {filteredData.length === 0 && (
                    <div className="text-center py-16">
                      <div className="text-gray-400 mb-4">
                        <User size={64} className="mx-auto mb-4" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        No Employees Found
                      </h3>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <EditUser
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/*Footer*/}
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
          <div className="text-sm text-gray-600">
            Showing <span>{filteredData.length}</span> of{" "}
            <span className="font-semibold">{users.length}</span> Employees
          </div>
          {/* Right side */}
          <div className="flex items-center space-x-2 mt-4 lg:mt-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded-lg text-sm ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-gray-600 text-sm">
              Page {currentPage} of{" "}
              {Math.ceil(filteredData.length / rowsPerPage)}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  prev < Math.ceil(filteredData.length / rowsPerPage)
                    ? prev + 1
                    : prev
                )
              }
              disabled={
                currentPage === Math.ceil(filteredData.length / rowsPerPage)
              }
              className={`px-2 py-1 rounded-lg text-sm ${
                currentPage === Math.ceil(filteredData.length / rowsPerPage)
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllUsers;
