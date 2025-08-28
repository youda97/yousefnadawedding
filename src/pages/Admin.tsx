import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_BASE_URL || ''

type Row = {
  id: string
  fullName: string
  rsvpStatus: 'yes' | 'no' | null
  updatedAt: string
  household: string
}

type Summary = {
  totalGuests: number
  households: number
  yes: number
  no: number
  pending: number
}

export default function Admin() {
  const [authed, setAuthed] = useState<boolean>(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'yes' | 'no' | 'pending'>('all')
  const [loading, setLoading] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      setLoginError('Wrong password.')
      return
    }
    setAuthed(true)
    await loadData()
  }

  async function loadData() {
    setLoading(true)
    const s = await fetch(`${API}/api/admin/summary`, {
      credentials: 'include',
    })
    const g = await fetch(
      `${API}/api/admin/guests?status=${status}&search=${encodeURIComponent(
        search
      )}`,
      {
        credentials: 'include',
      }
    )
    if (s.ok) setSummary(await s.json())
    if (g.ok) setRows(await g.json())
    setLoading(false)
  }

  useEffect(() => {
    if (authed) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  useEffect(() => {
    if (authed) {
      const t = setTimeout(() => loadData(), 200)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm bg-neutral-800 rounded-xl p-6 shadow"
        >
          <h1 className="text-xl font-semibold text-white mb-4">Admin Login</h1>
          <input
            type="password"
            className="w-full rounded-md bg-neutral-700 text-white px-3 py-2 outline-none"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {loginError && (
            <p className="text-red-300 text-sm mt-2">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-white/10 text-white py-2 hover:bg-white/20"
          >
            Sign in
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">RSVP Admin</h1>
            <p className="text-white/70 text-sm">Live responses & export</p>
          </div>
          <div className="flex gap-2">
            <a
              className="rounded-md border border-white/30 px-3 py-2 hover:bg-white/10"
              href="/api/admin/export.csv"
              target="_blank"
              rel="noreferrer"
            >
              Download CSV
            </a>
          </div>
        </header>

        {/* Summary */}
        <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Households" value={summary?.households ?? 0} />
          <SummaryCard label="Guests" value={summary?.totalGuests ?? 0} />
          <SummaryCard label="Yes" value={summary?.yes ?? 0} />
          <SummaryCard label="No" value={summary?.no ?? 0} />
          <SummaryCard
            label="Pending"
            value={summary?.pending ?? 0}
            className="col-span-2 sm:col-span-1"
          />
        </section>

        {/* Filters */}
        <section className="mt-6 flex flex-wrap items-center gap-3">
          <input
            className="rounded-md bg-neutral-800 px-3 py-2 outline-none"
            placeholder="Search name or household"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md bg-neutral-800 px-3 py-2 outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={loadData}
            className="rounded-md border border-white/30 px-3 py-2 hover:bg-white/10"
          >
            Refresh
          </button>
        </section>

        {/* Table */}
        <section className="mt-4">
          <div className="overflow-auto rounded-lg border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <Th>Household</Th>
                  <Th>Name</Th>
                  <Th>RSVP</Th>
                  <Th>Updated</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-white/70"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-white/70"
                    >
                      No results
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t border-white/10">
                      <Td>{r.household}</Td>
                      <Td>{r.fullName}</Td>
                      <Td>
                        <select
                          className="bg-neutral-800 rounded-md px-2 py-1 text-white text-sm"
                          value={r.rsvpStatus ?? ''}
                          onChange={async (e) => {
                            const newVal = e.target.value || null
                            await fetch(`${API}/api/admin/update`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ id: r.id, rsvp: newVal }),
                            })
                            // reload the table after update
                            loadData()
                          }}
                        >
                          <option value="">Pending</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </Td>
                      <Td>{new Date(r.updatedAt).toLocaleString()}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <ManageInvitesPanel />
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  className = '',
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className={`rounded-xl bg-white/5 p-4 ${className}`}>
      <div className="text-white/70 text-xs">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-left font-semibold">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2">{children}</td>
}

function ManageInvitesPanel() {
  const [loading, setLoading] = useState(false)

  // create household form
  const [label, setLabel] = useState('')
  const [phone, setPhone] = useState('')

  // households list
  const [households, setHouseholds] = useState<
    Array<{
      id: string
      label: string
      phone: string
      phoneLast4: string
      guests: { id: string; fullName: string }[]
    }>
  >([])

  // add guest inputs (per household)
  const [guestInputs, setGuestInputs] = useState<Record<string, string>>({})

  // bulk CSV
  const [csv, setCsv] = useState('')
  const [removeMissing, setRemoveMissing] = useState(false)
  const [bulkResult, setBulkResult] = useState<any>(null)

  async function loadHouseholds() {
    setLoading(true)
    const res = await fetch(`${API}/api/admin/households`, {
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      setHouseholds(data)
    }
    setLoading(false)
  }

  function toE164(input: string): string {
    const trimmed = input.trim()
    if (!trimmed.startsWith('+')) {
      throw new Error(
        'Please enter number in international format, e.g. +14165551234 or +9745XXXXXXX'
      )
    }
    const digits = trimmed.replace(/\D/g, '')
    if (digits.length < 7) {
      throw new Error(
        'Phone number is too short. Must be full international number.'
      )
    }
    return trimmed
  }

  useEffect(() => {
    loadHouseholds()
  }, [])

  async function createHousehold(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch(`${API}/api/admin/households`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label, phone: toE164(phone) }),
      })
      if (!res.ok) throw new Error('Failed to create household')
      setLabel('')
      setPhone('')
      await loadHouseholds()
    } catch (err: any) {
      alert(err.message || 'Failed to create household (check phone format).')
    }
  }

  async function updatePhone(id: string, newPhone: string) {
    try {
      const res = await fetch(`${API}/api/admin/households/${id}/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: newPhone }),
      })
      if (!res.ok) throw new Error('Failed to update phone')
      await loadHouseholds()
    } catch (err: any) {
      alert(err.message || 'Failed to update phone (check format).')
    }
  }

  async function addGuest(householdId: string) {
    const fullName = guestInputs[householdId]?.trim()
    if (!fullName) return
    const res = await fetch(
      `${API}/api/admin/households/${householdId}/guests`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullName }),
      }
    )
    if (!res.ok) alert('Failed to add guest')
    setGuestInputs((prev) => ({ ...prev, [householdId]: '' }))
    await loadHouseholds()
  }

  async function deleteGuest(id: string) {
    if (!confirm('Remove this guest?')) return
    const res = await fetch(`${API}/api/admin/guests/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) alert('Failed to delete guest')
    await loadHouseholds()
  }

  async function runBulkUpsert() {
    setBulkResult(null)
    const res = await fetch(`${API}/api/admin/bulk-upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ csv, removeMissing }),
    })
    if (res.ok) {
      const result = await res.json()
      setBulkResult(result)
      await loadHouseholds()
    } else {
      const err = await res.json().catch(() => ({}))
      alert('Bulk upsert failed: ' + (err.error || res.statusText))
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-3">Manage Invites</h2>

      {/* Create household */}
      <div className="rounded-xl bg-white/5 p-4">
        <h3 className="font-medium mb-2">Create Household</h3>
        <form
          onSubmit={createHousehold}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            className="bg-neutral-800 rounded-md px-3 py-2"
            placeholder="Household label (e.g., Ouda Family)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="bg-neutral-800 rounded-md px-3 py-2"
            placeholder="Phone (+1##########)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button className="rounded-md border border-white/30 px-3 py-2 hover:bg-white/10">
            Create
          </button>
        </form>
      </div>

      {/* Households list */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Households ({households.length})</h3>
          <button
            onClick={loadHouseholds}
            className="rounded-md border border-white/30 px-3 py-2 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-white/70 mt-3">Loading…</p>
        ) : households.length === 0 ? (
          <p className="text-white/70 mt-3">No households yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {households.map((h) => (
              <li key={h.id} className="rounded-xl bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <div className="font-semibold">{h.label}</div>
                    <div className="text-white/70 text-sm">
                      Last 4: {h.phoneLast4}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="bg-neutral-800 rounded-md px-3 py-2"
                      defaultValue={h.phone}
                      onBlur={(e) => {
                        const val = e.currentTarget.value.trim()
                        if (val && val !== h.phone) updatePhone(h.id, val)
                      }}
                    />
                    <span className="text-xs text-white/60">blur to save</span>
                  </div>
                </div>

                {/* Guests */}
                <div className="mt-3">
                  <div className="text-white/80 text-sm mb-1">
                    Guests ({h.guests.length})
                  </div>
                  <div className="space-y-2">
                    {h.guests.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                      >
                        <span>{g.fullName}</span>
                        <button
                          onClick={() => deleteGuest(g.id)}
                          className="text-red-300 text-sm hover:text-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      className="bg-neutral-800 rounded-md px-3 py-2 flex-1"
                      placeholder="Add guest (Full name)"
                      value={guestInputs[h.id] ?? ''}
                      onChange={(e) =>
                        setGuestInputs((prev) => ({
                          ...prev,
                          [h.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addGuest(h.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => addGuest(h.id)}
                      className="rounded-md border border-white/30 px-3 py-2 hover:bg-white/10"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bulk CSV */}
      <div className="mt-8 rounded-xl bg-white/5 p-4">
        <h3 className="font-medium mb-2">Bulk Add / Upsert (CSV)</h3>
        <p className="text-white/70 text-sm mb-2">
          Format: <code>household_label, phone, guest_full_name</code> per line.
          Example:
        </p>
        <pre className="bg-neutral-800 rounded-md p-3 text-xs overflow-auto">{`Ouda Family,+14165551234,Yousef Ouda
  Ouda Family,+14165551234,Nada Elsakka
  Smith Household,+16475550000,John Smith`}</pre>

        <textarea
          className="mt-3 w-full h-40 bg-neutral-800 rounded-md p-3"
          placeholder="Paste CSV here…"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="mt-2 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeMissing}
              onChange={(e) => setRemoveMissing(e.target.checked)}
            />
            Remove guests not listed (per household)
          </label>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={runBulkUpsert}
            className="rounded-md border border-white/30 px-3 py-2 hover:bg-white/10"
          >
            Run Bulk Upsert
          </button>
          {bulkResult && (
            <span className="text-white/70 text-sm">
              Added {bulkResult.createdGuests}, existing{' '}
              {bulkResult.existingGuests}, removed {bulkResult.removedGuests},
              households +{bulkResult.createdHouseholds} (phones updated{' '}
              {bulkResult.updatedPhones})
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
