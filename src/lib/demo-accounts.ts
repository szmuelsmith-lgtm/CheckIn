export const DEMO_PASSWORD = "checkin-dev-2024";

export const DEMO_ACCOUNTS = [
  {
    id:       "athlete" as const,
    label:    "Student-Athlete",
    email:    "checkin.athlete.test@mailinator.com",
    redirect: "/athlete/dashboard",
    color:    "#059669",
    bg:       "#f0fdf4",
    border:   "#86efac",
  },
  {
    id:       "coach" as const,
    label:    "Head Coach",
    email:    "checkin.coach.test@mailinator.com",
    redirect: "/coach/dashboard",
    color:    "#2563eb",
    bg:       "#eff6ff",
    border:   "#93c5fd",
  },
  {
    id:       "psychiatrist" as const,
    label:    "Counselor / Sport Psychologist",
    email:    "checkin.psych.test@mailinator.com",
    redirect: "/psychiatrist/dashboard",
    color:    "#7c3aed",
    bg:       "#f5f3ff",
    border:   "#c4b5fd",
  },
  {
    id:       "admin" as const,
    label:    "Athletic Administrator",
    email:    "checkin.admin.test@mailinator.com",
    redirect: "/admin/dashboard",
    color:    "#0369a1",
    bg:       "#f0f9ff",
    border:   "#7dd3fc",
  },
] as const;

export type DemoAccount = typeof DEMO_ACCOUNTS[number];
