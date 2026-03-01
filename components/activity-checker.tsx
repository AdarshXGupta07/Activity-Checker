"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Day = {
  key: string;
  label: string;
};

type Habit = {
  id: string;
  name: string;
  category: string;
  notes?: string;
  completed: Record<string, boolean>;
};

const DAYS: Day[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" }
];

const STORAGE_KEY = "activity-checker-v1";

const defaultHabits: Habit[] = [
  {
    id: "water",
    name: "Drink 2L water",
    category: "Health",
    notes: "Hydration goal",
    completed: Object.fromEntries(DAYS.map((day) => [day.key, false]))
  },
  {
    id: "workout",
    name: "Workout 30 mins",
    category: "Fitness",
    notes: "Any activity counts",
    completed: Object.fromEntries(DAYS.map((day) => [day.key, false]))
  },
  {
    id: "focus",
    name: "Deep work session",
    category: "Productivity",
    notes: "At least 90 mins",
    completed: Object.fromEntries(DAYS.map((day) => [day.key, false]))
  }
];

function buildEmptyCompletion() {
  return Object.fromEntries(DAYS.map((day) => [day.key, false])) as Record<string, boolean>;
}

export default function ActivityChecker() {
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [newHabit, setNewHabit] = useState("");
  const [newCategory, setNewCategory] = useState("Personal");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Habit[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHabits(parsed);
        }
      } catch {
        setHabits(defaultHabits);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const totals = useMemo(() => {
    const totalPossible = habits.length * DAYS.length;
    const done = habits.reduce(
      (acc, habit) =>
        acc + DAYS.reduce((dayAcc, day) => dayAcc + (habit.completed[day.key] ? 1 : 0), 0),
      0
    );
    const pct = totalPossible ? Math.round((done / totalPossible) * 100) : 0;

    const daily = DAYS.map((day) => {
      const count = habits.reduce((acc, habit) => acc + (habit.completed[day.key] ? 1 : 0), 0);
      return { day: day.label, completed: count, missed: habits.length - count };
    });

    const byHabit = habits.map((habit) => ({
      name: habit.name,
      category: habit.category,
      score: DAYS.reduce((acc, day) => acc + (habit.completed[day.key] ? 1 : 0), 0)
    }));

    return { done, totalPossible, pct, daily, byHabit };
  }, [habits]);

  const feedback = useMemo(() => {
    if (totals.pct >= 85)
      return "Outstanding consistency this week. Keep your momentum and consider a stretch goal next week.";
    if (totals.pct >= 65)
      return "Great effort. You're building a stable routine—focus on one weak day to improve further.";
    if (totals.pct >= 40)
      return "Good start. Try reducing the number of habits or setting reminders to improve completion.";
    return "This week was challenging. Reset with fewer habits and prioritize small wins for momentum.";
  }, [totals.pct]);

  const toggleHabit = (habitId: string, dayKey: string) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              completed: {
                ...habit.completed,
                [dayKey]: !habit.completed[dayKey]
              }
            }
          : habit
      )
    );
  };

  const addHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newHabit.trim();
    if (!trimmed) return;

    const id = `${trimmed.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    setHabits((prev) => [
      ...prev,
      {
        id,
        name: trimmed,
        category: newCategory,
        notes: newNotes.trim(),
        completed: buildEmptyCompletion()
      }
    ]);

    setNewHabit("");
    setNewCategory("Personal");
    setNewNotes("");
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-zinc-950">
        <h1 className="text-3xl font-semibold tracking-tight">Weekly Activity Checker</h1>
        <p className="mt-2 text-zinc-400">
          Tick your activities daily, track custom goals, and get automatic weekly feedback.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-medium">Checklist</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="p-2">Activity</th>
                  <th className="p-2">Category</th>
                  {DAYS.map((day) => (
                    <th key={day.key} className="p-2 text-center">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id} className="border-b border-zinc-800/60">
                    <td className="p-2 align-top">
                      <p className="font-medium text-zinc-100">{habit.name}</p>
                      {habit.notes ? <p className="text-xs text-zinc-500">{habit.notes}</p> : null}
                    </td>
                    <td className="p-2 text-zinc-300">{habit.category}</td>
                    {DAYS.map((day) => (
                      <td key={day.key} className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleHabit(habit.id, day.key)}
                          className={`h-8 w-8 rounded-md border text-lg transition ${
                            habit.completed[day.key]
                              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                              : "border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-500"
                          }`}
                          aria-label={`Toggle ${habit.name} on ${day.label}`}
                        >
                          {habit.completed[day.key] ? "✓" : "·"}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-medium">Weekly Analysis</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Completed {totals.done} of {totals.totalPossible} tracked items ({totals.pct}%).
            </p>
            <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
              {feedback}
            </p>
          </div>

          <form onSubmit={addHabit} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-medium">Add New Activity</h2>
            <div className="mt-3 space-y-3">
              <input
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                placeholder="Activity name"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
              />
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
              />
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Optional notes"
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-cyan-400"
              >
                Add Activity
              </button>
            </div>
          </form>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="h-80 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-xl font-medium">Daily Progress Graph</h2>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={totals.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="day" stroke="#a1a1aa" />
              <YAxis allowDecimals={false} stroke="#a1a1aa" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="missed" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="h-80 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-xl font-medium">Activity Breakdown</h2>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={totals.byHabit} layout="vertical" margin={{ left: 18, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis type="number" allowDecimals={false} stroke="#a1a1aa" domain={[0, 7]} />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                stroke="#a1a1aa"
                tickFormatter={(value) => `${String(value).slice(0, 14)}${String(value).length > 14 ? "…" : ""}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {totals.byHabit.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.score >= 5 ? "#22c55e" : entry.score >= 3 ? "#f59e0b" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>
    </main>
  );
}
