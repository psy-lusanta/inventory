import React, { useState, useEffect, useRef } from "react";
import { Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setOpen(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        const tablesRes = await fetch(`${API_URL}/api/inventory/tables`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!tablesRes.ok) return;
        const tablesData = await tablesRes.json();

        const matches = [];

        for (const table of tablesData.tables) {
          try {
            const res = await fetch(`${API_URL}/api/inventory/tables/${table.table_name}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) continue;

            const data = await res.json();
            const displayName = table.display_name || table.table_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

            data.rows.forEach(row => {
              // Check EVERY value in the row
              let matchedField = null;
              let matchedValue = null;

              Object.entries(row).forEach(([key, value]) => {
                if (value == null || typeof value !== "string") return; // Skip non-string or null

                if (value.toLowerCase().includes(query.toLowerCase())) {
                  // Found a match in this column
                  matchedField = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                  matchedValue = value;
                  return; // Can break early if you want only first match
                }
              });

              if (matchedField) {
                matches.push({
                  table_name: table.table_name,
                  table_display: displayName,
                  asset_tag: row.asset_tag || "N/A",
                  matched_field: matchedField,
                  matched_value: matchedValue,
                  status: row.status || "Unknown",
                  date: row.created_at,
                });
              }
            });
          } catch (err) {
            console.error(`Failed to search ${table.table_name}`);
          }
        }

        // Sort: exact matches first, then by date (newest)
        matches.sort((a, b) => {
          const aExact = a.matched_value.toLowerCase() === query.toLowerCase() ? -1 : 0;
          const bExact = b.matched_value.toLowerCase() === query.toLowerCase() ? -1 : 0;
          if (aExact !== bExact) return aExact - bExact;
          return new Date(b.date) - new Date(a.date);
        });

        setResults(matches.slice(0, 10)); // Limit to 10
        setOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (tableName) => {
    navigate(`/inventory/table/${tableName}`);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="flex-1 max-w-md mx-8 relative" ref={inputRef}>
      <div className="relative">
        <Search className="w-5 h-5 absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Global search (asset tag, user, etc...)"
          className="w-full pl-10 pr-12 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Dropdown Results */}
      {open && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No items found
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result.table_name)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-200/50 dark:border-slate-700/50 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {result.matched_field}: {result.matched_value}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Table: {result.table_display} • Asset: {result.asset_tag || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        result.status === "Available" ? "bg-emerald-100 text-emerald-700" :
                        result.status === "Deployed" ? "bg-blue-100 text-blue-700" :
                        result.status === "Defective" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;