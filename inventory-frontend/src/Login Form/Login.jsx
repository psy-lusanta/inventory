import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("http://localhost:5000/auth/login", {
      username,
      password,
    });
    
    localStorage.setItem("token", res.data.token);
    
    window.dispatchEvent(new StorageEvent("storage", { key: "token" }));
    window.dispatchEvent(new CustomEvent("tokenUpdated"));  

    navigate("/dashboard");
  } catch (err) {
    setError("Invalid username or password");
  }
};

  return (
    <>
      <div id="form-ui">
        <form action="" method="post" id="form" onSubmit={handleSubmit}>
          <div id="form-body">
            <div id="welcome-lines">
              <div id="welcome-line-1">Inventory</div>
              <div id="welcome-line-2">ICT Department</div>
            </div>
            <div id="input-area">
              <div className="form-inp">
                <input
                  placeholder="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-inp">
                <input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div id="submit-button-cvr">
              <button id="submit-button" type="submit">
                Login
              </button>
            </div>
          </div>
          <div className="error-msg">
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        </form>
      </div>
    </>
  );
}

export default Login;
