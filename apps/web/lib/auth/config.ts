import * as v from "valibot";

const authConfigSchema = v.variant("isMocked", [
  v.object({
    isMocked: v.literal(true),
    email: v.pipe(v.string(), v.email()),
    password: v.pipe(v.string(), v.minLength(6)),
  }),
  v.object({
    isMocked: v.literal(false),
  }),
]);

export type AuthConfig = v.InferOutput<typeof authConfigSchema>;

export function getAuthConfig(): AuthConfig {
  return v.parse(authConfigSchema, {
    isMocked: process.env.NEXT_PUBLIC_IS_MOCKED === "true",
    email: process.env.NEXT_PUBLIC_MOCK_AUTH_EMAIL,
    password: process.env.NEXT_PUBLIC_MOCK_AUTH_PASSWORD,
  });
}
