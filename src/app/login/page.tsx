import { signIn, signUp } from "./actions";

export default function Login({ searchParams }: { searchParams: { mode?: string; error?: string } }) {
  const up = searchParams.mode === "signup";
  return (
    <div className="cust"><main className="wrap stack">
      <h1>{up ? "Create your account" : "Sign in"}</h1>
      {searchParams.error && <p className="err" role="alert">{searchParams.error}</p>}
      <form action={up ? signUp : signIn} className="stack">
        {up && <input name="full_name" placeholder="Full name" required />}
        <input name="email" type="email" placeholder="Institute email" autoComplete="email" required />
        <input name="password" type="password" placeholder="Password, 8+ characters" minLength={8} autoComplete={up ? "new-password" : "current-password"} required />
        <button className="btn">{up ? "Create account" : "Sign in"}</button>
      </form>
      <a href={up ? "/login" : "/login?mode=signup"}>{up ? "I already have an account" : "New here? Create an account"}</a>
    </main></div>
  );
}
