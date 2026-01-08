import React, { useEffect, useState } from 'react';
import { AppUser } from '../types';
import { db } from '../db';

const AdminPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    await db.syncUsers(); // Ensure fresh list from server
    const u = await db.getUsers();
    setUsers(u);
  };

  useEffect(() => { refresh(); }, []);

  const startCreate = () => setEditing({ id: '', username: '', password: '', role: 'user', createdAt: Date.now() });

  const save = async () => {
    if (!editing) return;
    try {
      if (!editing.username || !editing.password) throw new Error('Provide username and password');
      if (!editing.id) {
        await db.addUser({ username: editing.username.trim(), password: editing.password, role: editing.role });
      } else {
        await db.updateUser(editing.id, { username: editing.username.trim(), password: editing.password, role: editing.role });
      }
      setEditing(null);
      refresh();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await db.deleteUser(id);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black">Administration</h2>
        <div>
          <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold">Sign out</button>
        </div>
      </div>

      <div className="mb-6">
        <button onClick={startCreate} className="px-4 py-2 bg-accent text-white rounded-xl font-bold">Create user</button>
      </div>

      {editing && (
        <div className="mb-6 p-6 bg-white dark:bg-slate-900 rounded-2xl">
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="grid grid-cols-3 gap-4">
            <input value={editing.username} onChange={e => setEditing({ ...editing, username: e.target.value })} placeholder="Username" className="p-3 border rounded-lg col-span-1" />
            <input type="password" value={editing.password} onChange={e => setEditing({ ...editing, password: e.target.value })} placeholder="Password" className="p-3 border rounded-lg col-span-1" />
            <select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value as any })} className="p-3 border rounded-lg col-span-1">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mt-4 flex space-x-2">
            <button onClick={save} className="px-4 py-2 bg-accent text-white rounded-xl font-bold">Save</button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 bg-slate-200 rounded-xl font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between">
            <div>
              <div className="font-bold">{u.username} <span className="text-xs text-slate-400">{u.role}</span></div>
              <div className="text-[11px] text-slate-400">Created: {new Date(u.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setEditing(u)} className="px-3 py-2 bg-slate-100 rounded-lg">Edit</button>
              <button onClick={() => remove(u.id)} className="px-3 py-2 bg-red-600 text-white rounded-lg">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
