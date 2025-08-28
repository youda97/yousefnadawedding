export type Step = "find" | "verifyMethod" | "otp" | "household" | "confirmation";

export type Guest = {
  id: string;
  fullName: string;
  rsvp?: "yes" | "no";
};

export type Household = {
  id: string;
  displayName: string; // shown after verification
  guests: Guest[];
};
