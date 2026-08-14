import { z } from "zod";

// Client-side shape validation only — auth itself is device-id based (ORCHESTRATOR_CONTRACT.md
// §6), nothing here is ever sent to a backend. This just keeps the cosmetic sign-up/sign-in
// forms from accepting obviously-malformed input before they hand off to the real identity flow.
export const emailSchema = z.email("Enter a valid email address");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpFieldErrors = Partial<Record<keyof z.infer<typeof signUpSchema>, string>>;

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type SignInFieldErrors = Partial<Record<keyof z.infer<typeof signInSchema>, string>>;

export const verifyCodeSchema = z
  .string()
  .length(6, "Enter all 6 digits")
  .regex(/^\d{6}$/, "Code must be numbers only");

// Runs the schema and flattens the first ZodError issue per field into a plain object a form
// can render inline — avoids every screen re-implementing the same zod-error -> UI-error mapping.
// Takes the schema + raw input (rather than a pre-computed result) so the return type is
// inferred straight from the schema, not from a version-specific Zod result type name.
export function firstFieldErrors<T extends z.ZodType>(
  schema: T,
  data: unknown,
): { success: true } | { success: false; errors: Partial<Record<keyof z.infer<T>, string>> } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true };
  const errors: Partial<Record<keyof z.infer<T>, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof z.infer<T> | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}
