import { useEffect, useState } from "react";
import { roleService } from "../../services/admin";
import type { Role } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function RolesPage() {
  const { push } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    roleService.list().then(setRoles).catch((error) => push(getErrorMessage(error), "error"));
  }, [push]);

  const allPermissions = Array.from(new Map(roles.flatMap((role) => role.permissions || []).map((permission) => [permission.id, permission])).values());

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl sm:text-4xl">Roles & permissions</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role) => {
          const selected = new Set(role.permissions?.map((permission) => permission.id));
          return (
            <Card key={role.id}>
              <h2 className="font-display text-2xl">{role.name}</h2>
              <div className="mt-3 space-y-2">
                {allPermissions.map((permission) => (
                  <label key={permission.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.has(permission.id)}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(permission.id);
                        else next.delete(permission.id);
                        setRoles((current) =>
                          current.map((item) =>
                            item.id === role.id
                              ? { ...item, permissions: allPermissions.filter((entry) => next.has(entry.id)) }
                              : item,
                          ),
                        );
                      }}
                    />
                    {permission.name}
                  </label>
                ))}
              </div>
              <Button
                className="mt-4"
                onClick={() =>
                  roleService
                    .updatePermissions(role.id, role.permissions?.map((permission) => permission.id) || [])
                    .then(() => push("Permissions updated"))
                    .catch((error) => push(getErrorMessage(error), "error"))
                }
              >
                Save role
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
