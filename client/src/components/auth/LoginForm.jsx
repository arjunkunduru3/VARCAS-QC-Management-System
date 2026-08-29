import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../common/Input";
import Button from "../common/Button";

function LoginForm() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!username || !password || !role) {
      setError("Please enter username, password and select a role.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          role,
        }),
      });

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (!data.success) {
        setError(data.message);
        return;
      }

      // Save logged-in user information
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to the correct dashboard
      if (data.user.role === "worker") {
        navigate("/worker");
      } else if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "supervisor") {
        navigate("/supervisor");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "380px",
        background: "white",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 0 15px rgba(0,0,0,0.2)",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "5px",
        }}
      >
        VARCAS AUTOMOBILES
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "gray",
          marginBottom: "25px",
        }}
      >
        QC Management System
      </p>

      <label>Username</label>

      <Input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label>Password</label>

      <Input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <p
        style={{
          marginTop: "15px",
          marginBottom: "10px",
        }}
      >
        <b>Login As</b>
      </p>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <input
            type="radio"
            name="role"
            value="worker"
            checked={role === "worker"}
            onChange={(e) => setRole(e.target.value)}
          />{" "}
          Worker
        </label>

        <br />

        <label>
          <input
            type="radio"
            name="role"
            value="admin"
            checked={role === "admin"}
            onChange={(e) => setRole(e.target.value)}
          />{" "}
          Admin
        </label>

        <br />

        <label>
          <input
            type="radio"
            name="role"
            value="supervisor"
            checked={role === "supervisor"}
            onChange={(e) => setRole(e.target.value)}
          />{" "}
          Supervisor
        </label>
      </div>

      {error && (
        <p
          style={{
            color: "red",
            marginBottom: "15px",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}

      <Button
        text={loading ? "Logging in..." : "Login"}
        onClick={handleLogin}
      />

      <p
        style={{
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/signup")}
          style={{
            border: "none",
            background: "none",
            color: "#007bff",
            cursor: "pointer",
            padding: 0,
            fontSize: "inherit",
            textDecoration: "underline",
          }}
        >
          Sign Up
        </button>
      </p>
    </div>
  );
}

export default LoginForm;
