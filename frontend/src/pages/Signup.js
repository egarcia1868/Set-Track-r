import { BASE_URL } from "../utils/config";

import { useState } from "react";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Sign up</h2>
      <label htmlFor="email">Email</label>
      <input
        type="email"
        name="email"
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        value={email}
        required
      />
      <div className="email auth-form-error"></div>
      <label htmlFor="password">Password</label>
      <input
        type="password"
        name="password"
        onChange={(e) => {
          setPassword(e.target.value);
        }}
        value={password}
        required
      />
      <label htmlFor="passwordConfirm">Confirm Password</label>
      <input
        type="password"
        name="password"
        onChange={(e) => {
          setPassword(e.target.value);
        }}
        value={password}
        required
      />
      <div className="password auth-form-error"></div>
      <button>Sign up</button>
    </form>
  );
};

export default Signup;
