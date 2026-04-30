export interface SignInWithOAuthInput {
  provider: "google";
}

export interface Auth {
  signInWithOAuth: (input: SignInWithOAuthInput) => Promise<void>;
}
