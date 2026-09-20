import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Input";
import { InkVoltageLockup } from "../../components/brand/InkVoltageLockup";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("joyeeta@blogcms.test");
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
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-paper-100/85 transition hover:border-rust-400 hover:text-rust-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Home
        </Link>
        <div className="mb-6 flex justify-center">
          <InkVoltageLockup className="h-auto w-full max-w-[22rem] object-contain" height={72} />
        </div>
        <form onSubmit={onSubmit} className="rounded-[2rem] bg-ink-900 p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-rust-400">Staff entrance</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">Sign in to the CMS</h1>
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
          <p className="mt-4 text-xs text-paper-100/50">Local default: joyeeta@blogcms.test / password — change this outside development.</p>
        </form>
      </div>
    </div>
  );
}
