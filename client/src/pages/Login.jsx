import LoginForm from "../components/auth/LoginForm";

function Login() {
  return (
    <div
      style={{
        background: "#f4f6f8",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LoginForm />
    </div>
  );
}

export default Login;
