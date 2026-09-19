import { FormEvent, useEffect, useState } from "react";
import { roleService, userService } from "../../services/admin";
import type { Role, User } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Pagination } from "../../components/ui/Pagination";

export function UsersPage() {
  const { push } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", role_id: "", status: "active" });

  async function load() {
    const result = await userService.list({ page });
    setUsers(result.items);
    setLastPage(result.meta.last_page);
  }

  useEffect(() => {
    roleService.list().then(setRoles).catch(() => undefined);
  }, []);

  useEffect(() => {
    load().catch((error) => push(getErrorMessage(error), "error"));
  }, [page]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await userService.save({ ...form, role_id: Number(form.role_id) });
      setForm({ name: "", email: "", password: "", role_id: "", status: "active" });
      push("User created");
      await load();
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <Card>
        <h1 className="mb-4 font-display text-3xl">Create user</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
          <Field label="Role">
            <Select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} required>
              <option value="">Select role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </Select>
          </Field>
          <Button type="submit">Create</Button>
        </form>
      </Card>
      <div>
        <h2 className="mb-4 font-display text-3xl">Users</h2>
        <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-ink-800 dark:bg-ink-900">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500">
              <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-zinc-100 dark:border-ink-800">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.role?.name}</td>
                  <td className="p-3">
                    <Button variant="ghost" onClick={() => userService.destroy(user.id).then(() => { push("Deleted"); load(); })}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} lastPage={lastPage} onChange={setPage} />
      </div>
    </div>
  );
}
