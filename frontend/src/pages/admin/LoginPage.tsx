import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Input";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("superadmin@blogcms.test");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to sign in"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink-950 px-4 text-paper-50">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-[2rem] bg-ink-900 p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-rust-400">Staff entrance</p>
        <h1 className="mt-2 font-display text-4xl">Sign in to the CMS</h1>
        <div className="mt-6 space-y-4">
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="text-ink-900" />
          </Field>
          <Field label="Password">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="text-ink-900" />
          </Field>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" variant="rust" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Enter the newsroom"}
          </Button>
        </div>
        <p className="mt-4 text-xs text-paper-100/50">Local default: superadmin@blogcms.test / password — change this outside development.</p>
      </form>
    </div>
  );
}
